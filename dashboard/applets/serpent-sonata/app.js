const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const highScoreValue = document.getElementById("highScoreValue");
const tempoValue = document.getElementById("tempoValue");
const comboValue = document.getElementById("comboValue");
const introOverlay = document.getElementById("introOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverSummary = document.getElementById("gameOverSummary");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const shareButton = document.getElementById("shareButton");
const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");
const soundToggle = document.getElementById("soundToggle");
const pulseMeter = document.getElementById("pulseMeter");
const badges = {
  flow: document.getElementById("flowBadge"),
  precision: document.getElementById("precisionBadge"),
  forager: document.getElementById("foragerBadge"),
};

const gridSize = 28;
const cellSize = canvas.width / gridSize;
const comboWindow = 4200;
const specialInterval = 5;
const highScoreKey = "serpent-sonata-highscore";

const audioEngine = (() => {
  let context;
  let enabled = true;

  const ensureContext = () => {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
    }
    if (context.state === "suspended") {
      context.resume();
    }
    return context;
  };

  const scheduleTone = (frequency, duration = 0.2, type = "sine", gain = 0.25, delay = 0) => {
    if (!enabled) return;
    const ctxAudio = ensureContext();
    const oscillator = ctxAudio.createOscillator();
    const gainNode = ctxAudio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;

    const startTime = ctxAudio.currentTime + delay;
    const attack = Math.min(0.04, duration / 3);
    const sustain = Math.max(duration - attack * 2, 0);
    const release = Math.min(0.08, duration / 3);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(gain, startTime + attack);
    gainNode.gain.setValueAtTime(gain, startTime + attack + sustain);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + sustain + release);

    oscillator.connect(gainNode).connect(ctxAudio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + attack + sustain + release + 0.02);
  };

  return {
    unlock() {
      try {
        ensureContext();
      } catch (error) {
        console.error("Web Audio unavailable", error);
      }
    },
    setEnabled(value) {
      enabled = value;
      if (enabled && context?.state === "suspended") {
        context.resume();
      }
    },
    harvest(comboLevel = 0) {
      const base = 380 + comboLevel * 28;
      scheduleTone(base, 0.14, "triangle", 0.23);
      scheduleTone(base * 1.5, 0.2, "sine", 0.12, 0.02);
    },
    blossom() {
      [0, 0.08, 0.16].forEach((delay, index) => {
        scheduleTone(520 + index * 90, 0.22, "sawtooth", 0.18, delay);
      });
    },
    combo(level) {
      const root = 420 + level * 22;
      scheduleTone(root, 0.32, "triangle", 0.22);
      scheduleTone(root * 4 / 3, 0.28, "sine", 0.16, 0.05);
    },
    finale() {
      scheduleTone(240, 0.6, "sine", 0.3);
      scheduleTone(160, 0.7, "triangle", 0.22, 0.02);
      scheduleTone(480, 0.4, "sawtooth", 0.12, 0.04);
    }
  };
})();

const state = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: null,
  specialCounter: 0,
  pendingGrowth: 0,
  score: 0,
  combo: 0,
  comboTimer: 0,
  best: Number(localStorage.getItem(highScoreKey)) || 0,
  baseSpeed: 120,
  lastTick: 0,
  playing: false,
  paused: false,
  achievements: {
    flow: false,
    precision: false,
    forager: false,
  },
  harvests: 0,
};

const speedLabels = {
  1: "Leisure",
  2: "Medium",
  3: "Fervent",
};

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function resetState() {
  state.snake = [
    { x: 8, y: 14 },
    { x: 7, y: 14 },
    { x: 6, y: 14 },
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.food = spawnFood();
  state.specialCounter = 0;
  state.pendingGrowth = 0;
  state.score = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.lastTick = 0;
  state.paused = false;
  state.playing = true;
  state.achievements = {
    flow: false,
    precision: true,
    forager: false,
  };
  state.harvests = 0;
  pulseMeter.style.setProperty("--pulse", "5%");
  updateScoreDisplays();
  updateBadges();
  hideOverlays();
}

function hideOverlays() {
  introOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
}

function showIntro() {
  introOverlay.classList.remove("hidden");
}

function spawnFood(forceSpecial = false) {
  const occupied = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (occupied.has(`${position.x},${position.y}`));

  if (!forceSpecial) {
    state.specialCounter += 1;
  }

  const shouldSpawnSpecial = forceSpecial || state.specialCounter >= specialInterval;
  if (shouldSpawnSpecial) {
    state.specialCounter = 0;
  }

  return {
    ...position,
    type: shouldSpawnSpecial ? "blossom" : "harvest",
  };
}

function updateScoreDisplays() {
  scoreValue.textContent = state.score.toString();
  highScoreValue.textContent = state.best.toString();
  comboValue.textContent = state.combo.toString();
}

function tick(timestamp) {
  if (!state.playing) {
    return;
  }

  if (state.paused) {
    requestAnimationFrame(tick);
    draw();
    return;
  }

  if (!state.lastTick) {
    state.lastTick = timestamp;
  }
  const elapsed = timestamp - state.lastTick;
  const effectiveSpeed = computeSpeed();

  if (elapsed >= effectiveSpeed) {
    step();
    state.lastTick = timestamp;
  }

  draw();
  requestAnimationFrame(tick);
}

function computeSpeed() {
  const base = state.baseSpeed;
  const comboBoost = Math.min(state.combo * 4, 60);
  return Math.max(60, base - comboBoost);
}

function step() {
  state.direction = validateDirection(state.direction, state.nextDirection);
  const head = state.snake[0];
  const nextHead = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  if (nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize) {
    state.achievements.precision = false;
    return triggerGameOver("The serpent struck the boundary.");
  }

  if (state.snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    return triggerGameOver("The serpent crossed its own trail.");
  }

  state.snake.unshift(nextHead);

  if (state.food && nextHead.x === state.food.x && nextHead.y === state.food.y) {
    consumeFood();
  } else if (state.pendingGrowth > 0) {
    state.pendingGrowth -= 1;
  } else {
    state.snake.pop();
  }

  updateComboTimer();
}

function consumeFood() {
  state.harvests += 1;
  const isSpecial = state.food.type === "blossom";
  const growth = isSpecial ? 4 : 2;
  state.pendingGrowth += growth;
  state.score += isSpecial ? 10 + state.combo * 2 : 4 + state.combo;
  state.combo += 1;
  state.comboTimer = comboWindow;

  if (state.combo >= 5) {
    state.achievements.flow = true;
  }
  if (state.harvests >= 25) {
    state.achievements.forager = true;
  }

  audioEngine.harvest(state.combo);
  if (isSpecial) {
    audioEngine.blossom();
  }
  if (state.combo % 5 === 0) {
    audioEngine.combo(Math.min(state.combo / 5, 6));
  }

  state.food = spawnFood();
  updateScoreDisplays();
  updateBadges();
}

function updateComboTimer() {
  if (state.combo <= 0) {
    pulseMeter.style.setProperty("--pulse", "5%");
    return;
  }
  state.comboTimer -= computeSpeed();
  if (state.comboTimer <= 0) {
    state.combo = 0;
    state.comboTimer = 0;
  }
  const ratio = Math.max(0, Math.min(1, state.comboTimer / comboWindow));
  pulseMeter.style.setProperty("--pulse", `${Math.max(8, ratio * 100)}%`);
  comboValue.textContent = state.combo.toString();
}

function validateDirection(current, next) {
  if (current.x + next.x === 0 && current.y + next.y === 0) {
    return current;
  }
  return next;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawFood();
  drawSnake();
  tempoValue.textContent = `${(120 / computeSpeed()).toFixed(2)}×`;
}

function drawBoard() {
  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#1d2b15");
  background.addColorStop(1, "#0f140a");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(130, 170, 100, 0.12)";
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }
}

function drawSnake() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#d7f08f");
  gradient.addColorStop(0.5, "#b4e472");
  gradient.addColorStop(1, "#f9c56f");
  ctx.lineJoin = "round";

  state.snake.forEach((segment, index) => {
    const x = segment.x * cellSize;
    const y = segment.y * cellSize;
    ctx.fillStyle = index === 0 ? "#ffe9a3" : gradient;
    ctx.strokeStyle = "rgba(20, 32, 14, 0.6)";
    ctx.lineWidth = 2;
    drawRoundedRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
    ctx.fill();
    ctx.stroke();
  });
}

function drawFood() {
  if (!state.food) return;
  const { x, y, type } = state.food;
  const px = x * cellSize + cellSize / 2;
  const py = y * cellSize + cellSize / 2;

  ctx.save();
  ctx.translate(px, py);
  ctx.beginPath();
  if (type === "blossom") {
    ctx.fillStyle = "#ffcf6b";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffd27f";
    for (let i = 0; i < 6; i++) {
      ctx.rotate((Math.PI * 2) / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cellSize / 2.6, cellSize / 6);
      ctx.lineTo(0, cellSize / 2.1);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#c3ef7f";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#d7f08f";
    ctx.arc(0, 0, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2ffb0";
    ctx.beginPath();
    ctx.arc(-cellSize * 0.15, -cellSize * 0.1, cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function triggerGameOver(reason) {
  state.playing = false;
  audioEngine.finale();
  const reached = state.score;
  if (reached > state.best) {
    state.best = reached;
    localStorage.setItem(highScoreKey, reached.toString());
  }
  pulseMeter.style.setProperty("--pulse", "5%");
  updateScoreDisplays();
  updateBadges();
  const comboMention = state.combo >= 5 ? ` with a ${state.combo}× combo` : "";
  const harvestMention = state.harvests ? ` and ${state.harvests} harvests` : "";
  const achievementShout = gatherAchievementSummary();
  gameOverSummary.textContent = `You reached ${reached} points${comboMention}${harvestMention}. ${reason} ${achievementShout}`.trim();
  gameOverOverlay.classList.remove("hidden");
}

function gatherAchievementSummary() {
  const earned = Object.entries(state.achievements)
    .filter(([, value]) => value)
    .map(([key]) => {
      if (key === "flow") return "Flow State";
      if (key === "precision") return "Precision";
      if (key === "forager") return "Forager";
      return key;
    });
  if (!earned.length) {
    return "";
  }
  return `Trophies lit: ${earned.join(", ")}.`;
}

function updateBadges() {
  Object.entries(badges).forEach(([key, element]) => {
    const lit = state.achievements[key];
    element.textContent = lit ? "Lit" : "Unlit";
    element.classList.toggle("lit", lit);
  });
}

function setDirection(dirKey) {
  const next = directions[dirKey];
  if (!next) return;
  state.nextDirection = validateDirection(state.direction, next);
}

let touchStart = null;
canvas.addEventListener("touchstart", (event) => {
  if (!state.playing) return;
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? "ArrowRight" : "ArrowLeft");
  } else {
    setDirection(dy > 0 ? "ArrowDown" : "ArrowUp");
  }
  touchStart = null;
});

function pauseToggle() {
  if (!state.playing) return;
  state.paused = !state.paused;
}

function updateSpeed() {
  const level = Number(speedSlider.value);
  speedLabel.textContent = speedLabels[level];
  const base = { 1: 160, 2: 120, 3: 95 }[level];
  state.baseSpeed = base;
}

function updateSoundState() {
  const enabled = soundToggle.checked;
  audioEngine.setEnabled(enabled);
  const label = soundToggle.parentElement?.querySelector(".switch-label");
  if (label) {
    label.textContent = enabled ? "Sound on" : "Sound muted";
  }
}

function updateLoop() {
  requestAnimationFrame(tick);
}

function startGame() {
  audioEngine.unlock();
  resetState();
  updateLoop();
}

function shareHighlight() {
  const highlight = `I conducted ${state.score} points in Serpent Sonata with ${state.harvests} harvests and a ${state.combo}× combo!`;
  if (navigator.share) {
    navigator.share({ text: highlight }).catch(() => copyToClipboard(highlight));
  } else {
    copyToClipboard(highlight);
  }
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => {
    shareButton.textContent = "Copied!";
    setTimeout(() => {
      shareButton.textContent = "Copy Highlight";
    }, 1800);
  });
}

function handleKeydown(event) {
  if (event.key === " " || event.code === "Space") {
    pauseToggle();
    event.preventDefault();
    return;
  }
  if (!directions[event.key]) return;
  setDirection(event.key);
  event.preventDefault();
}

document.addEventListener("keydown", handleKeydown);
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", () => {
  startGame();
});
shareButton.addEventListener("click", shareHighlight);
speedSlider.addEventListener("input", updateSpeed);
soundToggle.addEventListener("change", updateSoundState);

showIntro();
updateSpeed();
updateSoundState();
updateScoreDisplays();
updateBadges();

draw();
