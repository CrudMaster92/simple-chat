const THEME_LABELS = {
  celestial: "Celestial Lanterns",
  mist: "Misty Revelers",
  drumline: "Starlit Drumline",
  garden: "Noctiluna Garden",
  voyage: "Skyward Voyage",
};

const MOMENT_LABELS = {
  "lantern-lift": "Lantern Lift Crescendo",
  "drum-swell": "Phosphor Drum Swell",
  "veil-reveal": "Mist Veil Reveal",
  "kite-ascend": "Sky Kite Ascension",
  constellation: "Constellation Tableau",
};

const EFFECT_LABELS = {
  "ember-trails": "Ember Trails",
  "drone-fireflies": "Drone Fireflies",
  "mist-ribbons": "Mist Ribbons",
  "sky-bells": "Sky Bells",
};

const ENSEMBLE_LABELS = {
  dancers: "Luminous Dancers",
  acrobats: "Ribbon Acrobats",
  marchers: "Lantern Marchers",
  orchestra: "Twilight Orchestra",
  storytellers: "Starlore Storytellers",
};

const SOUNDSCAPE_LABELS = {
  "silver-waltz": "Silver Hour Waltz",
  "dawn-drums": "Dawnside Drums",
  "tidal-hum": "Tidal Hum",
  embersong: "Embersong Reverie",
};

const themeLore = {
  celestial: {
    lede: "Float constellations glide down the boulevard, tethered to lantern constellations and hushed choruses.",
    notes: [
      { title: "Cadence", body: "Lean into a 72 BPM waltz so each lantern arc can bloom in slow, photogenic waves." },
      {
        title: "Cue",
        body: "Signal the lift captain 45 seconds before the crescendo so halos align with the skyline shimmer.",
      },
    ],
    effects: {
      "ember-trails": "Use ember trails to trace stardust tails as the float rotates for the tableau.",
      "drone-fireflies": "Stage drone fireflies at two heights to sketch constellations overhead.",
      "sky-bells": "Suspend sky bells for a crystalline undertone during the lift beat.",
    },
  },
  mist: {
    lede: "Low-lying fog ushers performers through a dreamy corridor of silhouettes and soft lights.",
    notes: [
      { title: "Flow", body: "Layer gliding choreography with slow counter-rotations to keep the mist illuminated." },
      {
        title: "Reveal",
        body: "Trigger a slow fan sweep every 40 seconds so crowd sightlines reset and new silhouettes emerge.",
      },
    ],
    effects: {
      "mist-ribbons": "Thread mist ribbons along the curb line to keep the haze hugging the route.",
      "ember-trails": "Pair ember trails with pale blue uplights for a moonlit vapor effect.",
    },
  },
  drumline: {
    lede: "Percussive pulses and metallic accents drive the parade heartbeat through twilight plazas.",
    notes: [
      { title: "Rhythm", body: "Stack syncopated hits with low-frequency resonance to vibrate balcony railings." },
      {
        title: "Cue",
        body: "Introduce call-and-response patterns every other block to keep energy surging forward.",
      },
    ],
    effects: {
      "sky-bells": "Tune sky bells a fifth above the snare line for a glistening counterpoint.",
      "drone-fireflies": "Deploy drone fireflies in rhythmic bursts to echo sticking patterns overhead.",
    },
  },
  garden: {
    lede: "Bioluminescent flora unfurls along the route, each bloom revealing dancers within glowing fronds.",
    notes: [
      {
        title: "Texture",
        body: "Alternate between soft bloom reveals and quick vine snaps to keep the garden choreography alive.",
      },
      {
        title: "Cue",
        body: "Coordinate pollinator puppeteers to cross at minute three for a layered silhouette moment.",
      },
    ],
    effects: {
      "mist-ribbons": "Mist ribbons catch the garden's turquoise uplights for a dew-laden aura.",
      "drone-fireflies": "Drone fireflies trace petal arcs and guide audience gaze to key blooms.",
    },
  },
  voyage: {
    lede: "Skyships sail between rooftop beacons, mapping a voyage across ember-tipped clouds.",
    notes: [
      { title: "Navigation", body: "Cue direction changes at each intersection to keep the flotilla feeling exploratory." },
      {
        title: "Cue",
        body: "Ping the prow spotlight 30 seconds before turns so rigging glows against the dusk.",
      },
    ],
    effects: {
      "ember-trails": "Channel ember trails along hull edges to echo contrails.",
      "sky-bells": "Sky bells emulate mast chimes and cue the crew for sail drops.",
    },
  },
};

const atmosphereProfiles = {
  sky: {
    ember: { score: 26, highlight: "Molten horizon amplifies lantern blooms." },
    aqua: { score: 22, highlight: "Cool aqua dome heightens mist reveals." },
    rose: { score: 24, highlight: "Rose mirage flatters costumes with warm undertones." },
  },
  ground: {
    lanterns: { score: 20, highlight: "Lantern lattice guides audience sightlines." },
    mist: { score: 18, highlight: "Whispering mist keeps feet hidden and motion fluid." },
    sparks: { score: 16, highlight: "Ember sparks add punchy hits between segments." },
  },
  trail: {
    citrus: { score: 14, highlight: "Candied citrus keeps energy lively late into the route." },
    cedar: { score: 12, highlight: "Moonlit cedar grounds the senses near plazas." },
    sea: { score: 13, highlight: "Tide mist pairs with gliding sequences for coastal nostalgia." },
  },
};

const synergyNotes = {
  "ember|lanterns": "Amber sky with lantern lattice sets the stage for lantern lifts.",
  "aqua|mist": "Aqua glow over whispering mist magnifies silhouettes mid-route.",
  "rose|sparks": "Rose mirage and ember sparks deliver a finale-ready crescendo.",
  "ember|cedar": "Warm sky with cedar trail relaxes crowds near the finale plaza.",
};

const segmentForm = document.getElementById("segmentForm");
const themeSelect = document.getElementById("themeSelect");
const durationInput = document.getElementById("durationInput");
const durationReadout = document.getElementById("durationReadout");
const spacingInput = document.getElementById("spacingInput");
const spacingReadout = document.getElementById("spacingReadout");
const momentSelect = document.getElementById("momentSelect");
const ensembleSelect = document.getElementById("ensembleSelect");
const soundscapeSelect = document.getElementById("soundscapeSelect");
const inspirationCopy = document.getElementById("inspirationCopy");
const cueNotes = document.getElementById("cueNotes");
const timelineTrack = document.getElementById("timelineTrack");
const timelineHints = document.getElementById("timelineHints");
const segmentCount = document.getElementById("segmentCount");
const totalRuntime = document.getElementById("totalRuntime");
const twilightStatus = document.getElementById("twilightStatus");
const atmosphereScore = document.getElementById("atmosphereScore");
const atmosphereHighlights = document.getElementById("atmosphereHighlights");

const atmosphereConfig = {
  sky: document.querySelector('input[name="sky"]:checked').value,
  ground: document.querySelector('input[name="ground"]:checked').value,
  trail: document.querySelector('input[name="trail"]:checked').value,
};

document.body.dataset.sky = atmosphereConfig.sky;

const segments = [];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getSelectedEffects() {
  return Array.from(segmentForm.querySelectorAll('input[name="effect"]:checked')).map((input) => input.value);
}

function updateInspiration() {
  const themeKey = themeSelect.value;
  const lore = themeLore[themeKey];
  if (!lore) {
    inspirationCopy.textContent = "Choose a theme to receive twilight cadence notes and atmospheric pairings.";
    cueNotes.innerHTML = "";
    return;
  }

  inspirationCopy.textContent = lore.lede;
  cueNotes.innerHTML = "";

  lore.notes.forEach((note) => {
    const dt = document.createElement("dt");
    dt.textContent = note.title;
    const dd = document.createElement("dd");
    dd.textContent = note.body;
    cueNotes.append(dt, dd);
  });

  const effects = getSelectedEffects();
  effects.forEach((effectKey) => {
    const detail = lore.effects?.[effectKey];
    if (detail) {
      const dt = document.createElement("dt");
      dt.textContent = EFFECT_LABELS[effectKey];
      const dd = document.createElement("dd");
      dd.textContent = detail;
      cueNotes.append(dt, dd);
    }
  });
}

function updateDurationLabel() {
  durationReadout.textContent = `${durationInput.value} min`;
}

function updateSpacingLabel() {
  spacingReadout.textContent = `${spacingInput.value} sec`;
}

function updateTimeline() {
  timelineTrack.innerHTML = "";
  if (!segments.length) {
    timelineHints.textContent = "Stage your first segment to light the route.";
    segmentCount.textContent = "0 segments";
    totalRuntime.textContent = "0:00 total";
    twilightStatus.textContent = "Awaiting segments";
    return;
  }

  let cursor = 0;
  let totalSeconds = 0;
  let widestSpacing = 0;

  segments.forEach((segment, index) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.setAttribute("role", "listitem");
    item.dataset.start = formatTime(cursor);

    const header = document.createElement("div");
    header.className = "timeline-item__header";

    const title = document.createElement("h3");
    title.className = "timeline-item__title";
    title.textContent = segment.name;

    const meta = document.createElement("div");
    meta.className = "timeline-item__meta";
    const durationTag = document.createElement("span");
    durationTag.textContent = `${segment.duration} min`;
    const themeTag = document.createElement("span");
    themeTag.textContent = THEME_LABELS[segment.theme];
    meta.append(durationTag, themeTag);

    if (segment.spacing > 0) {
      const spacingTag = document.createElement("span");
      spacingTag.textContent = `Glow ${segment.spacing} sec`;
      meta.append(spacingTag);
    }

    header.append(title, meta);

    const notes = document.createElement("p");
    notes.className = "timeline-item__notes";
    notes.textContent = `${MOMENT_LABELS[segment.moment]} cues ${ENSEMBLE_LABELS[segment.ensemble]} with ${SOUNDSCAPE_LABELS[segment.soundscape]}.`;

    const effects = document.createElement("div");
    effects.className = "timeline-item__effects";
    segment.effects.forEach((effectKey) => {
      const chip = document.createElement("span");
      chip.textContent = EFFECT_LABELS[effectKey];
      effects.appendChild(chip);
    });

    if (effects.childElementCount === 0) {
      const placeholder = document.createElement("span");
      placeholder.textContent = "No accent cues";
      effects.appendChild(placeholder);
    }

    item.append(header, notes, effects);
    timelineTrack.appendChild(item);

    const segmentSeconds = segment.duration * 60;
    cursor += segmentSeconds;
    totalSeconds += segmentSeconds;
    widestSpacing = Math.max(widestSpacing, segment.spacing);
    if (segment.spacing > 0 && index !== segments.length - 1) {
      cursor += segment.spacing;
      totalSeconds += segment.spacing;
    }
  });

  const countLabel = `${segments.length} ${segments.length === 1 ? "segment" : "segments"}`;
  segmentCount.textContent = countLabel;
  totalRuntime.textContent = `${formatTime(totalSeconds)} total`;

  const finalCue = formatTime(cursor);
  timelineHints.textContent = `Finale arrives at ${finalCue} with ${widestSpacing || 0} sec widest glow.`;

  if (cursor / 60 >= 24) {
    twilightStatus.textContent = "Full twilight cascade locked";
  } else if (cursor / 60 >= 12) {
    twilightStatus.textContent = "Mid-route shimmer aligned";
  } else {
    twilightStatus.textContent = "Short showcase ready";
  }
}

function updateAtmosphereScore() {
  document.body.dataset.sky = atmosphereConfig.sky;
  const skyProfile = atmosphereProfiles.sky[atmosphereConfig.sky];
  const groundProfile = atmosphereProfiles.ground[atmosphereConfig.ground];
  const trailProfile = atmosphereProfiles.trail[atmosphereConfig.trail];

  let score = 40 + skyProfile.score + groundProfile.score + trailProfile.score;
  const highlights = [skyProfile.highlight, groundProfile.highlight, trailProfile.highlight];

  const key = `${atmosphereConfig.sky}|${atmosphereConfig.ground}`;
  if (synergyNotes[key]) {
    highlights.push(synergyNotes[key]);
    score += 6;
  }

  if (atmosphereConfig.trail === "citrus" && segments.length >= 3) {
    highlights.push("Citrus trail keeps crowds buoyant through extended runtime.");
    score += 4;
  }

  if (segments.length && segments.some((seg) => seg.moment === "constellation")) {
    highlights.push("Constellation tableau pairs beautifully with sky gradients.");
    score += 3;
  }

  score = Math.min(100, score);
  atmosphereScore.textContent = `Harmonic Index: ${score}`;
  atmosphereHighlights.innerHTML = "";
  [...new Set(highlights)].forEach((highlight) => {
    const li = document.createElement("li");
    li.textContent = highlight;
    atmosphereHighlights.appendChild(li);
  });
}

segmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(segmentForm);
  const name = formData.get("segmentName")?.toString().trim();
  if (!name) {
    return;
  }

  const newSegment = {
    name,
    theme: formData.get("theme") || themeSelect.value,
    duration: Number(formData.get("duration") || durationInput.value),
    spacing: Number(formData.get("spacing") || spacingInput.value),
    moment: formData.get("moment") || momentSelect.value,
    ensemble: formData.get("ensemble") || ensembleSelect.value,
    soundscape: formData.get("soundscape") || soundscapeSelect.value,
    effects: getSelectedEffects(),
  };

  segments.push(newSegment);
  updateTimeline();
  updateAtmosphereScore();

  segmentForm.reset();
  // Restore defaults declared in markup for checkboxes.
  segmentForm.querySelector('input[name="effect"][value="ember-trails"]').checked = true;
  durationInput.value = 6;
  spacingInput.value = 30;
  updateDurationLabel();
  updateSpacingLabel();
  updateInspiration();
});

[durationInput, spacingInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (input === durationInput) {
      updateDurationLabel();
    } else {
      updateSpacingLabel();
    }
  });
});

segmentForm.querySelectorAll('input[name="effect"]').forEach((checkbox) => {
  checkbox.addEventListener("change", updateInspiration);
});

themeSelect.addEventListener("change", updateInspiration);

momentSelect.addEventListener("change", updateInspiration);
ensembleSelect.addEventListener("change", updateInspiration);
soundscapeSelect.addEventListener("change", updateInspiration);

[...document.querySelectorAll('input[name="sky"]')].forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      atmosphereConfig.sky = input.value;
      updateAtmosphereScore();
    }
  });
});

[...document.querySelectorAll('input[name="ground"]')].forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      atmosphereConfig.ground = input.value;
      updateAtmosphereScore();
    }
  });
});

[...document.querySelectorAll('input[name="trail"]')].forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      atmosphereConfig.trail = input.value;
      updateAtmosphereScore();
    }
  });
});

updateDurationLabel();
updateSpacingLabel();
updateInspiration();
updateAtmosphereScore();
