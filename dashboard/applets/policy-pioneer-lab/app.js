const rows = 6;
const cols = 6;
const actions = [
  { name: "up", dr: -1, dc: 0, symbol: "↑" },
  { name: "right", dr: 0, dc: 1, symbol: "→" },
  { name: "down", dr: 1, dc: 0, symbol: "↓" },
  { name: "left", dr: 0, dc: -1, symbol: "←" },
];

const gridElement = document.getElementById("grid");
const policyElement = document.getElementById("policyGrid");
const rewardSparkline = document.getElementById("rewardSparkline");
const missionLog = document.getElementById("missionLog");
const statusLine = document.getElementById("statusLine");

const learningRateInput = document.getElementById("learningRate");
const discountFactorInput = document.getElementById("discountFactor");
const explorationRateInput = document.getElementById("explorationRate");
const episodeLimitInput = document.getElementById("episodeLimit");

const learningRateDisplay = document.getElementById("learningRateDisplay");
const discountFactorDisplay = document.getElementById("discountFactorDisplay");
const explorationRateDisplay = document.getElementById("explorationRateDisplay");

const stepButton = document.getElementById("stepEpisode");
const burstButton = document.getElementById("trainBurst");
const resetButton = document.getElementById("resetLab");

const qTable = {};
let isRunning = false;
let episodeCounter = 0;
let recentRewards = [];
let agentPosition = null;

const environment = {
  start: { row: rows - 1, col: 0 },
  goal: { row: 0, col: cols - 1 },
  hazards: [
    { row: 1, col: 3 },
    { row: 3, col: 2 },
  ],
  bonus: { row: 2, col: 4 },
};

function stateKey({ row, col }) {
  return `${row},${col}`;
}

function ensureState(key) {
  if (!qTable[key]) {
    qTable[key] = new Array(actions.length).fill(0);
  }
  return qTable[key];
}

function clampToGrid(row, col) {
  return {
    row: Math.max(0, Math.min(rows - 1, row)),
    col: Math.max(0, Math.min(cols - 1, col)),
  };
}

function cellsMatch(a, b) {
  return a.row === b.row && a.col === b.col;
}

function cellOccupied(target, collection) {
  return collection.some((item) => cellsMatch(item, target));
}

function randomEmptyCell() {
  const taken = new Set();
  taken.add(stateKey(environment.start));
  taken.add(stateKey(environment.goal));
  environment.hazards.forEach((hz) => taken.add(stateKey(hz)));
  let candidate;
  do {
    candidate = {
      row: Math.floor(Math.random() * rows),
      col: Math.floor(Math.random() * cols),
    };
  } while (taken.has(stateKey(candidate)));
  return candidate;
}

function resetBonus() {
  environment.bonus = randomEmptyCell();
}

function updateDisplays() {
  learningRateDisplay.textContent = Number(learningRateInput.value).toFixed(2);
  discountFactorDisplay.textContent = Number(discountFactorInput.value).toFixed(2);
  explorationRateDisplay.textContent = Number(explorationRateInput.value).toFixed(2);
}

function buildGrid() {
  gridElement.innerHTML = "";
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      gridElement.appendChild(cell);
    }
  }
}

function buildPolicyGrid() {
  policyElement.innerHTML = "";
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement("div");
      cell.className = "policy-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      policyElement.appendChild(cell);
    }
  }
}

function updateGrid() {
  const cells = gridElement.querySelectorAll(".grid-cell");
  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cell.className = "grid-cell";
    const position = { row, col };

    if (cellsMatch(position, environment.start)) {
      cell.classList.add("is-start");
      cell.textContent = "S";
    } else if (cellsMatch(position, environment.goal)) {
      cell.classList.add("is-goal");
      cell.textContent = "★";
    } else if (cellOccupied(position, environment.hazards)) {
      cell.classList.add("is-hazard");
      cell.textContent = "⚠";
    } else if (cellsMatch(position, environment.bonus)) {
      cell.classList.add("is-bonus");
      cell.textContent = "◎";
    } else {
      cell.textContent = "";
    }

    if (agentPosition && cellsMatch(position, agentPosition)) {
      cell.classList.add("is-agent");
      cell.textContent = "◉";
    }
  });
}

function updatePolicyGrid() {
  const cells = policyElement.querySelectorAll(".policy-cell");
  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const position = { row, col };
    cell.className = "policy-cell";

    if (cellsMatch(position, environment.goal)) {
      cell.classList.add("is-terminal");
      cell.textContent = "★";
      return;
    }

    if (cellOccupied(position, environment.hazards)) {
      cell.classList.add("is-terminal");
      cell.textContent = "⚠";
      return;
    }

    if (cellsMatch(position, environment.start)) {
      cell.textContent = "S";
      return;
    }

    const key = stateKey(position);
    const qValues = ensureState(key);
    const maxQ = Math.max(...qValues);
    const bestIndices = qValues
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => value === maxQ)
      .map(({ index }) => index);
    const choice = bestIndices[Math.floor(Math.random() * bestIndices.length)] ?? 0;
    cell.textContent = actions[choice].symbol;
  });
}

function updateSparkline() {
  rewardSparkline.innerHTML = "";
  if (recentRewards.length === 0) {
    const placeholder = document.createElement("p");
    placeholder.className = "sparkline-note";
    placeholder.textContent = "No episodes yet."
    rewardSparkline.appendChild(placeholder);
    return;
  }

  const maxValue = Math.max(...recentRewards.map((entry) => entry.reward));
  const minValue = Math.min(...recentRewards.map((entry) => entry.reward));
  const span = maxValue - minValue || 1;

  recentRewards.forEach((entry) => {
    const bar = document.createElement("div");
    bar.className = "sparkline-bar";
    const normalized = (entry.reward - minValue) / span;
    bar.style.height = `${Math.max(12, normalized * 100)}%`;
    bar.title = `Episode ${entry.episode}: ${entry.reward.toFixed(2)}`;
    rewardSparkline.appendChild(bar);
  });
}

function logMission(message) {
  const entry = document.createElement("li");
  entry.innerHTML = message;
  missionLog.prepend(entry);
  const items = missionLog.querySelectorAll("li");
  if (items.length > 8) {
    missionLog.removeChild(items[items.length - 1]);
  }
}

function environmentStep(state, actionIndex) {
  const action = actions[actionIndex];
  const next = clampToGrid(state.row + action.dr, state.col + action.dc);
  let reward = -0.1;
  let done = false;
  let note = "";

  if (cellsMatch(next, environment.goal)) {
    reward = 10;
    done = true;
    note = "Goal reached";
  } else if (cellOccupied(next, environment.hazards)) {
    reward = -6;
    done = true;
    note = "Hazard triggered";
  } else if (cellsMatch(next, environment.bonus)) {
    reward = 3.5;
    note = "Bonus cache secured";
    resetBonus();
  }

  return { next, reward, done, note };
}

function randomizeHazards() {
  const newHazards = [];
  while (newHazards.length < environment.hazards.length) {
    const cell = randomEmptyCell();
    if (!cellOccupied(cell, newHazards)) {
      newHazards.push(cell);
    }
  }
  environment.hazards = newHazards;
}

function resetEpisodeState() {
  agentPosition = { ...environment.start };
  updateGrid();
}

async function runEpisode({ epsilon, alpha, gamma, animateDelay }) {
  resetEpisodeState();
  const maxSteps = Number(episodeLimitInput.value) || 60;
  let totalReward = 0;
  let step = 0;
  let steppedNote = "";

  while (step < maxSteps) {
    const key = stateKey(agentPosition);
    const qValues = ensureState(key);
    let actionIndex;

    if (Math.random() < epsilon) {
      actionIndex = Math.floor(Math.random() * actions.length);
    } else {
      const maxQ = Math.max(...qValues);
      const candidates = qValues
        .map((value, index) => ({ value, index }))
        .filter(({ value }) => value === maxQ)
        .map(({ index }) => index);
      actionIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
    }

    const { next, reward, done, note } = environmentStep(agentPosition, actionIndex);
    const nextKey = stateKey(next);
    const nextValues = ensureState(nextKey);
    const bestNext = Math.max(...nextValues);
    const tdTarget = reward + (done ? 0 : gamma * bestNext);
    const tdError = tdTarget - qValues[actionIndex];
    qValues[actionIndex] += alpha * tdError;

    agentPosition = next;
    totalReward += reward;
    step += 1;
    steppedNote = note;
    updateGrid();

    if (animateDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, animateDelay));
    }

    if (done) {
      break;
    }
  }

  return { totalReward, steps: step, note: steppedNote };
}

async function playEpisodes(count, animateDelay) {
  if (isRunning) return;
  isRunning = true;

  const epsilon = Number(explorationRateInput.value);
  const alpha = Number(learningRateInput.value);
  const gamma = Number(discountFactorInput.value);

  for (let i = 0; i < count; i += 1) {
    const result = await runEpisode({ epsilon, alpha, gamma, animateDelay });
    episodeCounter += 1;
    recentRewards.unshift({ episode: episodeCounter, reward: result.totalReward });
    if (recentRewards.length > 16) {
      recentRewards.pop();
    }

    const summary = `Episode <strong>#${episodeCounter}</strong> · Reward <strong>${result.totalReward.toFixed(
      2
    )}</strong>${result.note ? ` · ${result.note}` : ""}`;
    logMission(summary);
    statusLine.textContent = `Episode ${episodeCounter} complete. Total reward ${result.totalReward.toFixed(
      2
    )}.`;
    updateSparkline();
    updatePolicyGrid();

    const fieldNotes = [];
    if (episodeCounter % 5 === 0) {
      randomizeHazards();
      fieldNotes.push("hazards shifted");
    }
    if (episodeCounter % 3 === 0) {
      resetBonus();
      fieldNotes.push("bonus cache relocated");
    }

    if (fieldNotes.length > 0) {
      updateGrid();
      updatePolicyGrid();
      logMission(
        `Field recalibration: <strong>${fieldNotes.join(" & ")}</strong>. Reinforce the new signals.`
      );
    }
  }

  agentPosition = null;
  updateGrid();
  isRunning = false;
}

function resetLab() {
  Object.keys(qTable).forEach((key) => delete qTable[key]);
  episodeCounter = 0;
  recentRewards = [];
  agentPosition = null;
  environment.hazards = [
    { row: 1, col: 3 },
    { row: 3, col: 2 },
  ];
  resetBonus();
  missionLog.innerHTML = "";
  rewardSparkline.innerHTML = "";
  statusLine.textContent = "Lab reset. Adjust parameters and relaunch training.";
  updateGrid();
  updatePolicyGrid();
}

learningRateInput.addEventListener("input", updateDisplays);
discountFactorInput.addEventListener("input", updateDisplays);
explorationRateInput.addEventListener("input", updateDisplays);
episodeLimitInput.addEventListener("change", () => {
  const min = Number(episodeLimitInput.min) || 1;
  const max = Number(episodeLimitInput.max) || 200;
  const value = Math.max(min, Math.min(max, Number(episodeLimitInput.value) || min));
  episodeLimitInput.value = value;
});

stepButton.addEventListener("click", () => {
  playEpisodes(1, 260);
});

burstButton.addEventListener("click", () => {
  playEpisodes(10, 120);
});

resetButton.addEventListener("click", () => {
  if (isRunning) return;
  resetLab();
});

buildGrid();
buildPolicyGrid();
resetBonus();
updateGrid();
updatePolicyGrid();
updateDisplays();
updateSparkline();
statusLine.textContent = "Ready for launch. Adjust parameters and start training.";
