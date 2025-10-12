const difficulties = {
  sprout: {
    label: "Sprout Stratum",
    rows: 8,
    cols: 8,
    mines: 10,
    pulses: 2,
  },
  bloom: {
    label: "Bloom Stratum",
    rows: 10,
    cols: 12,
    mines: 20,
    pulses: 3,
  },
  radiant: {
    label: "Radiant Stratum",
    rows: 12,
    cols: 14,
    mines: 32,
    pulses: 4,
  },
};

const state = {
  cells: [],
  rows: 0,
  cols: 0,
  mines: 0,
  totalSafe: 0,
  revealedSafe: 0,
  flagged: 0,
  pulsesLeft: 0,
  pulseMode: false,
  pulsePreview: [],
  status: "ready", // ready | playing | won | lost
  difficultyKey: "sprout",
};

const boardEl = document.getElementById("board");
const difficultySelect = document.getElementById("difficultySelect");
const stableCountEl = document.getElementById("stableCount");
const pulseCountEl = document.getElementById("pulseCount");
const flagCountEl = document.getElementById("flagCount");
const pulseButton = document.getElementById("pulseButton");
const resetButton = document.getElementById("resetButton");
const logList = document.getElementById("logList");
const statusBanner = document.getElementById("statusBanner");
const boardStatus = document.getElementById("boardStatus");

function init() {
  difficultySelect.addEventListener("change", () => {
    state.difficultyKey = difficultySelect.value;
    startGame();
  });

  pulseButton.addEventListener("click", () => {
    if (state.status !== "playing") {
      return;
    }

    if (state.pulseMode) {
      state.pulseMode = false;
      updatePulseButton();
      clearPulsePreview();
      addLogEntry("Pulse sweep cancelled. Charge conserved.");
      return;
    }

    if (state.pulsesLeft <= 0) {
      return;
    }

    state.pulseMode = true;
    updatePulseButton();
    addLogEntry("Pulse sweep armed. Select a plot to reveal its cross-shaped echo.");
  });

  resetButton.addEventListener("click", () => startGame());

  startGame();
}

function startGame() {
  const diff = difficulties[state.difficultyKey];
  if (!diff) {
    throw new Error(`Unknown difficulty: ${state.difficultyKey}`);
  }

  state.rows = diff.rows;
  state.cols = diff.cols;
  state.mines = diff.mines;
  state.totalSafe = diff.rows * diff.cols - diff.mines;
  state.revealedSafe = 0;
  state.flagged = 0;
  state.pulsesLeft = diff.pulses;
  state.pulseMode = false;
  state.status = "playing";
  state.pulsePreview = [];

  buildBoard();
  renderBoard();
  updateStats();
  updatePulseButton();
  statusBanner.textContent = "";
  statusBanner.classList.remove("is-visible");
  boardStatus.textContent = `${diff.label} initialized — ${diff.mines} fissures hidden.`;

  logList.innerHTML = "";
  addLogEntry(
    `${diff.label} survey online. ${diff.mines} void fissures detected beneath ${diff.rows}×${diff.cols} plots.`
  );
}

function buildBoard() {
  const total = state.rows * state.cols;
  state.cells = Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / state.cols);
    const col = index % state.cols;
    return {
      id: `${row}-${col}`,
      row,
      col,
      mine: false,
      adjacent: 0,
      revealed: false,
      flagged: false,
      element: null,
    };
  });

  let planted = 0;
  while (planted < state.mines) {
    const index = Math.floor(Math.random() * total);
    const cell = state.cells[index];
    if (!cell.mine) {
      cell.mine = true;
      planted += 1;
    }
  }

  state.cells.forEach((cell) => {
    if (cell.mine) return;
    const neighbors = getNeighbors(cell.row, cell.col);
    cell.adjacent = neighbors.filter((neighbor) => neighbor.mine).length;
  });
}

function renderBoard() {
  boardEl.innerHTML = "";
  boardEl.style.setProperty("--rows", state.rows);
  boardEl.style.setProperty("--cols", state.cols);
  boardEl.setAttribute("aria-rowcount", String(state.rows));
  boardEl.setAttribute("aria-colcount", String(state.cols));

  const frag = document.createDocumentFragment();

  state.cells.forEach((cell) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.row = cell.row;
    button.dataset.col = cell.col;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `Hidden plot ${formatCoords(cell)}`);

    button.addEventListener("click", () => handleCellClick(cell));
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      toggleFlag(cell);
    });

    button.addEventListener("mouseenter", () => {
      if (state.pulseMode) {
        applyPulsePreview(cell);
      }
    });

    button.addEventListener("focus", () => {
      if (state.pulseMode) {
        applyPulsePreview(cell);
      }
    });

    button.addEventListener("mouseleave", () => {
      if (state.pulseMode) {
        clearPulsePreview();
      }
    });

    button.addEventListener("blur", () => {
      if (state.pulseMode) {
        clearPulsePreview();
      }
    });

    button.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" && event.button === 0) {
        // allow long-press flagging on touch
        const flagTimer = setTimeout(() => {
          toggleFlag(cell);
        }, 550);
        const cancel = () => clearTimeout(flagTimer);
        button.addEventListener("pointerup", cancel, { once: true });
        button.addEventListener("pointerleave", cancel, { once: true });
        button.addEventListener("pointercancel", cancel, { once: true });
      }
    });

    cell.element = button;
    updateCellRendering(cell);
    frag.appendChild(button);
  });

  boardEl.appendChild(frag);
}

function handleCellClick(cell) {
  if (state.status !== "playing") return;

  if (state.pulseMode) {
    usePulse(cell);
    return;
  }

  if (cell.revealed || cell.flagged) {
    return;
  }

  if (cell.mine) {
    revealMine(cell);
    finishGame("lost");
    return;
  }

  cascadeReveal(cell);
  updateStats();
  checkForVictory();
}

function toggleFlag(cell) {
  if (state.status !== "playing") return;
  if (cell.revealed) return;

  cell.flagged = !cell.flagged;
  state.flagged += cell.flagged ? 1 : -1;
  updateCellRendering(cell);
  updateStats();

  addLogEntry(
    cell.flagged
      ? `Beacon planted at ${formatCoords(cell)}. Possible fissure isolated.`
      : `Beacon withdrawn from ${formatCoords(cell)}.`
  );
}

function cascadeReveal(startCell) {
  const stack = [startCell];
  const newlyRevealed = [];

  while (stack.length) {
    const cell = stack.pop();
    if (cell.revealed || cell.flagged) continue;
    if (!revealSafeCell(cell)) continue;

    newlyRevealed.push(cell);

    if (cell.adjacent === 0) {
      const neighbors = getNeighbors(cell.row, cell.col);
      neighbors.forEach((neighbor) => {
        if (!neighbor.mine && !neighbor.revealed && !neighbor.flagged) {
          stack.push(neighbor);
        }
      });
    }
  }

  if (newlyRevealed.length) {
    const empties = newlyRevealed.filter((cell) => cell.adjacent === 0).length;
    const hints = newlyRevealed.filter((cell) => cell.adjacent > 0).length;
    const messageParts = [];
    if (empties) {
      messageParts.push(`${empties} clearings opened`);
    }
    if (hints) {
      messageParts.push(`${hints} luminous hints charted`);
    }
    addLogEntry(
      `Stabilized ${formatCoords(startCell)} — ${messageParts.join(", ") || "no activity detected"}.`
    );
  }
}

function revealSafeCell(cell) {
  if (cell.revealed) return false;
  cell.revealed = true;
  state.revealedSafe += 1;
  if (cell.flagged) {
    cell.flagged = false;
    state.flagged -= 1;
  }
  updateCellRendering(cell);
  return true;
}

function revealMine(triggeredCell) {
  state.cells.forEach((cell) => {
    if (cell.mine) {
      cell.revealed = true;
    }
    if (cell.flagged) {
      cell.flagged = false;
      state.flagged -= 1;
    }
    updateCellRendering(cell);
  });

  addLogEntry(`Void fissure erupted at ${formatCoords(triggeredCell)}. Garden destabilized.`);
  updateStats();
}

function finishGame(result) {
  if (result === "won") {
    state.status = "won";
    statusBanner.textContent = "Garden Stabilized! All fissures contained.";
    boardStatus.textContent = "Survey complete. The rift garden glows in balance.";
    addLogEntry("Survey complete. The garden hums with balanced light.");
  } else if (result === "lost") {
    state.status = "lost";
    statusBanner.textContent = "Containment Breach — Rift garden collapses.";
    boardStatus.textContent = "Reset the survey to attempt another stabilization.";
  }

  statusBanner.classList.add("is-visible");
  state.pulseMode = false;
  updatePulseButton();
  clearPulsePreview();
}

function checkForVictory() {
  if (state.revealedSafe === state.totalSafe && state.status === "playing") {
    finishGame("won");
  }
}

function updateCellRendering(cell) {
  if (!cell.element) return;
  const button = cell.element;
  button.className = "cell";
  button.disabled = cell.revealed && state.status !== "playing";
  button.innerHTML = "";

  if (state.pulseMode && state.pulsePreview.includes(cell)) {
    button.classList.add("cell--pulse");
  }

  if (cell.flagged) {
    button.classList.add("cell--flagged");
    button.innerHTML = '<span aria-hidden="true">⚑</span>';
    button.setAttribute("aria-label", `Flagged fissure at ${formatCoords(cell)}`);
    return;
  }

  if (!cell.revealed) {
    button.setAttribute("aria-label", `Hidden plot ${formatCoords(cell)}`);
    return;
  }

  button.classList.add("cell--revealed");

  if (cell.mine) {
    button.classList.add("cell--mine");
    button.innerHTML = '<span aria-hidden="true">✴</span>';
    button.setAttribute("aria-label", `Triggered fissure at ${formatCoords(cell)}`);
    return;
  }

  if (cell.adjacent === 0) {
    button.classList.add("cell--empty");
    button.setAttribute("aria-label", `Cleared plot ${formatCoords(cell)} — no nearby fissures.`);
    return;
  }

  const hint = document.createElement("span");
  hint.className = `cell__hint cell__hint--${cell.adjacent}`;
  hint.textContent = cell.adjacent;
  button.appendChild(hint);
  button.setAttribute(
    "aria-label",
    `Cleared plot ${formatCoords(cell)} — ${cell.adjacent} fissure${cell.adjacent === 1 ? "" : "s"} nearby.`
  );
}

function updateStats() {
  stableCountEl.textContent = `${state.revealedSafe} / ${state.totalSafe}`;
  pulseCountEl.textContent = String(state.pulsesLeft);
  flagCountEl.textContent = String(state.flagged);
}

function updatePulseButton() {
  const { pulsesLeft, pulseMode, status } = state;
  if (status !== "playing") {
    pulseButton.disabled = true;
    pulseButton.textContent = "Pulse Sweep Unavailable";
    pulseButton.classList.add("btn--pulse");
    return;
  }

  pulseButton.disabled = pulsesLeft <= 0 && !pulseMode;
  if (pulseMode) {
    pulseButton.textContent = "Pulse Armed — select a plot";
  } else if (pulsesLeft > 0) {
    pulseButton.textContent = `Prime Pulse Sweep (${pulsesLeft} left)`;
  } else {
    pulseButton.textContent = "No Pulses Remaining";
  }
}

function usePulse(targetCell) {
  if (state.pulsesLeft <= 0) {
    state.pulseMode = false;
    updatePulseButton();
    clearPulsePreview();
    return;
  }

  state.pulseMode = false;
  state.pulsesLeft -= 1;
  const pulseTargets = getPulseCells(targetCell);
  clearPulsePreview();

  let revealedCount = 0;
  pulseTargets.forEach((cell) => {
    if (cell.mine || cell.flagged) {
      return;
    }

    if (cell.adjacent === 0) {
      const before = state.revealedSafe;
      cascadeReveal(cell);
      if (state.revealedSafe > before) {
        revealedCount += state.revealedSafe - before;
      }
    } else if (revealSafeCell(cell)) {
      revealedCount += 1;
    }
  });

  updateStats();
  updatePulseButton();
  checkForVictory();

  addLogEntry(
    `Pulse sweep across ${formatCoords(targetCell)} stabilized ${revealedCount} plot${
      revealedCount === 1 ? "" : "s"
    }.`
  );
}

function applyPulsePreview(centerCell) {
  clearPulsePreview();
  const cells = getPulseCells(centerCell);
  state.pulsePreview = cells;
  cells.forEach((cell) => {
    if (cell.element) {
      cell.element.classList.add("cell--pulse");
    }
  });
}

function clearPulsePreview() {
  if (!state.pulsePreview.length) return;
  state.pulsePreview.forEach((cell) => {
    if (cell.element) {
      cell.element.classList.remove("cell--pulse");
    }
  });
  state.pulsePreview = [];
}

function getPulseCells(centerCell) {
  const deltas = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return deltas
    .map(([dr, dc]) => getCell(centerCell.row + dr, centerCell.col + dc))
    .filter(Boolean);
}

function getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const cell = getCell(row + dr, col + dc);
      if (cell) {
        neighbors.push(cell);
      }
    }
  }
  return neighbors;
}

function getCell(row, col) {
  if (row < 0 || col < 0 || row >= state.rows || col >= state.cols) {
    return null;
  }
  return state.cells[row * state.cols + col];
}

function formatCoords(cell) {
  return `r${cell.row + 1}c${cell.col + 1}`;
}

function addLogEntry(message) {
  const item = document.createElement("li");
  item.className = "log__item";
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  item.textContent = `[${time}] ${message}`;
  logList.prepend(item);
  const maxEntries = 40;
  while (logList.children.length > maxEntries) {
    logList.removeChild(logList.lastChild);
  }
}

init();
