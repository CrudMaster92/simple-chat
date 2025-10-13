const difficulties = {
  intro: { size: 8, mines: 10 },
  analyst: { size: 12, mines: 22 },
  architect: { size: 16, mines: 40 },
};

const state = {
  size: difficulties.analyst.size,
  mines: difficulties.analyst.mines,
  board: [],
  revealed: 0,
  flags: 0,
  status: "idle",
  autoHeatmap: true,
  assistFlags: true,
  heatmapVisible: false,
  streak: 0,
  momentum: 1,
  startTime: null,
  timerInterval: null,
  hintCell: null,
};

const boardEl = document.getElementById("board");
const boardStatusEl = document.getElementById("boardStatus");
const timerEl = document.getElementById("timer");
const clearedEl = document.getElementById("cleared");
const flagsEl = document.getElementById("flags");
const momentumEl = document.getElementById("momentum");
const insightMessageEl = document.getElementById("insightMessage");
const insightListEl = document.getElementById("insightList");
const heatmapToggle = document.getElementById("heatmapToggle");
const pulseHintBtn = document.getElementById("pulseHint");
const configForm = document.getElementById("configForm");
const difficultySelect = document.getElementById("difficulty");
const densitySlider = document.getElementById("density");
const densityOutput = document.getElementById("densityValue");
const autoHeatmapToggle = document.getElementById("autoHeatmap");
const flagAssistToggle = document.getElementById("mistFlagAssist");

function init() {
  setupDifficultyControls();
  primeDifficultyDefaults();
  densitySlider.addEventListener("input", handleDensityChange);
  autoHeatmapToggle.addEventListener("change", () => {
    state.autoHeatmap = autoHeatmapToggle.checked;
    logInsight(
      state.autoHeatmap
        ? "Auto-heatmap enabled. Reveals will pulse risk overlays."
        : "Auto-heatmap paused. Use the toggle to flash overlays manually."
    );
  });

  flagAssistToggle.addEventListener("change", () => {
    state.assistFlags = flagAssistToggle.checked;
    logInsight(
      state.assistFlags
        ? "Flag assist online. Deduced sparks will be marked automatically."
        : "Flag assist off. Manual flag calls only."
    );
    if (state.status === "active") {
      evaluateHiddenRisk();
      refreshBoardView();
    }
  });

  configForm.addEventListener("submit", (event) => {
    event.preventDefault();
    beginMission();
  });

  heatmapToggle.addEventListener("click", () => {
    state.heatmapVisible = !state.heatmapVisible;
    heatmapToggle.textContent = state.heatmapVisible ? "Hide Heatmap" : "Show Heatmap";
    refreshBoardView();
  });

  pulseHintBtn.addEventListener("click", handlePulseHint);
}

function setupDifficultyControls() {
  difficultySelect.addEventListener("change", () => {
    const settings = difficulties[difficultySelect.value];
    if (!settings) return;
    state.size = settings.size;
    const maxMines = settings.size * settings.size - 1;
    densitySlider.max = maxMines;
    const baseline = settings.mines;
    densitySlider.value = baseline;
    densityOutput.textContent = baseline;
    logInsight(
      `Difficulty tuned to ${difficultySelect.options[difficultySelect.selectedIndex].text}.`
    );
  });
}

function primeDifficultyDefaults() {
  const settings = difficulties[difficultySelect.value] ?? difficulties.analyst;
  densitySlider.max = settings.size * settings.size - 1;
  densitySlider.value = settings.mines;
  densityOutput.textContent = settings.mines;
  state.size = settings.size;
  state.mines = settings.mines;
}

function handleDensityChange() {
  densityOutput.textContent = densitySlider.value;
}

function beginMission() {
  const settings = difficulties[difficultySelect.value] ?? difficulties.analyst;
  const requestedMines = Number.parseInt(densitySlider.value, 10);
  const maxMines = settings.size * settings.size - 1;
  state.size = settings.size;
  state.mines = Math.min(Math.max(1, requestedMines), maxMines);
  state.autoHeatmap = autoHeatmapToggle.checked;
  state.assistFlags = flagAssistToggle.checked;
  state.heatmapVisible = false;
  heatmapToggle.textContent = "Show Heatmap";
  heatmapToggle.disabled = false;
  pulseHintBtn.disabled = false;

  resetMissionState();
  generateBoard();
  updateTelemetry();
  setBoardStatus("Scan active. Reveal tiles to stabilize the circuit.");
  logInsight(
    `Scan deployed: ${state.size}×${state.size} grid with ${state.mines} unstable sparks.`
  );
}

function resetMissionState() {
  stopTimer();
  state.board = [];
  state.revealed = 0;
  state.flags = 0;
  state.status = "active";
  state.streak = 0;
  state.momentum = 1;
  state.startTime = Date.now();
  state.hintCell = null;
  startTimer();
  insightListEl.innerHTML = "";
  state.heatmapVisible = false;
}

function generateBoard() {
  const { size, mines } = state;
  const total = size * size;
  const cells = Array.from({ length: total }, (_, index) => ({
    index,
    row: Math.floor(index / size),
    col: index % size,
    isMine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
    element: null,
    risk: null,
  }));

  // place mines
  const minePositions = shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, mines);
  minePositions.forEach((pos) => {
    cells[pos].isMine = true;
  });

  // compute adjacency
  cells.forEach((cell) => {
    if (cell.isMine) return;
    cell.adjacent = getNeighbors(cell, cells).filter((neighbor) => neighbor.isMine).length;
  });

  state.board = cells;
  renderBoard();
}

function renderBoard() {
  const { size } = state;
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  const fragment = document.createDocumentFragment();
  state.board.forEach((cell) => {
    const div = document.createElement("button");
    div.type = "button";
    div.className = "cell";
    div.setAttribute("role", "gridcell");
    div.setAttribute("aria-label", "Hidden tile");
    div.dataset.index = cell.index;
    div.addEventListener("click", () => handleReveal(cell.index));
    div.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      handleFlag(cell.index);
    });
    cell.element = div;
    fragment.appendChild(div);
  });

  boardEl.appendChild(fragment);
}

function handleReveal(index) {
  if (state.status !== "active") return;
  const cell = state.board[index];
  if (!cell || cell.revealed || cell.flagged) return;

  if (state.revealed === 0 && cell.isMine) {
    relocateMine(cell);
  }

  revealCell(cell);
  let refreshNeeded = false;
  if (state.autoHeatmap) {
    refreshNeeded = evaluateHiddenRisk();
  }
  refreshBoardView();
  const postCheck = checkForCompletion();
  if (refreshNeeded || postCheck) {
    refreshBoardView();
  }
}

function revealCell(cell) {
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  state.revealed += 1;
  clearHint();

  if (cell.isMine) {
    triggerExplosion(cell);
    return;
  }

  state.streak += 1;
  if (state.streak % 4 === 0) {
    state.momentum = Math.min(3, Number((state.momentum + 0.25).toFixed(2)));
    logInsight(`Momentum spiked to ${state.momentum.toFixed(2)}× after ${state.streak} safe reveals!`);
  }

  if (cell.adjacent === 0) {
    getNeighbors(cell, state.board).forEach((neighbor) => {
      if (!neighbor.revealed && !neighbor.flagged) {
        revealCell(neighbor);
      }
    });
  }
}

function triggerExplosion(cell) {
  state.status = "lost";
  state.streak = 0;
  state.momentum = 1;
  stopTimer();
  getAllMines().forEach((mine) => {
    mine.revealed = true;
  });
  cell.revealed = true;
  setBoardStatus("Circuit overload! Sparks detonated.");
  logInsight("Overload detected. Analyze the heatmap to refine your next sweep.");
  pulseHintBtn.disabled = true;
  heatmapToggle.disabled = true;
  refreshBoardView();
  updateTelemetry();
}

function handleFlag(index) {
  if (state.status !== "active") return;
  const cell = state.board[index];
  if (!cell || cell.revealed) return;
  cell.flagged = !cell.flagged;
  state.flags += cell.flagged ? 1 : -1;
  clearHint();
  const refreshNeeded = evaluateHiddenRisk();
  refreshBoardView();
  if (refreshNeeded) {
    refreshBoardView();
  }
  updateTelemetry();
}

function relocateMine(cell) {
  const safeCell = state.board.find((candidate) => !candidate.isMine && candidate !== cell);
  if (!safeCell) return;
  safeCell.isMine = true;
  cell.isMine = false;
  recalculateAdjacency();
}

function recalculateAdjacency() {
  state.board.forEach((cell) => {
    if (cell.isMine) {
      cell.adjacent = 0;
      return;
    }
    cell.adjacent = getNeighbors(cell, state.board).filter((neighbor) => neighbor.isMine).length;
  });
}

function triggerVictory() {
  state.status = "won";
  stopTimer();
  setBoardStatus("Circuit stabilized! Every spark neutralized.");
  logInsight(`Mission success in ${timerEl.textContent} with ${state.flags} flags deployed.`);
  pulseHintBtn.disabled = true;
  heatmapToggle.disabled = true;
  refreshBoardView();
}

function checkForCompletion() {
  const { size, mines, revealed } = state;
  const safeTiles = size * size - mines;
  if (revealed >= safeTiles) {
    triggerVictory();
    updateTelemetry();
    return true;
  }
  updateTelemetry();
  return evaluateHiddenRisk();
}

function getNeighbors(cell, board = state.board) {
  const { size } = state;
  const neighbors = [];
  for (let r = -1; r <= 1; r += 1) {
    for (let c = -1; c <= 1; c += 1) {
      if (r === 0 && c === 0) continue;
      const row = cell.row + r;
      const col = cell.col + c;
      if (row < 0 || col < 0 || row >= size || col >= size) continue;
      neighbors.push(board[row * size + col]);
    }
  }
  return neighbors;
}

function evaluateHiddenRisk() {
  if (state.status !== "active") return false;
  let updated = false;
  state.board.forEach((cell) => {
    cell.risk = null;
  });

  state.board.forEach((cell) => {
    if (!cell.revealed || cell.isMine || cell.adjacent === 0) return;
    const neighbors = getNeighbors(cell).filter((neighbor) => !neighbor.revealed);
    if (neighbors.length === 0) return;
    const flagged = neighbors.filter((neighbor) => neighbor.flagged).length;
    const unknown = cell.adjacent - flagged;
    const candidates = neighbors.filter((neighbor) => !neighbor.flagged);
    if (unknown <= 0 || candidates.length === 0) return;

    const probability = clamp(unknown / candidates.length, 0, 1);
    candidates.forEach((neighbor) => {
      const newRisk = Math.max(neighbor.risk ?? 0, probability);
      if (neighbor.risk !== newRisk) {
        neighbor.risk = newRisk;
        updated = true;
      }
      if (state.assistFlags && probability === 1) {
        if (!neighbor.flagged) {
          neighbor.flagged = true;
          state.flags += 1;
          logInsight(
            `Flag assist tagged (${neighbor.row + 1},${neighbor.col + 1}) as a confirmed spark.`
          );
          updated = true;
        }
      }
    });
  });

  updateTelemetry();
  return updated;
}

function refreshBoardView() {
  const showRiskOverlay = state.autoHeatmap || state.heatmapVisible;
  state.board.forEach((cell) => {
    const el = cell.element;
    el.className = "cell";
    el.innerHTML = "";
    el.removeAttribute("data-risk");
    el.classList.toggle("heatmap", state.heatmapVisible && cell.revealed);

    if (cell === state.hintCell) {
      el.classList.add("hint");
    }

    if (cell.flagged) {
      el.classList.add("flagged");
      el.setAttribute("aria-label", "Flagged spark");
      return;
    }

    if (cell.revealed) {
      el.classList.add("revealed");
      if (cell.isMine) {
        el.classList.add("exploded");
        el.innerHTML = "<span>✶</span>";
      } else if (cell.adjacent > 0) {
        el.classList.add(`number-${cell.adjacent}`);
        el.innerHTML = `<span>${cell.adjacent}</span>`;
      }
      el.setAttribute("aria-label", cell.isMine ? "Mine" : `Revealed ${cell.adjacent}`);
    } else {
      el.setAttribute("aria-label", "Hidden tile");
      if (showRiskOverlay && typeof cell.risk === "number") {
        const riskLevel = cell.risk <= 0.25 ? "low" : cell.risk <= 0.6 ? "medium" : "high";
        el.dataset.risk = riskLevel;
      }
    }
  });
}

function handlePulseHint() {
  if (state.status !== "active") return;
  const candidates = state.board.filter((cell) => !cell.revealed && !cell.flagged && !cell.isMine);
  if (candidates.length === 0) return;

  candidates.sort((a, b) => {
    const riskA = typeof a.risk === "number" ? a.risk : 0.5;
    const riskB = typeof b.risk === "number" ? b.risk : 0.5;
    return riskA - riskB;
  });

  const safeBand = candidates.filter((cell) => (cell.risk ?? 0.5) <= 0.4);
  const target = safeBand.length ? safeBand[0] : candidates[0];
  state.hintCell = target;
  logInsight(
    `Pulse hint: Tile (${target.row + 1},${target.col + 1}) registers the lowest risk signature.`
  );
  refreshBoardView();
}

function clearHint() {
  state.hintCell = null;
}

function getAllMines() {
  return state.board.filter((cell) => cell.isMine);
}

function setBoardStatus(message) {
  boardStatusEl.textContent = message;
}

function updateTelemetry() {
  timerEl.textContent = formatElapsed();
  clearedEl.textContent = state.revealed;
  flagsEl.textContent = state.flags;
  momentumEl.textContent = `${state.momentum.toFixed(2)}×`;
}

function logInsight(message) {
  insightMessageEl.textContent = message;
  const li = document.createElement("li");
  li.textContent = message;
  insightListEl.prepend(li);
  while (insightListEl.children.length > 6) {
    insightListEl.removeChild(insightListEl.lastElementChild);
  }
}

function startTimer() {
  stopTimer();
  state.timerInterval = window.setInterval(updateTelemetry, 500);
}

function stopTimer() {
  if (state.timerInterval) {
    window.clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function formatElapsed() {
  if (!state.startTime) return "00:00";
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

init();
