const orbit = document.getElementById("orbit");
const ringButtons = document.getElementById("ringButtons");
const coreDisplay = document.getElementById("coreDisplay");
const ledgerList = document.getElementById("ledgerList");
const statusPill = document.getElementById("statusPill");
const exportBtn = document.getElementById("exportBtn");
const radiusControl = document.getElementById("radiusControl");
const driftControl = document.getElementById("driftControl");

const goldenAngle = 137.50776405003785;
let shards = [];
let baseAngle = Math.random() * 360;
let activeShardId = null;
let spinAngle = 0;
let spinVelocity = Number(driftControl.value) / 600;

const categories = [
  {
    id: "pulse",
    label: "Pulse Glyph",
    accent: "rgba(255, 209, 102, 0.48)",
    motif: "tremor",
  },
  {
    id: "crest",
    label: "Crest Archive",
    accent: "rgba(255, 122, 72, 0.48)",
    motif: "crest",
  },
  {
    id: "lantern",
    label: "Lantern Trace",
    accent: "rgba(188, 232, 95, 0.4)",
    motif: "lantern",
  },
  {
    id: "sonar",
    label: "Sonar Thread",
    accent: "rgba(140, 220, 180, 0.38)",
    motif: "sonar",
  },
  {
    id: "glide",
    label: "Glide Memory",
    accent: "rgba(255, 161, 90, 0.42)",
    motif: "glide",
  },
];

const motifs = {
  tremor: {
    tones: ["brassy cadence", "subtle heart-skip", "arclight murmur", "low-frequency bloom", "syncopated hush"],
    frames: ["dawn wharf", "empty terminal", "orbital greenhouse", "midnight tram depot", "fog spire"],
    textures: ["stuttered steam", "metal-stitched mist", "warm quartz dust", "conductive dew", "paper-soft sparks"],
  },
  crest: {
    tones: ["delayed surf", "wingbeat echoes", "slow tide bells", "silted trellis chords", "gentle gull sweep"],
    frames: ["tidal observatory", "floating herbarium", "skyline causeway", "depot mezzanine", "horizon bridge"],
    textures: ["salt-threaded linen", "coral etching", "mica shimmer", "sun-bent copper", "reed lattice"],
  },
  lantern: {
    tones: ["lantern purr", "hearthline hiss", "ember pulse", "velvet static", "woolen glow"],
    frames: ["attic observatory", "silica grove", "catwalk of mirrors", "drift dormitory", "archive canopy"],
    textures: ["braided fiber smoke", "molten beeswax", "glowing graphite", "lacquered cotton", "hushed marigold"],
  },
  sonar: {
    tones: ["tidal ping", "magnet hum", "deep library throb", "polished kelp resonance", "subsurface trill"],
    frames: ["undersea atrium", "hydrolift lock", "algae well", "seaborne workshop", "tidal glassway"],
    textures: ["wet vellum", "crisp mineral foam", "suspended droplets", "silver kelp fringe", "cool basalt note"],
  },
  glide: {
    tones: ["skate hiss", "thermal sway", "liftbridge hush", "windribbon snap", "skytrail rustle"],
    frames: ["hover rail", "ridge-line skydock", "sunken courtyard", "orbital promenade", "signal terrace"],
    textures: ["graphite powder", "polished basalt", "helium chiffon", "amberglass grit", "charcoal velvet"],
  },
};

const connectors = [
  "braids with",
  "braid-locks",
  "threads beside",
  "mirrors",
  "whispers toward",
  "anchors to",
  "flanks",
];

const inflections = [
  "an afterimage of restless orbiters",
  "a hush that steadies loose circuitry",
  "a warm wake for anyone drifting by",
  "coded reassurance for off-duty navigators",
  "a map the archives forgot to finalise",
  "contrails of patience left in place",
  "a signal to breathe between jumps",
];

function buildShardContent(category) {
  return synthLine(category);
}

function synthLine(category) {
  const motif = motifs[category.motif];
  const tone = randomPick(motif.tones);
  const frame = randomPick(motif.frames);
  const texture = randomPick(motif.textures);
  const partnerOptions = categories.filter((c) => c.id !== category.id);
  const partnerCategory = partnerOptions.length ? randomPick(partnerOptions) : category;
  const connector = randomPick(connectors);
  const inflection = randomPick(inflections);

  const headline = `${capitalize(tone)} @ ${frame}`;
  const summary = `It loops with ${texture} and ${connector} the ${partnerCategory.label.toLowerCase()}.`;
  const detail = inflection;
  return { headline, summary, detail };
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLedgerEntry(index, shard) {
  return `<span class="tag">${index + 1}. ${shard.label}</span>${shard.headline}<br/><small>${shard.summary}</small>`;
}

function updateStatus(message, accent) {
  statusPill.textContent = message;
  statusPill.style.background = accent;
  statusPill.style.borderColor = accent;
  statusPill.style.color = "#131d19";
}

function updateCore(shard) {
  if (!shard) {
    coreDisplay.innerHTML = `<div class="core-prompt">tap a beam</div><div class="core-echo">to weave your first shard</div>`;
    return;
  }
  coreDisplay.innerHTML = `<div class="core-prompt">${shard.label}</div><div class="core-echo">${shard.headline}</div><div class="core-echo" style="font-size:0.75rem;color:rgba(217,228,221,0.78);">${shard.summary}</div>`;
}

function setActiveShard(id) {
  activeShardId = id;
  const shardData = shards.find((s) => s.id === id);
  document.querySelectorAll(".shard").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });
  document.querySelectorAll(".ledger-list li").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });
  updateCore(shardData);
}

function updateShardPositions() {
  const radius = Number(radiusControl.value);
  shards.forEach((shard) => {
    shard.angle = normalizeAngle(shard.angle);
    const shardEl = document.querySelector(`.shard[data-id="${shard.id}"]`);
    if (shardEl) {
      shardEl.style.setProperty("--angle", `${shard.angle}deg`);
      shardEl.style.setProperty("--distance", `${radius}px`);
    }
  });
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function createShard(category) {
  const id = `${category.id}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const { headline, summary, detail } = buildShardContent(category);
  const angle = normalizeAngle(baseAngle + shards.length * goldenAngle + (Math.random() * 36 - 18));

  const shardEl = document.createElement("article");
  shardEl.className = "shard";
  shardEl.dataset.id = id;
  shardEl.setAttribute("tabindex", "0");

  const heading = document.createElement("h3");
  heading.textContent = category.label;
  shardEl.appendChild(heading);

  const summaryEl = document.createElement("p");
  summaryEl.textContent = headline;
  shardEl.appendChild(summaryEl);

  const detailEl = document.createElement("div");
  detailEl.className = "detail";
  detailEl.textContent = summary;
  shardEl.appendChild(detailEl);

  const inflectionEl = document.createElement("div");
  inflectionEl.className = "detail";
  inflectionEl.style.color = "rgba(217, 228, 221, 0.55)";
  inflectionEl.textContent = detail;
  shardEl.appendChild(inflectionEl);

  shardEl.style.setProperty("--angle", `${angle}deg`);
  shardEl.style.setProperty("--distance", `${Number(radiusControl.value)}px`);

  addShardInteractivity(shardEl);

  orbit.appendChild(shardEl);

  const shardRecord = {
    id,
    label: category.label,
    angle,
    headline,
    summary,
    detail,
    accent: category.accent,
  };
  shards.push(shardRecord);

  appendLedgerRow(shardRecord);
  setActiveShard(id);
  updateStatus(`${category.label} minted`, category.accent);
  updateCore(shardRecord);
  cleanEmptyMessage();
}

function addShardInteractivity(shardEl) {
  shardEl.addEventListener("click", () => {
    setActiveShard(shardEl.dataset.id);
  });
  shardEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveShard(shardEl.dataset.id);
    }
  });

  let dragging = false;

  shardEl.addEventListener("pointerdown", (event) => {
    dragging = true;
    shardEl.setPointerCapture(event.pointerId);
    shardEl.dataset.dragging = "true";
  });

  shardEl.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const center = getOrbitCenter();
    const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
    const deg = normalizeAngle((angle * 180) / Math.PI);
    const shardData = shards.find((s) => s.id === shardEl.dataset.id);
    if (shardData) {
      shardData.angle = deg;
      shardEl.style.setProperty("--angle", `${deg}deg`);
    }
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    shardEl.releasePointerCapture(event.pointerId);
    shardEl.dataset.dragging = "false";
  };

  shardEl.addEventListener("pointerup", endDrag);
  shardEl.addEventListener("pointercancel", endDrag);
}

function getOrbitCenter() {
  const bounds = orbit.getBoundingClientRect();
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  };
}

function appendLedgerRow(shard) {
  const li = document.createElement("li");
  li.dataset.id = shard.id;
  li.innerHTML = formatLedgerEntry(shards.indexOf(shard), shard);
  li.addEventListener("click", () => setActiveShard(shard.id));
  li.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveShard(shard.id);
    }
  });
  li.setAttribute("tabindex", "0");
  ledgerList.appendChild(li);
}

function cleanEmptyMessage() {
  const emptyRow = ledgerList.querySelector(".empty");
  if (emptyRow) {
    emptyRow.remove();
  }
}

function rebuildLedger() {
  ledgerList.innerHTML = "";
  if (!shards.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No shards yet. The ledger lights up as soon as you cast one.";
    ledgerList.appendChild(li);
    updateCore(null);
    statusPill.textContent = "Awaiting your first filament.";
    statusPill.style.background = "rgba(255, 122, 72, 0.2)";
    statusPill.style.color = "var(--sunspot)";
    statusPill.style.borderColor = "rgba(255, 122, 72, 0.45)";
    return;
  }
  shards.forEach((shard, index) => {
    const li = document.createElement("li");
    li.dataset.id = shard.id;
    li.innerHTML = formatLedgerEntry(index, shard);
    li.setAttribute("tabindex", "0");
    li.addEventListener("click", () => setActiveShard(shard.id));
    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveShard(shard.id);
      }
    });
    ledgerList.appendChild(li);
  });
}

function exportLedger() {
  if (!navigator.clipboard) {
    updateStatus("Clipboard unavailable", "rgba(255, 122, 72, 0.4)");
    return;
  }
  if (!shards.length) {
    updateStatus("Nothing to copy yet", "rgba(255, 122, 72, 0.28)");
    return;
  }
  const payload = shards
    .map((shard, index) => `${index + 1}. ${shard.label}\n   ${shard.headline}\n   ${shard.summary}\n   ${shard.detail}`)
    .join("\n\n");
  navigator.clipboard
    .writeText(payload)
    .then(() => updateStatus("Ledger copied to clipboard", "rgba(240, 246, 178, 0.4)"))
    .catch(() => updateStatus("Copy failed", "rgba(255, 122, 72, 0.4)"));
}

function mountRingButtons() {
  const radius = orbit.offsetWidth / 2 - 40;
  categories.forEach((category, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = category.label;
    btn.dataset.id = category.id;
    const angle = (index / categories.length) * 360;
    const transform = `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`;
    btn.style.transform = transform;
    btn.style.boxShadow = `0 0 14px ${category.accent}`;
    btn.addEventListener("click", () => {
      createShard(category);
    });
    ringButtons.appendChild(btn);
  });
}

function animateOrbit() {
  spinAngle = normalizeAngle(spinAngle + spinVelocity);
  orbit.style.setProperty("--spin-rotation", `${spinAngle}deg`);
  requestAnimationFrame(animateOrbit);
}

function handleResize() {
  ringButtons.innerHTML = "";
  mountRingButtons();
}

radiusControl.addEventListener("input", () => {
  updateShardPositions();
  updateStatus("Orbit radius adjusted", "rgba(240, 246, 178, 0.32)");
});

driftControl.addEventListener("input", () => {
  spinVelocity = Number(driftControl.value) / 600;
  updateStatus("Drift pulse recalibrated", "rgba(255, 122, 72, 0.32)");
});

exportBtn.addEventListener("click", exportLedger);

window.addEventListener("resize", () => {
  window.requestAnimationFrame(handleResize);
});

mountRingButtons();
updateShardPositions();
rebuildLedger();
animateOrbit();

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setActiveShard(null);
  }
});
