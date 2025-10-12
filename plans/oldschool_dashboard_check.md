# Old-School Applet Dashboard Check

After pulling the latest changes, I verified the dashboard registry and applet directories.

- `dashboard/applets.json` does not list entries for RetroCalc Console, GeniePad 95, PixelCanvas Studio, Diskette Explorer, or Timekeeper Agenda.
- The `dashboard/applets/` directory does not contain folders for those applets.

Follow-up: once the applet sources land in the repository, add their `applet.json` files under `dashboard/applets/<slug>/` and register them in `dashboard/applets.json`.
