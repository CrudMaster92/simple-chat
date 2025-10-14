# Dashboard-Wide Agent Guidelines

## Do-Not-Touch Boundaries
- Treat everything under `dashboard/` as configuration and scaffolding. Only modify applet folders the task explicitly authorizes.
- Leave shared infrastructure (build scripts, CI configs, deployment manifests) untouched unless the task says otherwise.

## Registry Requirements
- Place the entire applet inside `dashboard/applets/<applet-slug>/`—do not create new applet folders alongside the dashboard shell or at the repo root.
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
- Retire the "sunlit sand and terracotta" vibe: parchment-to-cream gradients, pillowy rounded cards, soft inner shadows, and burnt sienna accent bars that mimic mindful productivity planners.
- Refrain from shipping basic "story generator" tools that simply proxy OpenAI completions without deeper mechanics or twists.

## Applet Directory
- Razor Cracktro – Retro cracktro showcase with raster bars, scrolltext, and chiptune ambiance.
- Razor Hello Cracktro – Lightweight hello-world cracktro with a perspective starfield and scrolling greeting banner.
- Simple Chat – Two-persona alternating chat simulator with moderator extensions and local history.
- Emoji Fusion Lab – Spin mood, creature, and activity reels to brew imaginative emoji mashups and prompts.
- Mythic Story Dice – Roll whimsical hero, quest, and twist dice to spark mythic story prompts.
- Time Capsule Postcards – Compose vibrant postcards from alternate timelines and save them to a personal time capsule.
- Aurora Flavor Forge – Blend cosmic bases, aurora swirls, and interstellar toppings to craft dazzling dessert profiles.
- Prism Pulse Labyrinth – Cosmic sequence-chasing memory run with shifting constellations and pulse streak bonuses.
- Quantum Orbit Catcher – Slide between orbit lanes to snare luminous particles before the reactor overloads.
- Sonic Bloom Conservatory – Cultivate luminous flora loops and sculpt ambient breezes in a living sound garden.
- Potion Snap Oracle – Snap a photo to distill chromatic ingredients into a whimsical potion recipe and incantation.
- Matrix Synth Rain – Conduct a customizable matrix rain skyline with dynamic glyphs, glow, and ambient pulses.
- Tidal Dream Cartographer – Sketch luminous tide charts and pair them with GPT-woven lore dispatches.
- Chromatic Spice Sketchpad – Drag fragrant spices and pigments into a synesthetic bloom field where gentle tones and poetic tasting notes respond to every blend.
- Zephyr Relay Pen Pals – Float letters between sky stations with playful drift routes and collectible aeroglyph trinkets.
- Glimmer Fossil Cabinet – Curate bioluminescent fossils on rotating stands and unveil whispered lore plaques.
- Chrono Lantern Workshop – Weave time-reactive lanterns with evolving light cores, weather-linked chimes, and fiber patterns that respond to every season.
- RetroCalc Console – Desktop-style calculator with tape roll history, tactile clicks, and handy quick conversions.
- GeniePad 95 – Retro notepad with Genie-powered rewrite, summarize, and brainstorm tools.
- PixelCanvas Studio – Chunky-pixel paint utility with retro chrome, color swatches, brush sizes, and playful stamp tools.
- Diskette Explorer – Retro disk manager with drive trees, metadata inspector, and tactile copy station.
- Timekeeper Agenda – Retro scheduler with day/week/month grids, reminders, and sticky-note annotations.
- Interstellar Herbarium Field Notes – Capture lyrical-yet-precise botanical dispatches from luminous specimens across nebular meadows.
- Stormglass Kite Atelier – Choreograph shimmering kites through sculpted stormglass thermals with evolving color palettes.
- Resonant Crystal Cavern Jam Session – Conduct looping crystal pulses, reflective lighting, and cavernous echoes in a responsive jam space.
- Twilight Parade Choreography – Design twilight procession chapters, orchestrate atmospheric effects, and track cadence cues down the route.
- Lunar-Linked Explorer's Compass – Plot soothing celestial bearings, shift lunar motifs, and follow a compass that listens to your curiosity.
- Retro Warp Arcade – Chain neon lane catches, tune synth chips, and chase a warp-run high score across a holo arcade cabinet.
- Cassette Loop Challenge – Ride magnetic reels, time your splice hits, and stabilize a retro mixtape loop for a booming streak.
- Luminous Rift Garden – Chart radiant crystal beds while sweeping for hidden void fissures with limited pulse charges.
- Teacup Tempest Clicker – Infuse miniature squalls in a porcelain lab, tapping up storm sips and tuning whimsical weatherwork upgrades.
- Meteoric Mood Loom – Blend meteor streams, sonic moods, and cosmic instruments to weave bespoke constellation scores.
- Retro Chat Hub – Stylized ChatGPT homage with OpenAI/Gemini selectors, image & voice tools, and 8-bit flair.
- Gridweave Analyst – Scenario-savvy grid workbook with sparklines, import validation, and AI-assisted formula explainers.
- Ceramic Ripple Kiln – Layer glazes, tweak texture toggles, and script a kiln schedule for ripple-happy vessels.
- Glacier Sample Sketcher – Shape fictional ice cores, tune depth bands, and log the expedition-worthy finds.
- Heirloom Envelope Atelier – Mix rare fibers, lining swatches, wax motifs, and phrases to prep courier-worthy envelopes.
- Parallax Simulation Loom – Balance complexity, stability, and anomaly charge to weave layered simulation ribbons.
- Signal Relay Studio – Craft cinematic watch-party storyboards, adjust lighting briefs, and anchor sessions around curated YouTube relays.
- Wiki Frame Carnival – A frame-based Wikipedia explorer with candy fonts, accent palettes, and a glittery history trail.
- Echo Orchard – Plant percussive loops and watch them blossom into a swaying grove of musical trees.
- Trickster Postmaster – Shift the chutes as the rules keep changing in this whimsical mailroom drag-and-drop puzzle.
- Glyphsmith – Forge a bespoke 5×7 micro alphabet, preview it live, and export sprite, JSON, and CSS bundles.
- Pocket Terrarium – Paint cellular seeds, bias the weather, and watch a calm garden automaton bloom.
- Adaptive Drift Biorealm – Guide climates and mutation currents as proto-creatures evolve within a living biome playground.
- SNES Emulator Studio – Upload your own Super Nintendo ROMs and play them instantly through the EmulatorJS web core.
- Aetherwave Convergence Lab – Sculpt resonant expeditions with live particle fields, telemetry broadcasts, and an imprintable blueprint chronicle.
- Rooftop Apiary Planner – Compose rooftop hive layouts, tune colony temperaments, and choreograph bloom corridors for steady pollinator flow.
- Windchime Pattern Composer – Arrange resonant chimes, dial in breezes, and script a three-phase wind performance.
- Seismic Ripple Atlas – Track today’s earthquakes as animated ripples with live stats from the USGS feed.
- Maestro Clock Pavilion – Analog-digital command center with alarms, timers, laps, and orchestrated rhythm pulses.
- Canvas Remix Studio – Modern take on Microsoft Paint featuring live mirroring, gradient backdrops, and highlight-friendly brushes.
- Circuit Sweep Analyst – Reimagine classic Minesweeper as a circuit audit with heatmap insights, smart hints, and momentum scoring.
- EchoTape Recorder – Modernized Windows Sound Recorder with live waveform markers, focus boost, and a take library.
- Serpent Sonata – Conduct a luminous serpent through living stages, weaving combos, blossoms, and awards with reactive synth flourishes.
- Pinball Mission Ops – Mission-control dashboard that modernizes 3D Space Cadet pinball with live telemetry and combo orchestration.
- Harbor Ember Gambit – Dockside dueling card game where ember-lit suits bend the odds each wave.
- Bang Bang Beat Barrage – Slam dueling rhythm cannons on every glowing cue and unleash thunder slams to electrify the arena.
- Nebula Gear Emulator – Boot a prototype handheld and swap between experimental ROM cartridges inside a shimmering dev kit shell.
- Parallax Bloom Atelier – Sculpt a drifting 3D bloom, blend hues, and orchestrate orbiting layers with luminous parallax trails.
- Policy Pioneer Lab – Tune Q-learning instincts, steer a scout through shifting rewards, and watch a policy emerge in real time.
- Starlit Piano Observatory – Improvise piano constellations, capture their orbit trails, and replay nocturnal motifs on demand.
- Vector Bloom Forge – Drag bezier nodes to sculpt luminous petals, chase target silhouettes, and chain precision streaks.
- Hyperlink Surf Club – Spin curated web destinations, tune your pace dial, and drop postcard notes into a playful voyage log.
- YouTube Search Theater – Search YouTube, review rich result details, and watch videos without leaving the dashboard.
- Wayfinder Browser Bay – Scout the web with a quick-search console, live canvas, and session pinboard for standout finds.
- Civic Horizon Builder – Balance prosperity, joy, and clean air in a compact city-planning challenge with a firm win condition.
- Axis Glide Arena – Pilot a hover sphere through a neon grid, capture energy orbs, and stabilize the arena before the timer expires.
- Orbital Mneme Spindle – Mint kinetic memory shards, drag them around a rotating halo, and log the constellation you weave.
