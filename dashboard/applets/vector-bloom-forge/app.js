const roundValue = document.getElementById("roundValue");
const timerValue = document.getElementById("timerValue");
const scoreValue = document.getElementById("scoreValue");
const startButton = document.getElementById("startButton");
const matchLabel = document.getElementById("matchLabel");
const stabilityLabel = document.getElementById("stabilityLabel");
const historyList = document.getElementById("historyList");

const forgeCanvas = document.getElementById("forgeCanvas");
const targetShape = document.getElementById("targetShape");
const playerShape = document.getElementById("playerShape");
const handleLayer = document.getElementById("handleLayer");

const ROUND_LENGTH = 45;
const PRECISION_THRESHOLD = 0.75;

const state = {
  round: 0,
  timer: 0,
  score: 0,
  streak: 0,
  active: false,
  timerId: null,
  pointCount: 6,
  targetPoints: [],
  playerPoints: [],
  handles: [],
};

startButton.addEventListener("click", () => {
  if (state.active) {
    return;
  }

  startRound();
});

function startRound() {
  state.round += 1;
  state.timer = ROUND_LENGTH;
  state.active = true;
  startButton.disabled = true;
  startButton.textContent = "Forging...";
  roundValue.textContent = state.round;
  stabilityLabel.textContent = `Stability streak: ${state.streak}`;
  generateNewLayout();
  updateTimer();

  if (state.timerId) {
    clearInterval(state.timerId);
  }

  state.timerId = setInterval(() => {
    state.timer -= 1;
    updateTimer();

    if (state.timer <= 0) {
      completeRound();
    }
  }, 1000);
}

function generateNewLayout() {
  state.pointCount = 6 + Math.floor(Math.random() * 3); // 6-8 petals
  state.targetPoints = createRadialShape(state.pointCount, {
    baseRadius: randomBetween(28, 34),
    variance: randomBetween(6, 12),
    wobble: randomBetween(3, 6),
  });
  state.playerPoints = createRadialShape(state.pointCount, {
    baseRadius: 26,
    variance: 2,
    wobble: 0,
  });
  renderTarget();
  renderPlayer();
  buildHandles();
  updateMatchIndicator();
}

function createRadialShape(pointCount, { baseRadius, variance, wobble }) {
  const points = [];
  for (let i = 0; i < pointCount; i += 1) {
    const angle = (Math.PI * 2 * i) / pointCount;
    const radius = baseRadius + Math.sin(angle * 3) * wobble + randomBetween(-variance, variance);
    const constrainedRadius = Math.max(14, Math.min(radius, 46));
    const x = 50 + Math.cos(angle) * constrainedRadius;
    const y = 50 + Math.sin(angle) * constrainedRadius;
    points.push({ x: clamp(x, 6, 94), y: clamp(y, 6, 94) });
  }
  return points;
}

function buildHandles() {
  handleLayer.innerHTML = "";
  state.handles = state.playerPoints.map((point, index) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", 2.6);
    circle.classList.add("handle-node");
    circle.dataset.index = String(index);
    circle.addEventListener("pointerdown", handlePointerDown);
    handleLayer.appendChild(circle);
    return circle;
  });
}

let activeHandleIndex = null;
let activePointerId = null;

function handlePointerDown(event) {
  if (!state.active) {
    return;
  }
  const index = Number(event.currentTarget.dataset.index);
  activeHandleIndex = index;
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture(activePointerId);
  event.currentTarget.addEventListener("pointermove", handlePointerMove);
  event.currentTarget.addEventListener("pointerup", releasePointer);
  event.currentTarget.addEventListener("pointercancel", releasePointer);
}

function handlePointerMove(event) {
  if (activeHandleIndex === null) {
    return;
  }

  const svgRect = forgeCanvas.getBoundingClientRect();
  const x = ((event.clientX - svgRect.left) / svgRect.width) * 100;
  const y = ((event.clientY - svgRect.top) / svgRect.height) * 100;
  updatePlayerPoint(activeHandleIndex, clamp(x, 6, 94), clamp(y, 6, 94));
}

function releasePointer(event) {
  if (activePointerId !== null) {
    try {
      event.currentTarget.releasePointerCapture(activePointerId);
    } catch (error) {
      // no-op if capture already released
    }
  }
  event.currentTarget.removeEventListener("pointermove", handlePointerMove);
  event.currentTarget.removeEventListener("pointerup", releasePointer);
  event.currentTarget.removeEventListener("pointercancel", releasePointer);
  activeHandleIndex = null;
  activePointerId = null;
}

function updatePlayerPoint(index, x, y) {
  state.playerPoints[index] = { x, y };
  renderPlayer();
  updateHandlePositions();
  updateMatchIndicator();
}

function renderTarget() {
  targetShape.setAttribute("points", toPointString(state.targetPoints));
}

function renderPlayer() {
  playerShape.setAttribute("points", toPointString(state.playerPoints));
}

function updateHandlePositions() {
  state.handles.forEach((handle, index) => {
    const point = state.playerPoints[index];
    handle.setAttribute("cx", point.x);
    handle.setAttribute("cy", point.y);
  });
}

function updateTimer() {
  timerValue.textContent = `${state.timer}s`;
}

function updateMatchIndicator() {
  const match = calculateMatch(state.playerPoints, state.targetPoints);
  const percent = Math.round(match * 100);
  matchLabel.textContent = `Match: ${percent}%`;
}

function calculateMatch(playerPoints, targetPoints) {
  if (!playerPoints.length || playerPoints.length !== targetPoints.length) {
    return 0;
  }
  let totalDistance = 0;
  for (let i = 0; i < playerPoints.length; i += 1) {
    const player = playerPoints[i];
    const target = targetPoints[i];
    const dx = player.x - target.x;
    const dy = player.y - target.y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }
  const average = totalDistance / playerPoints.length;
  const normalized = Math.max(0, 1 - average / 32);
  return Math.min(1, normalized);
}

function completeRound() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.active = false;
  startButton.disabled = false;
  startButton.textContent = "Start Bloom";

  const match = calculateMatch(state.playerPoints, state.targetPoints);
  const percent = Math.round(match * 100);
  const bonus = percent >= 90 ? 10 : percent >= 80 ? 5 : 0;
  state.score += percent + bonus;
  if (percent >= PRECISION_THRESHOLD * 100) {
    state.streak += 1;
  } else {
    state.streak = 0;
  }
  scoreValue.textContent = state.score;
  stabilityLabel.textContent = `Stability streak: ${state.streak}`;
  matchLabel.textContent = `Match: ${percent}%`;
  updateTimer();
  addHistoryEntry(percent, bonus);
}

function addHistoryEntry(percent, bonus) {
  const item = document.createElement("li");
  const lineOne = document.createElement("strong");
  lineOne.textContent = `Round ${state.round}: ${percent}% match`;
  item.appendChild(lineOne);

  const summary = document.createElement("span");
  if (bonus > 0) {
    summary.textContent = `Precision bonus +${bonus}, forge score total ${state.score}.`;
  } else {
    summary.textContent = `Forge score total ${state.score}.`;
  }
  item.appendChild(summary);

  if (state.streak > 1) {
    const streakLine = document.createElement("span");
    streakLine.textContent = `Stability streak at ${state.streak}.`;
    item.appendChild(streakLine);
  }

  historyList.prepend(item);
  historyList.start = state.round;
}

function toPointString(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Kick off with a preview layout
state.targetPoints = createRadialShape(state.pointCount, {
  baseRadius: 32,
  variance: 6,
  wobble: 4,
});
state.playerPoints = createRadialShape(state.pointCount, {
  baseRadius: 24,
  variance: 2,
  wobble: 0,
});
renderTarget();
renderPlayer();
buildHandles();
updateTimer();
updateMatchIndicator();
stabilityLabel.textContent = "Stability streak: 0";
roundValue.textContent = state.round;
scoreValue.textContent = state.score;
