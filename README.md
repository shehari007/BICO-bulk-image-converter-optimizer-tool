

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


# BICO - Bulk Image Converter & Optimizer Tool For Desktop Platform Based on React Electron

## Current Version (v1.5.0) Last Updated (18/02/2024)

Tool for converting bulk images supporting all image format and allow user to adjust dimensions, quality, animation, compression and many more options to discover. - (you can find latest changelog at release section)

## Tech Stack

Ant Design 5+, Electron, Node SHARP


## Features

- Supports all various image formats (webp, jpg, png, tiff, jp2, heif, avif, jxl, raw, gif).
- Single form settings to select options for desired output.
- Uses Multi Threaded Task for quick compression and output for larger files.
- Generates a single output zip file. 
- Added Grayscale image conversion support
- Added avif with losseless compression support
- Supports Hardware acceleration.
- Added MozJPEG support
- Added Progressive Interlaced Scan Support for (JPEG, PNG, GIF)
- Added Custom Dimension Option
- Added Webp Lossless Compression
- Added Tiff compression types (jpeg, deflate, packbits, lzw, webp, jp2k)
- Added Windows Notifications Tested on Windows 11


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
