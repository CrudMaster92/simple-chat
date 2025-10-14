const buildingData = {
  residential: {
    name: 'Residential Block',
    short: 'R',
    cost: 100,
    population: 5,
    happiness: 1,
    pollution: 1,
    income: 8,
    description:
      'Welcomes new neighbors, nudges happiness upward, and produces a steady trickle of taxes each turn.'
  },
  commercial: {
    name: 'Market Square',
    short: 'M',
    cost: 120,
    population: 2,
    happiness: 2,
    pollution: 1,
    income: 20,
    description:
      'Adds bustle and prosperity, attracting shoppers and boosting income every review.'
  },
  park: {
    name: 'Verdant Park',
    short: 'P',
    cost: 80,
    population: 0,
    happiness: 3,
    pollution: -3,
    income: 0,
    description:
      'Restores morale, scrubs smog from the air, and offers scenic overlooks for the hillside.'
  },
  industry: {
    name: 'Workshop Hub',
    short: 'W',
    cost: 150,
    population: 0,
    happiness: -2,
    pollution: 4,
    income: 45,
    description:
      'Drives major revenue but strains the air. Counterbalance it with parks and utilities.'
  },
  utility: {
    name: 'Eco Utility',
    short: 'U',
    cost: 90,
    population: 0,
    happiness: 1,
    pollution: -2,
    income: 10,
    description:
      'Filters runoff, cheers residents with reliable services, and keeps the skyline running.'
  }
};

const baseState = {
  money: 600,
  population: 0,
  happiness: 5,
  pollution: 0,
  turnsLeft: 15
};

const state = {
  gridSize: 6,
  grid: [],
  ...baseState,
  selected: 'residential',
  gameOver: false
};

const selectors = {
  grid: document.getElementById('cityGrid'),
  statusBanner: document.getElementById('statusBanner'),
  stats: {
    money: document.getElementById('moneyStat'),
    population: document.getElementById('populationStat'),
    happiness: document.getElementById('happinessStat'),
    pollution: document.getElementById('pollutionStat'),
    turns: document.getElementById('turnsStat')
  },
  buildingCards: document.querySelectorAll('.building-card'),
  selectionDetails: document.getElementById('selectionDetails'),
  eventLog: document.getElementById('eventLog'),
  endTurnButton: document.getElementById('endTurnButton'),
  resetButton: document.getElementById('resetButton'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalMessage: document.getElementById('modalMessage'),
  modalClose: document.getElementById('modalClose')
};

function initGrid() {
  selectors.grid.innerHTML = '';
  state.grid = Array.from({ length: state.gridSize }, () => Array(state.gridSize).fill(null));

  for (let row = 0; row < state.gridSize; row += 1) {
    for (let col = 0; col < state.gridSize; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'grid-cell';
      cell.dataset.row = row.toString();
      cell.dataset.col = col.toString();
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Empty lot at row ${row + 1}, column ${col + 1}`);
      const label = document.createElement('span');
      label.textContent = '';
      cell.append(label);
      cell.addEventListener('click', handlePlacement);
      selectors.grid.append(cell);
    }
  }
}

function setSelection(type) {
  state.selected = type;
  selectors.buildingCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.building === type);
  });
  selectors.selectionDetails.textContent = buildingData[type].description;
}

function handlePlacement(event) {
  if (state.gameOver) {
    return;
  }

  const cell = event.currentTarget;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (state.grid[row][col]) {
    flashStatus('That lot is already zoned. Try another tile.');
    return;
  }

  const building = buildingData[state.selected];

  if (state.money < building.cost) {
    flashStatus('Treasury too low for that district. End a turn to gain income.');
    return;
  }

  state.money -= building.cost;
  state.population += building.population;
  state.happiness += building.happiness;
  state.pollution = Math.max(0, state.pollution + building.pollution);
  state.grid[row][col] = { type: state.selected };

  applyCellState(cell, state.selected);
  logEvent(`${building.name} placed. ${formatDelta(building)}.`);
  updateStats();
  checkVictory();
}

function applyCellState(cell, type) {
  cell.className = `grid-cell ${type}`;
  const label = cell.querySelector('span');
  label.textContent = buildingData[type].short;
  if (type === 'commercial') {
    label.style.color = 'white';
  } else {
    label.style.color = '';
  }
  cell.setAttribute('aria-label', `${buildingData[type].name} at row ${Number(cell.dataset.row) + 1}, column ${Number(cell.dataset.col) + 1}`);
}

function formatDelta(building) {
  const bits = [];
  if (building.population) bits.push(`Pop ${signed(building.population)}`);
  if (building.happiness) bits.push(`Joy ${signed(building.happiness)}`);
  if (building.pollution) bits.push(`Smog ${signed(building.pollution)}`);
  if (building.cost) bits.push(`Cost -$${building.cost}`);
  return bits.join(' · ');
}

function signed(value) {
  return value > 0 ? `+${value}` : value.toString();
}

function updateStats() {
  selectors.stats.money.textContent = Math.round(state.money);
  selectors.stats.population.textContent = Math.round(state.population);
  selectors.stats.happiness.textContent = Math.round(state.happiness);
  selectors.stats.pollution.textContent = Math.round(state.pollution);
  selectors.stats.turns.textContent = state.turnsLeft;
}

function flashStatus(message) {
  selectors.statusBanner.textContent = message;
  selectors.statusBanner.classList.add('active');
  setTimeout(() => selectors.statusBanner.classList.remove('active'), 1800);
}

function logEvent(message) {
  const entry = document.createElement('p');
  entry.textContent = message;
  selectors.eventLog.prepend(entry);

  while (selectors.eventLog.children.length > 6) {
    selectors.eventLog.lastElementChild.remove();
  }
}

function endTurn() {
  if (state.gameOver) {
    return;
  }
  if (state.turnsLeft <= 0) {
    flashStatus('Planning review has already concluded. Start a new city.');
    return;
  }

  state.turnsLeft -= 1;
  const income = calculateIncome();
  state.money += income;
  let notes = [`Income collected: $${income}`];

  if (state.pollution >= 30) {
    state.happiness -= 3;
    notes.push('Severe smog drained 3 happiness.');
  } else if (state.pollution >= 20) {
    state.happiness -= 1;
    notes.push('Smog warnings lowered happiness.');
  }

  if (state.happiness < 0) state.happiness = 0;

  logEvent(notes.join(' '));
  updateStats();
  checkVictory();

  if (state.gameOver) {
    return;
  }

  if (state.money < 0) {
    triggerDefeat('The treasury ran dry and the council seized control.');
    return;
  }

  if (state.pollution >= 40) {
    triggerDefeat('Pollution spiked past safe limits. Emergency oversight dissolved the plan.');
    return;
  }

  if (state.turnsLeft === 0) {
    triggerDefeat('Review concluded before objectives were met. The charter was revoked.');
  } else {
    flashStatus(`Turn resolved. Income added and ${state.turnsLeft} turns remain.`);
  }
}

function calculateIncome() {
  return state.grid.flat().reduce((total, tile) => {
    if (!tile) return total;
    const income = buildingData[tile.type].income;
    return total + income;
  }, 0);
}

function checkVictory() {
  if (state.population >= 60 && state.happiness >= 18 && state.pollution <= 25) {
    triggerVictory('The hillside skyline thrived with happy citizens and clean air. The council granted you the Horizon Charter!');
  }
}

function triggerVictory(message) {
  if (state.gameOver) return;
  state.gameOver = true;
  openModal('Victory!', message);
}

function triggerDefeat(message) {
  if (state.gameOver) return;
  state.gameOver = true;
  openModal('City Audit', message);
}

function openModal(title, message) {
  selectors.modalTitle.textContent = title;
  selectors.modalMessage.textContent = message;
  selectors.modal.hidden = false;
}

function closeModal() {
  selectors.modal.hidden = true;
}

function resetGame() {
  Object.assign(state, {
    ...baseState,
    grid: Array.from({ length: state.gridSize }, () => Array(state.gridSize).fill(null)),
    selected: 'residential',
    gameOver: false
  });
  initGrid();
  setSelection('residential');
  selectors.eventLog.innerHTML = '';
  logEvent('City charter approved. Starting funds released: $600.');
  updateStats();
  closeModal();
  flashStatus('Fresh blueprint ready. Balance prosperity, joy, and clean skies!');
}

selectors.buildingCards.forEach((card) => {
  card.addEventListener('click', () => {
    setSelection(card.dataset.building);
  });
});

selectors.endTurnButton.addEventListener('click', endTurn);
selectors.resetButton.addEventListener('click', resetGame);
selectors.modalClose.addEventListener('click', () => {
  resetGame();
});
selectors.modal.addEventListener('click', (event) => {
  if (event.target === selectors.modal) {
    resetGame();
  }
});

initGrid();
setSelection(state.selected);
logEvent('City charter approved. Starting funds released: $600.');
updateStats();
