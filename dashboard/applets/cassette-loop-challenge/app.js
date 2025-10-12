const needle = document.getElementById("needle");
const targetOverlay = document.getElementById("targetOverlay");
const statusLine = document.getElementById("statusLine");
const scoreValue = document.getElementById("scoreValue");
const bufferValue = document.getElementById("bufferValue");
const speedValue = document.getElementById("speedValue");
const logList = document.getElementById("logList");
const startButton = document.getElementById("startButton");
const spliceButton = document.getElementById("spliceButton");
const resetButton = document.getElementById("resetButton");

const baseSpeed = 0.32; // rotations per second at 1.0x
const maxSpeed = 1.2;

let animationFrame = null;
let lastTimestamp = 0;
let isPlaying = false;
let hasSession = false;
let progress = Math.random();
let currentSpeed = baseSpeed;
let level = 1;
let buffer = 3;
let score = 0;
let targetWindow = null;

function formatScore(value) {
  return value.toString().padStart(4, "0");
}

function updateNeedle() {
  const angle = progress * 360;
  needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
}

function updateSpeedDisplay() {
  const multiplier = currentSpeed / baseSpeed;
  speedValue.textContent = `${multiplier.toFixed(1)}x`;
}

function updateTargetOverlay() {
  if (!targetWindow) {
    targetOverlay.style.background = "transparent";
    return;
  }

  const startDeg = targetWindow.start * 360;
  const spanDeg = targetWindow.size * 360;
  const glow = "rgba(255, 143, 0, 0.55)";
  const halo = "rgba(255, 79, 159, 0.32)";

  if (targetWindow.start + targetWindow.size <= 1) {
    const endDeg = startDeg + spanDeg;
    targetOverlay.style.background = `conic-gradient(from -90deg, ${halo} 0deg ${startDeg}deg, ${glow} ${startDeg}deg ${endDeg}deg, ${halo} ${endDeg}deg 360deg)`;
  } else {
    const overflowDeg = (targetWindow.start + targetWindow.size - 1) * 360;
    targetOverlay.style.background = `conic-gradient(from -90deg, ${glow} 0deg ${overflowDeg}deg, ${halo} ${overflowDeg}deg ${startDeg}deg, ${glow} ${startDeg}deg 360deg)`;
  }
}

function addLogEntry(type, heading, detail) {
  const item = document.createElement("li");
  if (type) {
    item.classList.add(type);
  }
  const title = document.createElement("strong");
  title.textContent = heading;
  const span = document.createElement("span");
  span.textContent = detail;
  item.append(title, span);
  logList.prepend(item);

  const maxEntries = 12;
  while (logList.children.length > maxEntries) {
    logList.removeChild(logList.lastElementChild);
  }
}

function resetSessionState() {
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
  lastTimestamp = 0;
  isPlaying = false;
  hasSession = false;
  progress = Math.random();
  currentSpeed = baseSpeed;
  level = 1;
  buffer = 3;
  score = 0;
  targetWindow = null;
  updateNeedle();
  updateTargetOverlay();
  updateSpeedDisplay();
  scoreValue.textContent = formatScore(score);
  bufferValue.textContent = buffer;
  statusLine.textContent = "Press Start Playback to begin.";
  spliceButton.disabled = true;
  resetButton.disabled = true;
  startButton.disabled = false;
  startButton.textContent = "Start Playback";
  logList.innerHTML = "";
}

function generateTargetWindow() {
  const minSize = Math.max(0.07, 0.22 - level * 0.015);
  const maxSize = Math.max(minSize + 0.02, 0.3 - level * 0.01);
  const size = minSize + Math.random() * (maxSize - minSize);
  const start = Math.random();
  targetWindow = { start, size };
  updateTargetOverlay();
}

function startAnimation() {
  cancelAnimationFrame(animationFrame);
  lastTimestamp = 0;
  animationFrame = requestAnimationFrame(step);
}

function step(timestamp) {
  if (!isPlaying) {
    return;
  }
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  progress = (progress + delta * currentSpeed) % 1;
  updateNeedle();
  animationFrame = requestAnimationFrame(step);
}

function startPlayback() {
  if (isPlaying) {
    return;
  }
  if (!hasSession) {
    score = 0;
    buffer = 3;
    level = 1;
    currentSpeed = baseSpeed;
    progress = Math.random();
    scoreValue.textContent = formatScore(score);
    bufferValue.textContent = buffer;
    updateSpeedDisplay();
    generateTargetWindow();
    logList.innerHTML = "";
    addLogEntry("warning", "New tape queued", "Find the highlight glow and splice on beat.");
  }
  hasSession = true;
  isPlaying = true;
  startButton.disabled = true;
  startButton.textContent = "Playback Live";
  spliceButton.disabled = false;
  resetButton.disabled = false;
  statusLine.textContent = "Tape humming. Watch the glow and splice the loop!";
  startAnimation();
}

function wrapDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1 - diff);
}

function handleSplice() {
  if (!isPlaying || !targetWindow) {
    return;
  }
  const center = (targetWindow.start + targetWindow.size / 2) % 1;
  const distance = wrapDistance(progress, center);
  const tolerance = targetWindow.size / 2;
  const accuracy = Math.max(0, 1 - distance / tolerance);

  if (distance <= tolerance) {
    const bonus = Math.round((140 + level * 15) * (0.6 + 0.4 * accuracy));
    score += bonus;
    scoreValue.textContent = formatScore(score);
    const rating = accuracy > 0.9 ? "Perfect splice!" : accuracy > 0.6 ? "Clean splice" : "Loose but true";
    statusLine.textContent = `${rating} +${bonus} pts`;
    addLogEntry("success", rating, `+${bonus} pts · accuracy ${(accuracy * 100).toFixed(0)}%`);

    level += 1;
    currentSpeed = Math.min(maxSpeed, currentSpeed + 0.05 + level * 0.004);
    updateSpeedDisplay();
    generateTargetWindow();
  } else {
    buffer -= 1;
    bufferValue.textContent = buffer;
    statusLine.textContent = buffer > 0 ? "Off-beat splice! Tape wobble rising." : "The tape tangled. Session over.";
    addLogEntry(
      buffer > 0 ? "warning" : "danger",
      buffer > 0 ? "Misaligned splice" : "Tape tangle",
      `Missed by ${Math.round((distance / tolerance) * 100)}% of the window`
    );

    if (buffer <= 0) {
      endSession();
      return;
    }

    currentSpeed = Math.max(baseSpeed * 0.85, currentSpeed - 0.08);
    updateSpeedDisplay();
    generateTargetWindow();
  }
}

function endSession() {
  isPlaying = false;
  hasSession = false;
  startButton.disabled = false;
  startButton.textContent = "Restart Playback";
  spliceButton.disabled = true;
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
  targetWindow = null;
  updateTargetOverlay();
  statusLine.textContent = "Tape tangled. Reset or start a fresh playback.";
}

function resetTape() {
  resetSessionState();
}

startButton.addEventListener("click", startPlayback);
spliceButton.addEventListener("click", handleSplice);
resetButton.addEventListener("click", resetTape);

resetSessionState();
