# Wayfinder Browser Bay

Wayfinder Browser Bay is a compact navigation console for scouting the open web
from inside the dashboard. It blends quick-search dials, an embed viewer, and a
session notebook so you can pin the useful stops you uncover.

## Features

- **Smart navigation console** – Drop in a full URL or type a query and pick a
  search focus (DuckDuckGo, Wikipedia, or MDN docs) before launching the page in
  the live canvas.
- **Trail markers** – Your eight most recent stops stay within reach as
  tappable chips that instantly reload the destination inside the canvas.
- **Session pinboard** – Capture a short note about the current site, stash it
  with a timestamp, copy the link, or reload it directly from the pin.
- **Focus frame** – Toggle an accent frame around the viewer when you want the
  page preview to stand out against the console.
- **Embed guardrail** – If a destination blocks iframe embedding, the Bay flags
  the situation so you can open it externally instead.

## Palette

The interface leans on a midnight navigation palette to avoid overlapping with
other applets:

- Deep navy background: `#0b1c2d`
- Marine panels: `#11273a`
- Ember highlight: `#f46d1b`
- Golden focus accent: `#f6d166`
- Cream text: `#f2f0dc`

## Notes

- Clipboard copy is best-effort. Browsers may block clipboard access when the
  page is not served over HTTPS.
- Some sites cannot be embedded due to `X-Frame-Options` policies. The Bay will
  surface a reminder overlay if the viewer stays blank after several seconds.
