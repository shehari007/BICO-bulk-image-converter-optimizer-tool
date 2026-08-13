# Architecture

This document explains how BICO is put together and, more usefully, why each part is where it is.

## Processes

Electron gives you three JavaScript contexts. BICO uses all three plus a pool of worker threads.

```
+=====================================================================+
|  Main process (Node)                                                |
|                                                                     |
|   window.ts        window lifecycle, geometry persistence           |
|   protocol.ts      the bico-src scheme                              |
|   menu.ts          native menu, forwards commands to the renderer   |
|   tray.ts          tray icon, run progress, close to tray, notices  |
|   ipc/index.ts     every handler the renderer can reach             |
|                                                                     |
|   services/                                                         |
|     scheduler.ts   owns a run, dispatches to CPU and GPU lanes      |
|     pool.ts        worker_threads pool, one sharp per thread        |
|     gpu-bridge.ts  main side of the GPU request protocol            |
|     files.ts       the import registry, id to path                  |
|     zip.ts         streaming archive writer                         |
|     inspect.ts     probe, thumbnail and EXIF                        |
|     watcher.ts     hot folder                                       |
|     store.ts       atomic JSON persistence                          |
+=====================================================================+
        |                          |                        |
        | worker_threads           | contextBridge          | IPC
        v                          v                        v
+==================+   +=======================+   +====================+
| Worker threads   |   | Preload               |   | Renderer           |
|                  |   |                       |   |                    |
| image.worker.ts  |   | index.ts exposes      |   | React 19, antd 6   |
| the full sharp   |   | window.bico, the      |   |                    |
| pipeline         |   | complete privileged   |   | gpu/               |
|                  |   | surface               |   |  one Web Worker    |
| N = cores - 1    |   |                       |   |  per GPU adapter   |
+==================+   +=======================+   +====================+
```

## The contract

`src/shared/types.ts` defines every value that crosses a process boundary. All four contexts
compile against it.

This is the single most load bearing decision in the codebase. The renderer sends a
`ConversionSettings` object that travels through IPC, into the scheduler, across a
`postMessage` into a worker thread, and finally into a `sharp` call. In version 2 that object was
untyped, and a renamed field would surface as an image silently converted with the wrong settings.
Now it is a build error in all four places at once.

The rule is: nothing that crosses a boundary is declared anywhere except `shared/`.

## Security model

The renderer runs with `nodeIntegration: false` and `contextIsolation: true`. It has no `require`,
no `fs`, and no access to `sharp`. Everything it can do is the `BicoApi` interface in
`src/shared/api.ts`, implemented by the preload.

Reading source images is the interesting case. The GPU lanes need the original bytes, and passing
them through IPC would mean copying every file through the main process. Instead the main process
registers a custom `bico-src` scheme:

```
bico-src://file/<opaque id>
```

`protocol.handle` resolves the id against the import registry in `services/files.ts`. If the id was
never imported, the request 404s. The renderer therefore cannot construct a URL for a file the user
did not add to the queue, which removes the path traversal surface entirely rather than trying to
validate paths.

`shell.openExternal` is restricted to `http` and `https`. Handing arbitrary schemes to the shell is
how a link turns into command execution on Windows.

## The processing pipeline

Everything happens in `src/main/workers/image.worker.ts`, in this order:

1. Open with the animation, pixel limit and sequential read flags derived from the settings.
2. Auto orient from EXIF. This has to come before any explicit rotation or the two compose wrongly.
3. Crop: manual, aspect ratio or automatic border trim.
4. Resize according to the chosen strategy, fit, position and kernel.
5. Explicit rotate, then flip and flop.
6. Padding.
7. Colour work: grayscale, modulate, contrast, invert, tint, sepia, gamma, normalize, CLAHE,
   median, blur, sharpen, flatten.
8. Watermark composite.
9. Metadata policy.
10. Encode.

Steps 1 through 8 are skipped entirely when a GPU lane already produced the pixels.

### Decode once

Size targeting binary searches the quality scale. The naive implementation reopens the source on
every iteration, which makes a seven step search seven full decodes. Instead the pipeline decodes
to a raw buffer once and re encodes from that buffer, so the search costs one decode plus N cheap
encodes.

The same raw buffer serves the variant outputs.

## Scheduling

`services/scheduler.ts` owns exactly one run. Files are not partitioned across lanes up front.
Instead every lane pulls from a shared cursor:

```
  lane 0 (gpu)  ->  claim next  ->  process  ->  claim next  ->  ...
  lane 1 (gpu)  ->  claim next  ->  process  ->  ...
  lane 2 (cpu)  ->  claim next  ->  ...
  lane 3 (cpu)  ->  ...
```

Static partitioning looks tidier and performs badly. Image cost varies by an order of magnitude
inside a single folder, so a lane handed the cheap half finishes long before the others and then
sits idle. Pulling from a cursor keeps every lane busy until the queue is genuinely empty.

Progress is pushed on a 200 millisecond timer rather than after each file. A run over ten thousand
thumbnails would otherwise generate ten thousand IPC messages and spend more time repainting the
progress bar than converting.

Cancellation sets a flag that lanes check before claiming the next file. Work already inside a
worker is allowed to finish, so no output is ever left half written and the archive closes cleanly.

## GPU acceleration

WebGPU exists only in the renderer, so the main process cannot call it. The protocol is:

```
  scheduler                gpu-bridge              renderer lanes
      |                        |                         |
      |--- submit(task) ------>|                         |
      |                        |--- EVENT.gpuTask ------>|
      |                        |                         | fetch bico-src
      |                        |                         | createImageBitmap
      |                        |                         | compute shaders
      |                        |                         | encode or read back
      |                        |<-- SEND.gpuTaskResult --|
      |<-- GpuTaskResult ------|                         |
      |
      | on ok:      hand the bytes or pixels to a worker for writing
      | on failure: rerun the whole image on the CPU pipeline
```

`gpuBridge.submit` never rejects. A GPU failure is a routing decision, not an error, so it always
resolves and the scheduler takes the CPU path. There is a sixty second timeout because a lost
device can leave a worker wedged, and hitting that timeout is always a real fault rather than a
slow machine.

### Two routes

**Full route.** The target is JPEG, PNG or WebP, all of which Chromium can encode. The lane
decodes, processes and encodes without the image ever crossing IPC as raw pixels. Only the encoded
bytes come back.

The full route is only chosen when nothing later in the pipeline needs a real decoder, so metadata
retention, size targeting and variant output all force the assist route.

**Assist route.** The target is AVIF, TIFF, GIF, HEIF or JPEG XL. The lane returns
straight RGBA and `sharp` performs the encode. This costs one raw pixel transfer but still moves
the resize and filter work onto the adapter.

Animated sources always take the CPU route, because `createImageBitmap` only ever hands back the
first frame and using it would silently drop the animation.

### Colour management

The shaders sample, convert sRGB to linear, do the arithmetic in linear light, then convert back.
Skipping that is the classic mistake that makes GPU resizes visibly darker than CPU ones, and it is
the reason resampling in gamma space is wrong.

### Multi adapter

`device.ts` requests adapters at both `high-performance` and `low-power`, then deduplicates on the
vendor, architecture, device and description tuple, because Chromium may return the same physical
adapter for both. Each distinct adapter becomes a lane with its own `GPUDevice` in its own Web
Worker.

The main process also appends `force_high_performance_gpu` at startup. On a laptop with switchable
graphics, the GPU process defaults to the integrated chip to save power, which would leave the
discrete card idle.

## Memory

Three places would otherwise dominate memory on a large run:

- **The ZIP.** Written as a stream, so peak cost is one image rather than the whole run.
- **Thumbnails.** Generated natively as small WebP data URLs and cached with a bounded first in
  first out eviction, rather than one object URL per file held for the lifetime of the queue.
- **The queue.** The renderer holds metadata and an id per file, never the file contents.

`sequentialRead` keeps `libvips` to a few scanlines when the source is a large progressive JPEG or
a striped TIFF, and `maxPixels` refuses a decompression bomb rather than exhausting the heap.

## Build

`electron-vite` builds three targets from one config:

| Target | Output | Format | Notes |
|---|---|---|---|
| main | `out/main/index.js` | CommonJS | `sharp`, `archiver`, `exifr` and `electron-updater` stay external |
| main worker | `out/main/workers/image.worker.js` | CommonJS | A second entry point, spawned by the pool |
| preload | `out/preload/index.js` | CommonJS | |
| renderer | `out/renderer/` | ES modules | GPU workers built as ES module workers |

Native modules cannot be loaded from inside an asar archive, so `sharp` and its `@img` platform
packages are unpacked next to it by `electron-builder`.

## Adding a format

1. Add the id to `OutputFormat` in `src/shared/types.ts`.
2. Add a `FormatCapabilities` entry to `FORMATS` in `src/shared/formats.ts`. The settings panel
   builds itself from this, so the correct controls appear with no UI change.
3. Add the encoder options branch in `buildEncodeOptions` in the worker.
4. If Chromium can encode it in a canvas, set `browserEncodable` and the GPU full route picks it up
   automatically.

## Adding a setting

1. Add the field to the matching interface in `src/shared/types.ts`.
2. Give it a value in `DEFAULT_SETTINGS` in `src/shared/defaults.ts`. Persisted settings are merged
   on top of the defaults, so existing installs get the new field rather than `undefined`.
3. Read it in the worker.
4. Add the control to the relevant section under `src/renderer/src/components/settings/`.

TypeScript will point at every place that needs updating.
