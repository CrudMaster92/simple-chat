const fossils = [
  {
    id: "aurora-spine",
    name: "Aurora Spine",
    sigil: "◐",
    epithet: "Segmented vertebra infused with skyfire salt.",
    origin: "Recovered from subglacial shelf 14; orientation remains contested.",
    whispers: [
      "Ridges hum when aligned with polar winds.",
      "Inner marrow refracts teal sparks under brine."
    ],
    glimmer: "72 lumen whispers",
    accent: "#68c5b8",
    lore:
      "Rotated toward true north, the segments click into a breathing cadence. Archivists disagree whether the rhythm beckons or wards away the original host.",
    notes: "Catalogued by Silt Division after a midnight flare in dry storage."
  },
  {
    id: "ember-shell",
    name: "Ember Shell Fan",
    sigil: "✶",
    epithet: "Fanned shell imprint soot-stained yet warm to the touch.",
    origin: "Found in a collapsed fumarole shelf beneath tempered glass dunes.",
    whispers: [
      "Edges emit slow pulses when submerged in fog.",
      "Central hinge resists closing after moonrise."
    ],
    glimmer: "61 ember pulses",
    accent: "#f4c978",
    lore:
      "Lore keepers jot that the shell once shielded drifting larvae that glowed as defense. No remains accompany the imprint, only scuffed silt and the scent of ozone.",
    notes: "Stored alongside heatproof gloves. Handle with breathable cloth."
  },
  {
    id: "tidal-crescent",
    name: "Tidal Crescent Core",
    sigil: "☾",
    epithet: "Curled spine cradle holding liquid starlight residue.",
    origin: "Siphoned from abyssal trench caches after sonar blooms.",
    whispers: [
      "Concave face brightens near running water.",
      "A thin chime rolls through distant vents when rotated eastward."
    ],
    glimmer: "88 tide chimes",
    accent: "#7ab9ff",
    lore:
      "Rotate slowly and the trapped residue coalesces into a crescent horizon. Witnesses claim the glow sketches unfamiliar coastlines that fade before sketching can finish.",
    notes: "Pressure fractures sealed with translucent resin; avoid sharp impacts."
  },
  {
    id: "fern-lattice",
    name: "Glade Lattice Frond",
    sigil: "卍",
    epithet: "Interlocking fern bones mapped in mineralized light.",
    origin: "Lifted from cavern ceilings where spores sketch constellations.",
    whispers: [
      "Pores inhale stray photons, releasing them as emerald droplets.",
      "Segments align with unknown botanical cipher lines."
    ],
    glimmer: "54 chloric drips",
    accent: "#64c479",
    lore:
      "Plaque scribbles note the frond once threaded itself through stalactites, weaving a canopy for unnamed beings. Rotating it thrice reveals a lattice shadow on the wall behind you.",
    notes: "Do not fold. Let gravity articulate the frond's spiral."
  },
  {
    id: "cinder-orb",
    name: "Cinder Orb Husk",
    sigil: "◎",
    epithet: "Hollow sphere charred but lined with luminous capillaries.",
    origin: "Gathered from meteorite slag cooled in pelagic nightfalls.",
    whispers: [
      "Capillaries spark in patterns matching distant lightning.",
      "The hollow center tastes faintly of petrichor."
    ],
    glimmer: "95 storm echoes",
    accent: "#ff9f6e",
    lore:
      "The husk keeps a residual heartbeat that syncs with the caretaker's own for a moment after rotation. Stories warn not to listen longer than a single breath.",
    notes: "Keep near grounded copper mesh to bleed off errant charge."
  }
];

const cabinetSize = 5;
const cabinet = Array.from({ length: cabinetSize }, () => null);
let selectedSlot = null;

const fossilListEl = document.getElementById("fossil-list");
const cabinetGridEl = document.getElementById("cabinet-grid");
const statusEl = document.getElementById("cabinet-status");
const rotationSlider = document.getElementById("rotation-slider");
const glowSlider = document.getElementById("glow-slider");
const releaseButton = document.getElementById("release-slot");

const loreName = document.getElementById("lore-name");
const loreOrigin = document.getElementById("lore-origin");
const loreText = document.getElementById("lore-text");
const loreNotes = document.getElementById("lore-notes");
const loreGlimmer = document.getElementById("lore-glimmer");

function renderArchive() {
  fossilListEl.innerHTML = "";
  fossils.forEach((fossil) => {
    const card = document.createElement("article");
    card.className = "fossil-card";

    const glyph = document.createElement("span");
    glyph.className = "fossil-card__glyph";
    glyph.textContent = `${fossil.sigil}  ${fossil.id.replace(/-/g, " ").toUpperCase()}`;

    const title = document.createElement("h3");
    title.textContent = fossil.name;

    const epithet = document.createElement("p");
    epithet.textContent = fossil.epithet;

    const origin = document.createElement("p");
    origin.textContent = fossil.origin;

    const whispers = document.createElement("ul");
    whispers.className = "fossil-card__notes";
    fossil.whispers.forEach((w) => {
      const li = document.createElement("li");
      li.textContent = w;
      whispers.appendChild(li);
    });

    const actions = document.createElement("div");
    actions.className = "fossil-card__actions";

    const loreBtn = document.createElement("button");
    loreBtn.type = "button";
    loreBtn.textContent = "Whisper Lore";
    loreBtn.addEventListener("click", () => {
      showLore(fossil, "archive");
      setStatus(`${fossil.name} plaque previewed.`);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Place in Cabinet";
    addBtn.addEventListener("click", () => addToCabinet(fossil.id));

    actions.append(loreBtn, addBtn);

    card.append(glyph, title, epithet, origin, whispers, actions);
    fossilListEl.appendChild(card);
  });
}

function renderCabinet() {
  cabinetGridEl.innerHTML = "";
  cabinet.forEach((slot, index) => {
    const button = document.createElement("button");
    button.className = "cabinet-slot";
    button.setAttribute("role", "listitem");
    button.dataset.index = index;

    if (slot) {
      button.classList.add("cabinet-slot--filled");
      const specimen = document.createElement("div");
      specimen.className = "specimen";
      specimen.style.setProperty("--rotation", `${slot.rotation}deg`);
      specimen.style.setProperty("--glow", `${slot.glow}`);
      specimen.style.setProperty("--accent", slot.fossil.accent);
      specimen.style.setProperty("--accent-shadow", hexToRgba(slot.fossil.accent, 0.45));
      specimen.style.setProperty("--accent-border", hexToRgba(slot.fossil.accent, 0.62));
      specimen.style.setProperty("--accent-soft", hexToRgba(slot.fossil.accent, 0.28));
      specimen.style.setProperty("--accent-strong", hexToRgba(slot.fossil.accent, 0.65));

      const core = document.createElement("div");
      core.className = "specimen__core";

      const sigil = document.createElement("span");
      sigil.className = "specimen__sigil";
      sigil.textContent = slot.fossil.sigil;

      const tag = document.createElement("span");
      tag.className = "specimen__tag";
      tag.textContent = slot.fossil.name.split(" ")[0];

      core.append(sigil, tag);
      specimen.appendChild(core);
      button.appendChild(specimen);
    } else {
      const hint = document.createElement("span");
      hint.className = "cabinet-slot__hint";
      hint.innerHTML = `Stand ${index + 1}<br />Awaiting specimen`;
      button.appendChild(hint);
    }

    if (selectedSlot === index) {
      button.classList.add("cabinet-slot--active");
    }

    button.addEventListener("click", () => selectSlot(index));
    cabinetGridEl.appendChild(button);
  });
}

function addToCabinet(fossilId) {
  const fossil = fossils.find((item) => item.id === fossilId);
  if (!fossil) return;

  const alreadyIndex = cabinet.findIndex((slot) => slot && slot.fossil.id === fossilId);
  if (alreadyIndex !== -1) {
    selectedSlot = alreadyIndex;
    showLore(cabinet[alreadyIndex].fossil, "cabinet");
    updateControls();
    setStatus(`${fossil.name} is already on stand ${alreadyIndex + 1}. Adjust its pose.`);
    renderCabinet();
    return;
  }

  const emptyIndex = cabinet.findIndex((slot) => slot === null);
  if (emptyIndex === -1) {
    setStatus("All stands aglow. Release one to invite a new fossil.");
    return;
  }

  cabinet[emptyIndex] = {
    fossil,
    rotation: 120,
    glow: 0.6
  };
  selectedSlot = emptyIndex;
  showLore(fossil, "cabinet");
  updateControls();
  renderCabinet();
  setStatus(`${fossil.name} anchored on stand ${emptyIndex + 1}.`);
}

function selectSlot(index) {
  if (cabinet[index]) {
    selectedSlot = index;
    showLore(cabinet[index].fossil, "cabinet");
    updateControls();
    setStatus(`Stand ${index + 1} ready for adjustments.`);
  } else {
    selectedSlot = index;
    updateControls();
    setStatus(`Stand ${index + 1} is empty. Place a fossil to conjure light.`);
    resetLore();
  }
  renderCabinet();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function updateControls() {
  const hasSelection = selectedSlot !== null && cabinet[selectedSlot];
  rotationSlider.disabled = !hasSelection;
  glowSlider.disabled = !hasSelection;
  releaseButton.disabled = !hasSelection;

  if (hasSelection) {
    const slot = cabinet[selectedSlot];
    rotationSlider.value = slot.rotation;
    glowSlider.value = Math.round(slot.glow * 100);
    updateReadouts();
  } else {
    rotationSlider.value = 120;
    glowSlider.value = 60;
    updateReadouts();
  }
}

function updateReadouts() {
  const yaw = Number(rotationSlider.value);
  const glow = Number(glowSlider.value);
  document.getElementById("rotation-readout").textContent = `Yaw ${yaw}°`;
  document.getElementById("glow-readout").textContent = `Glow ${glow}%`;
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(104, 197, 184, ${alpha})`;
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(normalized)) {
    return `rgba(104, 197, 184, ${alpha})`;
  }

  const parsePair = (pair) => parseInt(pair, 16);
  let r;
  let g;
  let b;

  if (normalized.length === 3) {
    r = parsePair(normalized[0] + normalized[0]);
    g = parsePair(normalized[1] + normalized[1]);
    b = parsePair(normalized[2] + normalized[2]);
  } else {
    r = parsePair(normalized.slice(0, 2));
    g = parsePair(normalized.slice(2, 4));
    b = parsePair(normalized.slice(4, 6));
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showLore(fossil, context) {
  loreName.textContent = fossil.name;
  loreOrigin.textContent = fossil.origin;
  loreText.textContent = fossil.lore;
  loreNotes.textContent = fossil.notes;
  loreGlimmer.textContent = fossil.glimmer;
  if (context === "archive") {
    loreOrigin.textContent += " (preview)";
  }
}

function resetLore() {
  loreName.textContent = "No specimen selected";
  loreOrigin.textContent = "Anchor a relic to read its plaque.";
  loreText.textContent = "Each fossil emits differing hues once warmed by your cabinet. Piece together their story with your own intuition.";
  loreNotes.textContent = "Uncatalogued";
  loreGlimmer.textContent = "—";
}

rotationSlider.addEventListener("input", () => {
  updateReadouts();
  if (selectedSlot !== null && cabinet[selectedSlot]) {
    cabinet[selectedSlot].rotation = Number(rotationSlider.value);
    renderCabinet();
  }
});

glowSlider.addEventListener("input", () => {
  updateReadouts();
  if (selectedSlot !== null && cabinet[selectedSlot]) {
    cabinet[selectedSlot].glow = Number(glowSlider.value) / 100;
    renderCabinet();
  }
});

releaseButton.addEventListener("click", () => {
  if (selectedSlot === null || !cabinet[selectedSlot]) return;
  const removed = cabinet[selectedSlot];
  cabinet[selectedSlot] = null;
  setStatus(`${removed.fossil.name} released back to the archive.`);
  selectedSlot = null;
  renderCabinet();
  updateControls();
  resetLore();
});

renderArchive();
renderCabinet();
updateControls();
resetLore();
