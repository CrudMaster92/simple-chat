# Dashboard-Wide Agent Guidelines

## Do-Not-Touch Boundaries
- Treat everything under `dashboard/` as configuration and scaffolding. Only modify applet folders the task explicitly authorizes.
- Leave shared infrastructure (build scripts, CI configs, deployment manifests) untouched unless the task says otherwise.

## Registry Requirements
- Every applet must declare metadata in an `applet.json` file that the registry can ingest.
- Register each applet in `dashboard/applets.json` using a relative path to its `applet.json`. Preserve the JSON key order to match the intended tile layout.

## Relative-Path Policy
- Use paths that are relative to the applet folder when linking assets inside an applet (e.g., `./assets/icon.svg`).
- When referencing one applet from another, use paths relative to the dashboard root.

## Cross-Applet Isolation
- Do not couple applets together unless the task requires shared behavior. Keep assets, metadata, and documentation scoped within each applet directory.
- Never repurpose assets or configs from another applet without duplicating or clearly re-namespacing them.
