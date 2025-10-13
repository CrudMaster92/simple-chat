# SNES Emulator Studio

SNES Emulator Studio wraps the [EmulatorJS](https://emulatorjs.com/) runtime so you can boot Super Nintendo ROMs directly inside the dashboard. Users can drop in their own `.smc`/`.sfc` dumps or zipped archives and the core streams everything locally without leaving the browser.

## Features
- Drag-and-drop ROM uploader with file size guardrails.
- EmulatorJS bootstrapping with fallbacks for multiple loader APIs.
- Quick keyboard reference and view controls (fullscreen, reset, mute).
- Non-invasive layout that keeps EmulatorJS assets isolated from other applets.

## Usage
1. Click or drop a ROM onto the uploader card.
2. Wait for the EmulatorJS assets to download (first load only).
3. Once running, use the on-screen controls or standard EmulatorJS shortcuts to manage the session.

All loading happens in-browser. ROMs are never uploaded to a remote server.
