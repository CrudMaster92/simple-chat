# EchoTape Recorder

EchoTape Recorder reimagines the classic **Windows Sound Recorder** as a modern,
visual-first capture studio. It layers live waveform rendering, timeline markers,
and a take library on top of the simple "record / stop" workflow that shipped
with Windows 95 and XP.

## Feature Highlights

- **Live waveform dashboard** with responsive metering and subtle gridlines
  inspired by studio decks.
- **Marker drops** – label important beats while capturing and keep them attached
  to each take for fast navigation later.
- **Focus boost & room tone blend** toggles that adjust high- and low-shelf
  filters in real time.
- **Take library** that supports renaming, instant playback, downloads, and
  quick audio imports.
- **All-local processing** using the Web Audio API, so nothing leaves the
  browser.

## Files

- `index.html` – Layout and semantic structure for the recorder interface.
- `styles.css` – Modernized look and feel with deep-navy panels and bright cyan
  accents.
- `app.js` – Recording logic, waveform rendering, marker handling, and take
  management.
- `assets/icon.svg` – Tile icon for the dashboard.
- `applet.json` – Metadata consumed by the launcher registry.

## Usage

1. Press **Start Capture** to begin a new take. Grant microphone access when the
   browser prompts for it.
2. Optionally enable **Focus boost** or tweak **Room tone blend** while
   recording.
3. Drop markers with a custom note to highlight moments in real time.
4. Finish the take to store it in the library. Rename, replay, download, or
   import additional clips as needed.

> Tip: Because EchoTape runs locally, you can keep the tab offline and still
> collect high-fidelity voice notes or interviews.
