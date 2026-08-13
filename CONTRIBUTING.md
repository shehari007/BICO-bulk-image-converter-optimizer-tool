# Contributing

Thanks for considering it. This is a small project, so the process is light.

## Getting set up

```bash
git clone https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool.git
cd BICO-bulk-image-converter-optimizer-tool
npm install
npm run dev
```

`npm run dev` starts Vite for the renderer with hot reload and restarts the main process when
anything under `src/main` or `src/preload` changes. DevTools open detached.

The dev server runs on port 5199. It is fixed rather than automatic so the main process can wait
on a known address, and it fails loudly if the port is taken instead of quietly moving, since a
window waiting on an address nothing is serving looks like a hang rather than a clash. If
something else on your machine already has 5199:

```bash
BICO_DEV_PORT=5210 npm run dev     # or set BICO_DEV_PORT=5210 on Windows
```

You need Node 20.19 or newer. `sharp` ships prebuilt binaries for common platforms, so a native
toolchain is usually not required. If `npm install` does try to compile, install Visual Studio
Build Tools on Windows, the Xcode command line tools on macOS, or `build-essential` on Linux.

## Before opening a pull request

```bash
npm run typecheck   # both the Node side and the web side
npm run lint
npm run format:check
npm run build       # catches anything only the production bundle finds
```

All four have to pass.

## Where things live

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first. The short version:

| Path | What belongs here |
|---|---|
| `src/shared/` | Anything that crosses a process boundary. Types, IPC channel names, the format registry, defaults, presets, filename templating. |
| `src/main/` | Electron main process. Window, menus, IPC handlers, the scheduler, the worker pool, persistence. |
| `src/main/workers/` | The `sharp` pipeline. This is where image processing happens. |
| `src/preload/` | The bridge. Adding a capability here widens what the renderer can do, so think about it. |
| `src/renderer/` | React. No Node, no `sharp`, no filesystem. |
| `src/renderer/src/gpu/` | The WebGPU lanes and the WGSL shaders. |

## Conventions

**TypeScript is strict, including `noUncheckedIndexedAccess`.** Indexing an array gives you
`T | undefined`, so guard it. `any` is not allowed and neither is `@ts-ignore`. If a type is
genuinely open, use `unknown` and narrow it.

**Comments explain why, not what.** A short block above anything non obvious is welcome. Narrating
what the next line does is not. If a piece of code looks wrong but is deliberate, say why, because
that is the comment someone will actually need in a year.

**No em dash style double hyphens in prose.** Use a comma, a colon, or restructure the sentence.

**Named exports for components**, declared as `export function Name(props: Props): JSX.Element`.

**Narrow store selectors.** `useAppStore((s) => s.items)`, never the whole store object.

**The interface has to survive a 720 pixel wide window.** Use flex wrap, `min-width: 0` and
ellipsis. Do not put a fixed pixel width on anything holding text.

## Making a change

**Adding an output format or a setting** is documented at the end of
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Both start in `src/shared/` and TypeScript points at
everything else that needs touching.

**Adding a privileged operation** means four files: the channel name in `shared/channels.ts`, the
method in `shared/api.ts`, the handler in `main/ipc/index.ts` and the binding in `preload/index.ts`.
Keep the handler thin and put the real logic in a service, so it can be reasoned about without an
Electron window and so the hot folder can drive the same path.

**Touching the GPU pipeline** means checking the CPU fallback still works. Force it by setting the
backend to CPU in the performance section and confirming the output is identical. Colour space
mistakes show up as a subtle brightness shift, so compare the actual pixels rather than eyeballing.

## Reporting a bug

Open **Diagnostics** from the toolbar and press **Copy report**. That puts the full environment,
the GPU adapter table and the Chromium graphics status on your clipboard as markdown. Paste it into
the issue.

If it is a conversion problem, the settings matter as much as the environment, so export the preset
you were using and attach it.

## Licence

Contributions are accepted under the [MIT licence](LICENSE).
