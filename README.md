# Simple Chat Dashboard Monorepo

This repository hosts a collection of lightweight, static "applets" that are
launched from a shared dashboard. Serving the repository root (for example with
`python -m http.server`) now loads `./index.html`, which immediately redirects
to [`dashboard/index.html`](./dashboard/index.html) — the canonical launcher for
all bundled experiences.

## Repository Structure

- [`dashboard/`](./dashboard/) – shared launcher, registry, and styling assets
  that enumerate every available applet.
- [`dashboard/index.html`](./dashboard/index.html) – the landing page presented
after the redirect; tiles each applet discovered in the registry.
- [`dashboard/applets/`](./dashboard/applets/) – individual applet directories.
  Each folder owns its runtime assets, documentation, and guardrail files.

> **Guardrails**: Dashboard-wide constraints and expectations live in
> [`dashboard/agents.md`](./dashboard/agents.md). Applet-specific guidance is
> stored beside each applet (for example,
> [`dashboard/applets/simple-chat/agents.md`](./dashboard/applets/simple-chat/agents.md)
> and [`agents.yaml`](./dashboard/applets/simple-chat/agents.yaml)). Refer to
> these files before making changes to shared infrastructure or a specific
> applet.

## Adding or Updating an Applet

1. **Create an applet folder** inside `dashboard/applets/` (e.g.
   `dashboard/applets/my-applet/`). Keep assets self-contained within this
   directory.
2. **Document the applet** by adding a `README.md` to the new folder. Reuse or
   update `agents.md` / `agents.yaml` if more guardrails are required.
3. **Provide metadata** in an `applet.json` file. Follow the schema used by
   existing applets so the dashboard registry can ingest the title, description,
   icon, and entry point.
4. **Register the applet** by adding the relative path to the new
   `applet.json` in [`dashboard/applets.json`](./dashboard/applets.json). Keep
   the ordering intentional; it controls tile placement on the launcher.
5. **Build the UI** with static HTML, CSS, and JavaScript files that the
   dashboard can load directly (avoid introducing new build tooling unless
   explicitly required).

Once these steps are complete, a static host pointed at the repository root will
immediately deliver the dashboard, and selecting the applet tile will navigate
to your new experience.

## How to use the taskbar window

- Launch any applet from the desktop, Start menu, or Applets grid to open it
  inside the dashboard window. Only one applet runs at a time.
- Use the window's **Minimize** control or the taskbar button with the applet's
  name to hide and restore the running experience without reloading it.
- Select **Close** in the window chrome to return to the desktop; reopening the
  applet starts it fresh.
