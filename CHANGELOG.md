# Changelog

All notable changes to BICO are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.0

A complete rewrite. The interface, the processing engine, the security model and the build system
were all replaced.

### Added

**Processing**

- Native worker thread pool. Encoding runs off both the main thread and the interface thread, so
  the window stays responsive through a run of any size. The pool is sized to the machine and can
  be overridden.
- Optional GPU acceleration through WebGPU compute shaders covering resize, sharpen, blur,
  grayscale, sepia, invert, brightness, saturation, hue, contrast, gamma, tint, flatten, normalize
  and watermark compositing.
- Multi adapter support. Machines with a discrete and an integrated GPU can run one processing lane
  on each. Adapters are enumerated at startup and classified as discrete, integrated or software.
- Automatic backend selection per image, with a silent fallback to the CPU pipeline on any GPU
  failure, device loss or driver reset.
- Four new output formats: HEIF, JPEG XL, JPEG 2000 and a passthrough mode that keeps each file
  in its original container.
- JPEG XL provided by a bundled WebAssembly build of libjxl, both directions. No prebuilt sharp
  binary includes libjxl, so this is the only way the format works without asking every user to
  compile a custom libvips. It costs about 2 MB and behaves identically on all three platforms.
  Measured against a 1920 by 1080 photograph it produced a smaller file than AVIF and encoded
  roughly three times faster. Metadata and animation are not carried into a JPEG XL output, which
  the format panel states plainly.
- Real encoder controls per format rather than one shared quality slider, including MozJPEG with
  trellis quantisation and scan optimisation, PNG palette quantisation with dithering, WebP near
  lossless and smart subsampling, AVIF effort and chroma subsampling, TIFF compression schemes,
  predictors, bit depth and pyramidal tiling, GIF palette size and dithering, and JPEG XL distance.
- Size targeting. Give a byte budget and the quality scale is searched per image until the output
  fits, decoding the source only once across the search.
- Variant output. One decode can produce several renditions at different sizes, formats and
  qualities in a single pass, which is how a responsive image set gets generated.
- Adjustments: CLAHE, median filtering, hue rotation, lightness, contrast, sepia, invert, tint and
  configurable normalize percentiles.
- Watermarking with text or an image, nine anchor positions, opacity, scale, rotation, margins and
  tiling.
- Crop with manual, aspect ratio and automatic border trim modes.
- Eight resize strategies including longest edge, shortest edge, percentage and target megapixels,
  with selectable resampling kernels.

**Interface**

- Live before and after preview with a wipe comparison, rendered at the current settings, showing
  the projected full resolution output size.
- An About screen. The previous release had none. It covers the product, the format matrix with
  what the local libvips build can actually read and write, and credits with real versions.
- A diagnostics panel with the full environment report, the GPU adapter table, the Chromium
  graphics feature status, a live log tail and preferences, plus a one click copy of the whole
  report as markdown for bug reports.
- Command palette on `Ctrl/Cmd + K`.
- Run history with per run statistics kept across restarts.
- Preset system with fifteen built in presets, user presets, and import and export as JSON.
- Grid and table views for the queue, with search and status filtering.
- Light theme, dark theme and follow the system, plus a configurable accent colour and a compact
  density mode.
- Taskbar progress on Windows and macOS.
- Per file status showing which backend and which device handled each image.
- Optional CSV audit report written alongside the output.

- Full interface translation into English, Turkish and Arabic. Every string is translated,
  including the explanatory copy under each control. Arabic switches the whole layout to right
  to left. Translations are typed against the English key set, so a string added later cannot
  ship untranslated without failing the build.
- Eight themes as complete palettes rather than accent swaps: Midnight, Graphite, Nord, Dracula,
  Forest, Daylight, Paper and High Contrast, each shown as a live miniature before selection. The
  light and dark decision and the palette choice are separate settings, so a theme does not
  disable following the system.
- A lifetime statistics panel: total images converted, space saved, time spent, a ninety day
  activity chart, a per format breakdown, the GPU versus CPU split and the best single run.
  Stored locally and sent nowhere. Failed images do not count towards the byte figures.
- JPEG 2000, restored through a bundled WebAssembly build of ImageMagick with OpenJPEG. Measured
  rather than assumed: the jp2:rate define has no effect, quality is the working lever, and the
  quality curve is steep, so the slider is mapped to match. Verified to write a real JP2
  container and read it back.
- Colour throughout the interface. Icons are larger and each carries a tone, so the settings
  sidebar reads as a colour coded list rather than a wall of grey. The real product mark replaces
  the placeholder icon in the toolbar and the About screen.
- The window title now carries the build identity, for example BICO 3.0.0 with Windows x64, and
  the page can no longer overwrite it. A screenshot in a bug report now says which build produced it.
- Preset sharing is stated plainly rather than buried: a preset is a small JSON file, Export
  writes one, Import reads one or many, and Export all writes the whole set, so a preset can be
  handed to a colleague, committed next to a project or published for other people.
- Text on a solid colour is chosen by perceptual contrast rather than by the WCAG ratio. That
  ratio weights green at 0.7152 and blue at 0.0722, so a saturated blue scores as a light colour
  and the ratio test puts black on it: the default accent measured 6.56 to 1 with black against
  3.20 to 1 with white, and the buttons shipped with black text on blue. Judged perceptually the
  same accent scores 64.2 with white against 45.2 with black, which is also what every mainstream
  design system does with a blue button.
- Hover and pressed shades are generated rather than inherited. antd paints all three states of a
  solid button with one text colour and three backgrounds, and its pressed shade is darker, which
  left black text stranded on the mid tones of Nord, Dracula and Forest. The shades are now made
  by moving lightness in Oklab, which keeps the hue and the vividness, and they move away from the
  text colour so contrast rises as the button is used instead of falling. Checked across every
  colour the accent picker can produce: no state disagrees with the text colour it is painted
  with, and no state is indistinguishable from the one before it.
- Colours are measured as Ant Design paints them, not as they are handed over. The dark algorithm
  regenerates the accent against a dark background, so #4c8dff is painted #447bdc, and judging the
  seed judged a colour that never reaches the screen. That was worth two full grades on Nord and
  Dracula.
- Grid cards now warm their border towards the accent on hover. The two pixel lift was the only
  feedback they had, which is easy to miss on a grid of thumbnails at differing heights.
- One typeface across every language. IBM Plex is bundled with the build, so the interface looks
  the same on all three platforms instead of borrowing whatever the system happened to offer, and
  Arabic is set in Plex Sans Arabic, a designed companion to the Latin rather than an unrelated
  fallback face. Figures are tabular wherever numbers sit in a column, so the queue and the
  statistics tiles stop jittering as values update.
- A welcome screen on first run, and once again after an upgrade. It names the release, lists what
  changed, and reports the hardware it found: the processor, the number of worker threads it
  started and the graphics adapter it will use, or a plain statement that it found none. A user who
  never opens diagnostics otherwise has no way of knowing whether the GPU lane is doing anything.
  It animates in, it is translated like the rest of the interface, and a do not show again checkbox
  records the version so it stays gone until there is something new to say.

**Workflow**

- Recursive folder import. Dropping a directory walks it, skipping symlink cycles and directories
  that never hold user content.
- Hot folder automation. Anything dropped into a watched directory is converted automatically,
  with a settle timer so files still being written are not picked up half copied.
- A tray icon showing live run progress, with pause, cancel and quit, plus an optional keep
  running in the tray mode so a watched folder survives closing the window.
- A system notification when a run finishes, carrying the counts and the bytes saved.
- Output structure control: flat, mirror the source tree, group by format, or group by date.
- Filename templating with fourteen tokens, case transforms and filesystem safe sanitisation.
- Collision policy of rename, overwrite or skip.
- A skip if larger option that keeps the original when the conversion would grow it.
- In place output as a third target alongside folder and ZIP.
- Automatic updates through the GitHub releases feed. Windows and Linux download and install in
  place. macOS reports the new version and opens the releases page for a manual download.

### Changed

- **The renderer no longer has Node access.** `contextIsolation` is on and `nodeIntegration` is
  off. Every privileged operation goes through a typed preload bridge, which is the complete list
  of what the interface is able to do. Version 2.x exposed the entire Node API and `sharp` itself
  to the page.
- Source images are read by the renderer through a custom `bico-src` scheme carrying an opaque id
  rather than a filesystem path, so the page cannot request a file the user did not import.
- ZIP archives are streamed. Entries are appended as each image completes rather than the whole run
  being held in memory and assembled at the end.
- Archives are written directly to a chosen path instead of going through the browser download
  mechanism.
- Cancellation is cooperative. Work already inside a worker completes so nothing is left half
  written, and the archive is always closed cleanly.
- Progress is pushed on a timer instead of once per file, so a run over thousands of small images
  no longer spends more time repainting than converting.
- Thumbnails are generated natively and cached with a bounded eviction policy, rather than holding
  an object URL per file for the lifetime of the queue.
- The window can be resized down to 720 pixels wide. The sidebar becomes a drawer, the queue drops
  to a compact column set, and the toolbar collapses to an overflow menu.
- Window position and size are restored between sessions, and a saved position on a display that is
  no longer connected is discarded rather than opening the window off screen.
- Settings persistence uses atomic writes, so a crash during a save cannot corrupt the file.

### Removed

- Create React App and the Webpack toolchain, replaced by electron-vite and Vite.
- JavaScript throughout, replaced by TypeScript with a single shared contract compiled by every
  process.
- The `enableRemoteModule` and `nodeIntegration` renderer permissions.
- The in page tips alert, replaced by contextual help on the controls themselves.

### Upgraded

| Package | 2.0.0 | 3.0.0 |
|---|---|---|
| Electron | 26 | 43 |
| React | 18.3 | 19.2 |
| Ant Design | 5.22 | 6.6 |
| sharp | 0.33 | 0.35 |
| electron-builder | 24 | 26 |
| Build tooling | react-scripts 5 | electron-vite 5 with Vite 7 |
| Language | JavaScript | TypeScript 5.9 |

### Fixed

- The format taglines and descriptions are translated. They were rendered straight from the
  capability table in shared code, so they stayed English in Turkish and Arabic and sat outside
  the translation contract entirely. The words now live in the dictionaries, where a missing one
  fails the build like every other string.
- The helper text under the controls is roughly half its previous length. It had grown into
  paragraphs explaining why each setting exists, which is a poor trade for something read while
  the user is trying to do something else. Every hint is now one line, the facts and the warnings
  are kept, and the reasoning is gone. The settings sidebar averaged 117 characters a hint and now
  averages 69, with nothing left over 140.
- Installing over 2.x no longer leaves two copies of BICO on the machine. Windows keys its
  uninstall entry on a guid derived from the application id, that id changed in this release, and
  the result would have been two entries in Apps and Features, two Start Menu shortcuts and two
  program folders, with neither installation aware of the other. The installer now registers under
  the identity 2.x used, so the standard upgrade path finds the old version and uninstalls it
  before writing this one. The install folder is renamed to match the current product name while
  keeping whatever drive or directory the old version was placed in.
- Conversions no longer freeze the interface. In 2.x `sharp` ran on the renderer thread, so the
  window stopped repainting for the duration of every batch.
- Large batches no longer exhaust memory. The previous release accumulated every output buffer plus
  a preview object URL per file before writing anything.
- The progress percentage is now derived from settled work rather than an index that could report
  completion before the last images finished.
- Duplicate output names are resolved deterministically instead of racing when several files
  finished at the same moment.
- Filenames containing characters that are illegal on Windows are sanitised rather than failing the
  write.
- Files handed to the app by the shell, for example through Open With, are now imported.
- A second launch focuses the existing window instead of starting a competing instance with its own
  worker pool.

## 2.0.0

- Restyled dark interface with a responsive layout and improved tables.
- File previews, drag and drop, duplicate detection and estimated savings per file.
- Start confirmation, pause and resume, stop with a partial save note, and a clearable list.
- Choice of ZIP or folder output with a success summary.
- Parallel processing controller and estimated output size calculation.
- Windows installers for x64 and arm64.

## 1.5.0

- AVIF output with lossless compression and grayscale support.
- Per image progress bar with percentage.
- Clear list action.

## 1.0.0

- First release. Bulk conversion across a handful of formats with basic quality controls.
