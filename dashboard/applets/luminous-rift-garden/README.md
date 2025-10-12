# Luminous Rift Garden

Luminous Rift Garden is a crystal-field twist on the classic minesweeper formula. Stabilize a
shimmering mineral conservatory, chart luminous hints, and deploy limited pulse sweeps to neutralize
void fissures without collapsing the terrain.

## Core Features

- **Three Garden Strata** – Choose between Sprout, Bloom, and Radiant layouts with increasing grid
  sizes, fissure counts, and bonus pulse charges.
- **Pulse Sweep Ability** – Arm cross-shaped pulse sweeps to reveal clusters of safe plots without
  triggering fissures. Preview the sweep radius by hovering or focusing before you commit.
- **Field Notes Log** – Every reveal, pulse, and mishap is chronicled in a running event log so you
  can reconstruct your stabilization strategy.
- **Accessible Controls** – Play with mouse, keyboard, or long-press flagging on touch devices. All
  cells announce their state through descriptive labels for assistive tech.

## How to Play

1. Pick your preferred garden stratum from the selector.
2. Left click (or tap) plots to reveal them; the glowing numbers tell you how many fissures are
   adjacent.
3. Right click (or long press) to mark suspected fissures with beacons.
4. Tap **Prime Pulse Sweep** to arm a pulse. Hover a tile to preview the plus-shaped sweep, then
   click to trigger it and expose safe plots.
5. Stabilize every safe plot before you run out of patience—or watch the garden collapse if you
   trigger a fissure!

## File Structure

```
luminous-rift-garden/
├── README.md
├── app.js
├── applet.json
├── assets
│   └── icon.svg
├── index.html
└── styles.css
```

## Future Ideas

- Add rare "glimmer spores" that grant bonus pulses when discovered.
- Introduce a zen mode with an endless sequence of procedurally generated gardens.
- Pipe event logs into shareable stabilization reports.
