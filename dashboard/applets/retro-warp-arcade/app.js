const root = document.documentElement;
const soundchipSelect = document.getElementById("soundchip");
const soundchipNote = document.getElementById("soundchipNote");
const paletteSelect = document.getElementById("palette");
const palettePreview = document.getElementById("palettePreview");
const glowSlider = document.getElementById("glow");
const glowValue = document.getElementById("glowValue");
const boostButtons = Array.from(document.querySelectorAll(".chip"));
const boostReadout = document.getElementById("boostReadout");
const startRunButton = document.getElementById("startRun");
const laneButtons = Array.from(document.querySelectorAll(".lane"));
const statusValue = document.getElementById("statusValue");
const sequenceList = document.getElementById("sequenceList");
const scoreValue = document.getElementById("scoreValue");
const streakValue = document.getElementById("streakValue");
const glitchValue = document.getElementById("glitchValue");
const leaderboardList = document.getElementById("leaderboard");
const runLog = document.getElementById("runLog");

const soundchipDescriptions = {
  sid: "Warm pulse width modulation with roomy basslines.",
  fm: "Sharp operators with glassy harmonics and twinkling bells.",
  pc: "Crunchy FM grit blended with sample-tracker slapback."
};

const palettePresets = {
  nebula: {
    accent: "#1dd3b0",
    accentStrong: "#0ef0c3",
    accentRgb: [14, 240, 195],
    panel: "rgba(7, 30, 36, 0.85)",
    panelStrong: "rgba(7, 30, 36, 0.95)"
  },
  amber: {
    accent: "#ffb347",
    accentStrong: "#ffd56f",
    accentRgb: [255, 181, 88],
    panel: "rgba(41, 24, 6, 0.85)",
    panelStrong: "rgba(41, 24, 6, 0.95)"
  },
  glacier: {
    accent: "#7ef06c",
    accentStrong: "#bbff83",
    accentRgb: [126, 240, 108],
    panel: "rgba(12, 32, 10, 0.85)",
    panelStrong: "rgba(12, 32, 10, 0.95)"
  }
};

const boostDescriptions = {
  overclock: "Faster tick scoring keeps your points surging.",
  shield: "Flux shield absorbs one glitch before it hits.",
  trail: "Comet trails boost streak multipliers."
};

const laneLabels = ["Left Surge", "Core Flux", "Right Rift"];

const baseLeaderboard = [
  { name: "VECTRA", score: 14820 },
  { name: "NOVA-IX", score: 13340 },
  { name: "BYTE DRIFT", score: 12060 },
  { name: "ARC-LUMEN", score: 11220 },
  { name: "CHIP DANCER", score: 10500 }
];

let currentAccentRgb = palettePresets[paletteSelect.value].accentRgb;
let activeBoosts = [];
let leaderboardEntries = [...baseLeaderboard];
let playerEntry = null;
let sequence = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let glitches = 0;
let shieldCharges = 0;
let highestStreak = 0;
let gameActive = false;
let callSign = "";

function updateSoundchipNote() {
  const description = soundchipDescriptions[soundchipSelect.value];
  soundchipNote.textContent = description;
}

function applyPalette() {
  const preset = palettePresets[paletteSelect.value];
  currentAccentRgb = preset.accentRgb;
  root.style.setProperty("--accent", preset.accent);
  root.style.setProperty("--accent-strong", preset.accentStrong);
  root.style.setProperty("--accent-soft", `rgba(${preset.accentRgb.join(", ")}, 0.2)`);
  root.style.setProperty("--bg-panel", preset.panel);
  root.style.setProperty("--bg-panel-strong", preset.panelStrong);
  palettePreview.style.setProperty(
    "background",
    `linear-gradient(120deg, ${preset.accent} 0%, ${preset.accentStrong} 100%)`
  );
  updateGlow();
}

function updateGlow() {
  const intensity = Number(glowSlider.value);
  const alpha = Math.min(Math.max(intensity / 100, 0.18), 0.85);
  const glowColor = `rgba(${currentAccentRgb.join(", ")}, ${alpha.toFixed(2)})`;
  root.style.setProperty("--accent-glow", glowColor);
  glowValue.textContent = intensity;
}

function toggleBoost(button) {
  const { chip } = button.dataset;
  if (!chip) return;

  if (activeBoosts.includes(chip)) {
    activeBoosts = activeBoosts.filter((item) => item !== chip);
    button.classList.remove("is-active");
  } else {
    activeBoosts.push(chip);
    button.classList.add("is-active");
  }

  if (activeBoosts.length === 0) {
    boostReadout.textContent = "Select boosts to amplify your warp route.";
    return;
  }

  const phrases = activeBoosts.map((boost) => boostDescriptions[boost]);
  boostReadout.textContent = phrases.join(" · ");
}

function resetRunState() {
  sequence = [];
  currentIndex = 0;
  score = 0;
  streak = 0;
  glitches = 0;
  highestStreak = 0;
  shieldCharges = activeBoosts.includes("shield") ? 1 : 0;
  playerEntry = null;
  callSign = createCallsign();
  leaderboardEntries = [...baseLeaderboard];
  updateMetrics();
  renderSequence();
  renderLeaderboard();
}

function createCallsign() {
  const chipTag = {
    sid: "SID",
    fm: "FM",
    pc: "AD"
  }[soundchipSelect.value];

  const paletteTag = {
    nebula: "GLIDE",
    amber: "EMBER",
    glacier: "GLAC"
  }[paletteSelect.value];

  const digits = Math.floor(Math.random() * 900 + 100);
  return `${chipTag}-${paletteTag}-${digits}`;
}

function startRun() {
  if (gameActive) return;
  gameActive = true;
  resetRunState();

  playerEntry = { name: callSign, score: 0, isPlayer: true };
  leaderboardEntries.push(playerEntry);

  const length = 12;
  sequence = Array.from({ length }, () => Math.floor(Math.random() * laneLabels.length));
  currentIndex = 0;
  score = 0;
  streak = 0;
  glitches = 0;
  highestStreak = 0;
  updateMetrics();
  renderSequence();
  renderLeaderboard();
  highlightActiveLane();

  statusValue.textContent = "Sequence armed. Catch cadence engaged.";
  runLog.textContent = `Warp run ${callSign} primed with ${length} beats. Maintain tempo.`;
  startRunButton.disabled = true;
  startRunButton.textContent = "Run Active";
}

function handleLanePress(event) {
  if (!gameActive) return;
  const button = event.currentTarget;
  const lane = Number(button.dataset.lane);

  clearLaneHighlights();

  if (sequence[currentIndex] === lane) {
    handleCorrectCatch(lane);
  } else {
    handleIncorrectCatch(button);
  }

  highlightActiveLane();
}

function handleCorrectCatch(lane) {
  const baseScore = 140;
  const boostBonus = activeBoosts.includes("overclock") ? 20 : 0;
  const streakBonusMultiplier = activeBoosts.includes("trail") ? 12 : 8;

  streak += 1;
  highestStreak = Math.max(highestStreak, streak);

  const streakBonus = Math.floor((streak - 1) * streakBonusMultiplier);
  score += baseScore + boostBonus + streakBonus;

  const activeItem = sequenceList.children[currentIndex];
  if (activeItem) {
    activeItem.classList.remove("is-active");
    activeItem.classList.add("is-cleared");
  }

  currentIndex += 1;
  updateMetrics();
  renderLeaderboard();

  if (currentIndex >= sequence.length) {
    endRun(true);
    return;
  }

  statusValue.textContent = `Nice catch on ${laneLabels[lane]}!`;
  runLog.textContent = `Streak ${streak} · +${baseScore + boostBonus + streakBonus} warp credits.`;
}

function handleIncorrectCatch(button) {
  if (shieldCharges > 0) {
    shieldCharges -= 1;
    statusValue.textContent = "Flux shield absorbed the glitch!";
    runLog.textContent = "Shield buffer engaged. Sequence continues.";
  } else {
    glitches += 1;
    score = Math.max(0, score - 90);
    streak = 0;
    statusValue.textContent = "Glitch! Sequence desynced.";
    runLog.textContent = "Tempo slip registered. Re-center on the next prompt.";
  }

  updateMetrics();
  renderLeaderboard();

  button.classList.add("is-error");
  setTimeout(() => {
    button.classList.remove("is-error");
  }, 280);
}

function endRun(completed) {
  gameActive = false;
  startRunButton.disabled = false;
  startRunButton.textContent = "Launch Warp Run";

  const activeItem = sequenceList.children[currentIndex];
  if (activeItem) {
    activeItem.classList.remove("is-active");
  }

  clearLaneHighlights();
  renderLeaderboard();

  if (completed) {
    statusValue.textContent = "Warp run complete!";
    runLog.textContent = `Logged ${score} credits with a ${highestStreak} chain and ${glitches} glitches.`;
  } else {
    statusValue.textContent = "Run terminated.";
    runLog.textContent = "Sequence aborted. Credits banked from previous catches.";
  }
}

function updateMetrics() {
  scoreValue.textContent = score;
  streakValue.textContent = streak;
  glitchValue.textContent = glitches;

  if (playerEntry) {
    playerEntry.score = score;
  }
}

function renderSequence() {
  sequenceList.innerHTML = "";
  sequence.forEach((lane, index) => {
    const li = document.createElement("li");
    li.textContent = laneLabels[lane];
    if (index < currentIndex) {
      li.classList.add("is-cleared");
    } else if (index === currentIndex) {
      li.classList.add("is-active");
    }
    sequenceList.appendChild(li);
  });
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  const sorted = [...leaderboardEntries].sort((a, b) => b.score - a.score);
  sorted.slice(0, 6).forEach((entry, index) => {
    const li = document.createElement("li");
    if (entry.isPlayer) {
      li.classList.add("is-player");
    }

    const rank = document.createElement("span");
    rank.className = "leaderboard__rank";
    rank.textContent = `#${index + 1}`;

    const name = document.createElement("span");
    name.className = "leaderboard__name";
    name.textContent = entry.name;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "leaderboard__score";
    scoreSpan.textContent = entry.score;

    li.append(rank, name, scoreSpan);
    leaderboardList.appendChild(li);
  });
}

function clearLaneHighlights() {
  laneButtons.forEach((button) => button.classList.remove("is-hot"));
}

function highlightActiveLane() {
  clearLaneHighlights();
  const activeLaneIndex = sequence[currentIndex];
  if (typeof activeLaneIndex === "number") {
    const button = laneButtons.find((laneButton) => Number(laneButton.dataset.lane) === activeLaneIndex);
    if (button) {
      button.classList.add("is-hot");
    }
  }

  const items = sequenceList.children;
  Array.from(items).forEach((item, index) => {
    item.classList.toggle("is-active", index === currentIndex);
  });
}

function abortRun() {
  if (!gameActive) return;
  endRun(false);
}

soundchipSelect.addEventListener("change", () => {
  updateSoundchipNote();
  if (!gameActive) {
    callSign = createCallsign();
  }
});

paletteSelect.addEventListener("change", () => {
  applyPalette();
  if (!gameActive) {
    callSign = createCallsign();
  }
});

glowSlider.addEventListener("input", updateGlow);

boostButtons.forEach((button) => {
  button.addEventListener("click", () => toggleBoost(button));
});

startRunButton.addEventListener("click", startRun);

laneButtons.forEach((button) => {
  button.addEventListener("click", handleLanePress);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    abortRun();
  }
});

updateSoundchipNote();
applyPalette();
renderLeaderboard();
