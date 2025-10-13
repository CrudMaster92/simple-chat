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

## Overused Tropes to Avoid
- Skip purple-forward or aurora-like glassmorphism palettes; we already have several experiences with that glowing purple style.
- Avoid teal-and-amber "glassy" meteor dashboards or similar cosmic glassmorphism riffs like the Meteoric Mood Loom.
- Refrain from shipping basic "story generator" tools that simply proxy OpenAI completions without deeper mechanics or twists.

## Applet Directory
- Razor Cracktro – Retro cracktro demo with raster bars and chiptune ambiance.
- Simple Chat – Two-persona chat simulator with moderator tools and history.
- Mythic Story Dice – Whimsical dice roller that conjures heroes, quests, and twists for instant story sparks.
- Time Capsule Postcards – Compose alternate-timeline postcards and tuck favorites into a personal capsule shelf.
- Aurora Flavor Forge – Blend cosmic dessert bases, aurora swirls, and stellar toppings into shimmering treat profiles.
- Prism Pulse Labyrinth – Glowing memory-gauntlet where you chase expanding prism pulse sequences and protect stability.
- Quantum Orbit Catcher – Three-lane reactor dash where you snare luminous particles and dodge overloads for high scores.
- Potion Snap Oracle – Snap a fresh photo to distill its colors into whimsical potion ingredients and arcane incantations.
- Sonic Bloom Conservatory – Tend an ethereal audio garden of shimmering blooms and sculpted breezes.
- Matrix Synth Rain – Conduct a customizable matrix skyline with glyph dialects, luminous gradients, and live performance bursts.
- Tidal Dream Cartographer – Sketch luminous archipelago tide maps and summon GPT-spun lore dispatches for each chart.
- Chromatic Spice Sketchpad – Drag-and-drop spices and pigments to compose synesthetic flavor blooms accompanied by gentle tones.
- Zephyr Relay Pen Pals – Coordinate breezy pen pal dispatches between airborne stations with animated drift routes, playful delays, and collectible trinkets.
- Glimmer Fossil Cabinet – Arrange noctilucent fossils on rotating stands, adjust their glow, and ponder the whispered plaques they unveil.
- Chrono Lantern Workshop – Weave time-reactive lanterns that morph light cores, weather-tuned chimes, and seasonal fiber patterns.
- Interstellar Herbarium Field Notes – Spin up lyrical field observations for cosmic flora with model-aware OpenAI integrations.
- Stormglass Kite Atelier – Rig shimmering kites, sculpt stormglass thermals, and score breezy flight choreographies.
- Resonant Crystal Cavern Jam Session – Stack loop-building crystals, steer reflective beams, and improvise cavernous echo jams with tactile controls.
- Twilight Parade Choreography – Plot luminous procession chapters, blend skyline ambience, and cue a twilight finale that ripples through every block.
- Lunar-Linked Explorer’s Compass – Follow a moonlit compass that shifts motifs, retunes phases, and offers a tranquil escape hatch.
- Retro Warp Arcade – Tune a neon warp cabinet, chain lane catches, and chase holo leaderboards in a synth-lit arcade sprint.
- Cassette Loop Challenge – Glide a glowing tape reel, time razor splices, and keep the wobble buffer calm for an endless mixtape streak.
- Starfall Cipher Rally – Sprint across an observatory deck decoding crashing star sigils, chaining co-op power boosts, and keeping the shield grid alive for a high-score victory.
- Luminous Rift Garden – Tend a radiant rift garden with cross-shaped pulse sweeps to stabilize hidden fissures.
- Teacup Tempest Clicker – Conduct a glowing teacup lab where every click uncorks micro-squalls, harvests storm sips, and fuels eccentric weatherwork upgrades.
