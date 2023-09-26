

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

Tool for converting bulk images supporting all image format and allow user to adjust dimensions, quality, animation, compression and many more options to discover. 

## Tech Stack

**CLIENT:** React, Hooks, Ant Design 5+, Electron, Node



## Features

- Supports all various image formats(webp, jpg, png, tiff, jp2, heif, avif, jxl, raw, gif).
-  Single form settings to select options for desired output.
- Uses Multi Threaded Task for quick compression and output for larger files.
- Generates a single Zip file of all converted images.
- Supports Hardware acceleration.
- Shows a Table of selected files in an organized way.


## Pre Requirements For Local Development

- React 18+
- Node, NPM
- VSCODE With ES6+ Module
## Installation

Clone the project

```bash
git clone https://github.com/shehari007/SysPeek-hwinfo-react-electron-app.git
```

Go to the project directory

```bash
cd mini-react-electron-desktop-app
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
