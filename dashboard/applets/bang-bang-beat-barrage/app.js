const BEATS_PER_LOOP = 8;
const BASE_BPM = 104;
const MIN_BPM = 92;
const MAX_BPM = 138;

const beatTrack = document.getElementById("beatTrack");
const leftPad = document.getElementById("leftPad");
const rightPad = document.getElementById("rightPad");
const tempoDisplay = document.getElementById("tempoDisplay");
const loopDisplay = document.getElementById("loopDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const comboDisplay = document.getElementById("comboDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const energyFill = document.getElementById("energyFill");
const energyStatus = document.getElementById("energyStatus");
const commentaryFeed = document.getElementById("commentaryFeed");
const slamButton = document.getElementById("slamButton");

const state = {
  score: 0,
  combo: 0,
  bestCombo: 0,
  energy: 50,
  beatIndex: -1,
  loopNumber: -1,
  awaitingHit: false,
  canHit: false,
  sequence: [],
  timer: null,
  missTimer: null,
  nextLoopMessage: "Warm-up barrage locked. Keep the hits precise!",
};

const beatElements = [];
const commentary = [];

function initBeatTrack() {
  beatTrack.innerHTML = "";
  beatElements.length = 0;
  for (let i = 0; i < BEATS_PER_LOOP; i += 1) {
    const beat = document.createElement("div");
    beat.className = "beat";
    beat.setAttribute("role", "presentation");
    beatElements.push(beat);
    beatTrack.appendChild(beat);
  }
}

function createSequence() {
  const sequence = [];
  let lastSide = null;
  const accentChance = Math.min(0.5, 0.22 + state.energy * 0.002 + state.loopNumber * 0.015);

  for (let i = 0; i < BEATS_PER_LOOP; i += 1) {
    let side = Math.random() < 0.5 ? "left" : "right";
    if (side === lastSide && Math.random() < 0.45) {
      side = side === "left" ? "right" : "left";
    }
    const accent = Math.random() < accentChance;
    sequence.push({ side, accent });
    lastSide = side;
  }

  return sequence;
}

function refreshBeatTrack() {
  beatElements.forEach((element, index) => {
    const beat = state.sequence[index];
    element.className = "beat";
    element.textContent = "";

    if (!beat) {
      return;
    }

    element.classList.add(beat.side === "left" ? "beat--left" : "beat--right");
    if (beat.accent) {
      element.classList.add("beat--accent");
      const span = document.createElement("span");
      span.className = "spark";
      span.textContent = beat.side === "left" ? "◀" : "▶";
      element.appendChild(span);
    } else {
      element.textContent = beat.side === "left" ? "◀" : "▶";
    }
  });
}

function prepareNextLoop() {
  state.loopNumber += 1;
  state.sequence = createSequence();
  refreshBeatTrack();

  const message =
    state.nextLoopMessage ||
    (state.loopNumber === 0
      ? "Loop one ignites — feel the first volley."
      : `Loop ${state.loopNumber + 1} surges with fresh sparks!`);
  pushCommentary(message);
  state.nextLoopMessage = null;
}

function computeBpm() {
  const energyFactor = (state.energy - 50) * 0.25;
  const comboFactor = Math.min(state.combo * 0.7, 14);
  const bpm = Math.round(BASE_BPM + energyFactor + comboFactor);
  return Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
}

function advanceBeat() {
  if (state.awaitingHit) {
    registerMiss("missed");
  }

  state.beatIndex = (state.beatIndex + 1) % BEATS_PER_LOOP;
  if (state.beatIndex === 0 || state.sequence.length === 0) {
    prepareNextLoop();
  }

  setActiveBeat(state.beatIndex);
  loopDisplay.textContent = `${state.beatIndex + 1} / ${BEATS_PER_LOOP}`;

  state.awaitingHit = true;
  state.canHit = true;

  const bpm = computeBpm();
  tempoDisplay.textContent = `${bpm} BPM`;
  const beatDuration = Math.max(380, Math.round(60000 / bpm));
  const hitWindow = Math.max(260, Math.round(beatDuration * 0.55));

  clearTimeout(state.missTimer);
  state.missTimer = setTimeout(() => {
    if (state.awaitingHit) {
      registerMiss("late");
    }
  }, hitWindow);

  clearTimeout(state.timer);
  state.timer = setTimeout(advanceBeat, beatDuration);
}

function setActiveBeat(index) {
  beatElements.forEach((element, i) => {
    element.classList.toggle("is-active", i === index);
    if (i !== index) {
      element.classList.remove("is-hit");
      element.classList.remove("is-miss");
    }
  });
}

function handlePad(side) {
  const lane = side === "left" ? leftPad : rightPad;
  lane.classList.remove("is-miss");

  if (!state.canHit) {
    registerMiss("offbeat", lane);
    return;
  }

  const beat = state.sequence[state.beatIndex];
  state.awaitingHit = false;
  state.canHit = false;
  clearTimeout(state.missTimer);

  if (beat && beat.side === side) {
    const basePoints = beat.accent ? 150 : 100;
    const comboBonus = Math.floor(state.combo * 12);
    state.score += basePoints + comboBonus;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    const energyGain = beat.accent ? 7 : 5;
    state.energy = Math.min(100, state.energy + energyGain);

    markBeatResult("is-hit");
    animateLane(lane, "hit");

    updateScoreboard();
    updateEnergyReadout("hit", beat.accent);
    setSlamButtonState();

    if (beat.accent && state.combo > 0 && state.combo % 4 === 0) {
      pushCommentary(`Spark shower! Combo streak at x${state.combo}.`);
    } else if (!beat.accent && state.combo % 6 === 0 && state.combo > 0) {
      pushCommentary(`Crowd chanting at x${state.combo}! Keep striking.`);
    }
  } else {
    registerMiss("wrong", lane);
  }
}

function markBeatResult(className) {
  const element = beatElements[state.beatIndex];
  if (!element) return;
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, 320);
}

function animateLane(lane, mode) {
  if (!lane) return;
  lane.classList.remove("is-hit", "is-miss");
  const className = mode === "hit" ? "is-hit" : "is-miss";
  lane.classList.add(className);
  setTimeout(() => {
    lane.classList.remove(className);
  }, 360);
}

function registerMiss(type, lane) {
  state.awaitingHit = false;
  state.canHit = false;
  clearTimeout(state.missTimer);

  if (type !== "offbeat") {
    markBeatResult("is-miss");
  }

  if (lane) {
    animateLane(lane, "miss");
  }

  const energyDrain = type === "offbeat" ? 6 : type === "late" ? 9 : 11;
  state.energy = Math.max(0, state.energy - energyDrain);
  state.combo = 0;

  updateScoreboard();
  updateEnergyReadout("miss");
  setSlamButtonState();

  let message = "Beat dropped — recover fast!";
  if (type === "offbeat") {
    message = "Off-beat bang! Wait for the glow.";
  } else if (type === "late") {
    message = "Late strike — crowd loses a spark.";
  } else if (type === "wrong") {
    message = "Crossfire! Hit the matching cannon.";
  }
  pushCommentary(message);
}

function updateScoreboard() {
  scoreDisplay.textContent = state.score.toString().padStart(6, "0");
  comboDisplay.textContent = `x${state.combo}`;
  bestDisplay.textContent = `x${state.bestCombo}`;
}

function updateEnergyReadout(mode, accent = false) {
  energyFill.style.width = `${state.energy}%`;

  let status = "Holding steady";
  if (state.energy >= 90) {
    status = "Arena detonation imminent!";
  } else if (state.energy >= 70) {
    status = "Voltage roaring";
  } else if (state.energy >= 50) {
    status = "Crowd bouncing";
  } else if (state.energy >= 30) {
    status = "Keep the rhythm alive";
  } else {
    status = "Voltage fading — land those bangs!";
  }

  if (mode === "hit") {
    status = accent ? "Accent nailed! Crowd sparks fly." : "Clean hit keeps the groove.";
  } else if (mode === "slam") {
    status = "Thunder Slam! Voltage maxed.";
  } else if (mode === "miss") {
    status = "Crowd winces — bring them back.";
  }

  energyStatus.textContent = status;
}

function pushCommentary(text) {
  commentary.unshift({ text, timestamp: Date.now() });
  if (commentary.length > 6) {
    commentary.pop();
  }

  commentaryFeed.innerHTML = "";
  commentary.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry.text;
    commentaryFeed.appendChild(li);
  });
}

function setSlamButtonState() {
  if (state.combo >= 8) {
    slamButton.disabled = false;
    slamButton.textContent = "Thunder Slam Ready — unleash now";
  } else {
    slamButton.disabled = true;
    slamButton.textContent = "Build 8 combo to unleash Slam";
  }
}

function triggerSlam() {
  if (state.combo < 8) return;

  state.score += 500 + state.combo * 14;
  state.energy = Math.min(100, state.energy + 18);
  pushCommentary("Thunder Slam! Sequence vaporized — new barrage primed.");

  state.combo = 0;
  updateScoreboard();
  updateEnergyReadout("slam");
  setSlamButtonState();

  clearTimeout(state.timer);
  clearTimeout(state.missTimer);
  state.awaitingHit = false;
  state.canHit = false;
  state.nextLoopMessage = "Fresh sparks incoming after that slam!";
  state.sequence = [];
  state.beatIndex = -1;
  setTimeout(advanceBeat, 420);
}

function bindEvents() {
  leftPad.addEventListener("click", () => handlePad("left"));
  rightPad.addEventListener("click", () => handlePad("right"));
  slamButton.addEventListener("click", triggerSlam);

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      handlePad("left");
    }
    if (event.key.toLowerCase() === "l") {
      event.preventDefault();
      handlePad("right");
    }
    if (event.key.toLowerCase() === " " && !slamButton.disabled) {
      event.preventDefault();
      triggerSlam();
    }
  });
}

function startShow() {
  initBeatTrack();
  updateScoreboard();
  updateEnergyReadout("init");
  setSlamButtonState();
  bindEvents();

  pushCommentary("Crowd is clapping — the barrage begins soon.");

  setTimeout(() => {
    advanceBeat();
  }, 800);
}

startShow();
