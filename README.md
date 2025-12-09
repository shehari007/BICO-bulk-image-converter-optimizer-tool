

<div align="center">
  <a href="https://choosealicense.com/licenses/mit/">
    <img src="https://img.shields.io/badge/LICENSE-MIT-blue?style=flat-square" alt="MIT License">
  </a>
  
  <img src="https://img.shields.io/badge/BUILD-PASSING-green?style=flat-square" alt="Build Passing">
</div>

<br/>
<div align="center">
    <img src="https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool/blob/main/public/logo.png?raw=true" height="250px" width="250px">
</div>


# BICO - Bulk Image Converter & Optimizer (React + Electron)

## Current Version
- v2.0.0 (December 2025)
- Windows builds ship as x64 and arm64; mac builds follow host arch automatically.

BICO is a pro-grade bulk image converter and optimizer. Convert, compress, and batch-export with previews, pause/resume, ZIP or folder output, and advanced Sharp-powered processing.

## Tech Stack

Ant Design 5+, Electron, Node SHARP


## Features

- Broad format support: webp, jpg, png, tiff, jp2, heif, avif, jxl, raw, gif, bmp.
- Dark, responsive UI with drag-and-drop, inline previews, file table, and estimated output sizes.
- Dual outputs: ZIP archive or direct-to-folder with clickable path and open-folder action.
- Conversion controls: confirmation modal, progress with pause/resume/stop, success summary with savings.
- Quality & compression controls per format (JPEG/PNG/AVIF/WebP/GIF/TIFF) with presets.
- Advanced options: resize, rotate/flip/flop, grayscale, sharpen, normalize, MozJPEG, progressive, lossless, metadata preservation.
- Parallel processing and batch-safe Sharp pipeline for speed and stability.
- Notifications and system-friendly Electron window sizing.

## Changelog (2.0.0)

- New UI/UX: fully restyled dark theme, responsive layout, padded headers, improved tables.
- File handling: previews, drag & drop, duplicate detection, better status chips, estimated savings per file and total.
- Controls: start confirmation modal, pause/resume, stop with partial-save note, clear list, clickable output folder.
- Output: choice of ZIP or folder, success modal with processed/failed counts and space saved, clickable open-folder button.
- Performance: parallel processing controller, estimated output size calculation, better progress reporting.
- Platform: window opens centered (not forced fullscreen); Windows installers built for x64 and arm64; footer shows runtime arch.


## Pre Requirements For Local Development

- React 18+
- Node, NPM
- VSCODE With ES6+ Module

## Installation

Clone the project

```bash
git clone https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool.git
```

Go to the project directory

```bash
cd BICO-bulk-image-converter-optimizer-tool
```

Install dependencies

```bash
npm install
```

Start the Electron Project in Windows

```bash
npm run electron:start
```
Project will open in window mode not in browser as normal react app would, Happy Hacking!
## Deployment

Deployment is never been easy before, package.json is already configured for every platform (Window, Linux, MacOs). Just need to run build commands for each platform as follows:
## For Windows
```bash
npm run electron:package:win
```
> Produces NSIS installers for both x64 and arm64.
## For Linux
```bash
npm run electron:package:linux
```
## For MacOS
```bash
npm run electron:package:mac
```
Running these commands will give you a package file (Windows->NSIS .exe) || (Linux->.deb) || (macOS->.dmg).
## License

[MIT](https://choosealicense.com/licenses/mit/)


## Feedback

If you have any feedback, please reach out at shehariyar@gmail.com
dont't forget to give us a star if you like this project.

## Liked my dedication? Buy me a coffee?
<a href="https://www.buymeacoffee.com/shehari007">☕ Buy Me A Coffee</a>
