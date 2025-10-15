# Prompt Screensaver Forge

Prompt Screensaver Forge is a Canvas-inspired sandbox that converts natural language themes into runnable screensaver loops. The applet combines an AI-flavored generator with a Monaco-powered editor, xterm.js console, sandboxed iframe runtime, and optional Pyodide execution so creators can iterate without leaving the dashboard.

## Features
- **Prompt-driven code synthesis** – enter a theme and receive runnable JavaScript or Pyodide-friendly Python screensaver code tuned to the vibe.
- **Embedded Monaco workspace** – edit generated files with custom theming, multi-file support, and project-level execution shortcuts.
- **Live sandbox preview** – each run boots a fresh iframe that captures console output, isolates animation state, and reports errors back to the console pane.
- **OPFS persistence** – save and reload project files with the Origin Private File System for quick prototyping sessions.
- **Safety controls** – Reset Environment clears the workspace, while Kill Switch forcibly removes the active sandbox loop.

## Palette
This applet uses a kelp-and-ember palette to stay distinct from other dashboard experiences:
- Deep teal: `#042a2b`
- Atlantic green: `#2cb1a5`
- Ember gold: `#f2a541`
- Saffron blaze: `#f26d21`
- Mist white: `#f1f4f5`

## Development Notes
- JavaScript screensavers expect the provided `runtime` helpers (`startLoop`, `fade`, `gradientBackground`, etc.).
- Python screensavers execute through Pyodide and have access to the browser DOM via `js` imports.
- Mixed-language projects can be edited, but execution is limited to one language at a time for clarity and safety.
