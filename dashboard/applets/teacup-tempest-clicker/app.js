const brewButton = document.getElementById('brewButton');
const totalSipsEl = document.getElementById('totalSips');
const perClickEl = document.getElementById('perClick');
const perSecondEl = document.getElementById('perSecond');
const moodTextEl = document.getElementById('moodText');
const lastActionEl = document.getElementById('lastAction');
const logEntriesEl = document.getElementById('logEntries');
const upgradeListEl = document.getElementById('upgradeList');
const teacupEl = document.querySelector('.teacup');

const state = {
  totalSips: 0,
  perClick: 1,
  perSecond: 0,
  upgrades: {},
  log: [],
  triggeredMilestones: new Set(),
};

const moods = [
  { threshold: 0, message: 'Calm ripples' },
  { threshold: 25, message: 'Tangerine eddies' },
  { threshold: 90, message: 'Cascading citrus squall' },
  { threshold: 220, message: 'Seafoam spiral surge' },
  { threshold: 520, message: 'Honeystorm jubilee' },
  { threshold: 900, message: 'Auric thunder bloom' },
];

const milestoneLog = [
  { threshold: 10, message: 'A shy sugar sprite peeks over the rim, curious about your brewing tempo.' },
  { threshold: 35, message: 'Cinnamon thunderheads bead along the saucer, humming gentle percussion.' },
  { threshold: 80, message: 'You cork a vial of lemon lightning. The lab smells like effervescent rain.' },
  { threshold: 160, message: 'Porcelain windows fog with peppermint pressure. The teacup chuckles.' },
  { threshold: 320, message: 'Storm sprites choreograph swirling ribbons that loop through the air vents.' },
  { threshold: 600, message: 'A miniature barometer whale surfaces, announcing steady squalls forevermore.' },
];

const upgrades = [
  {
    id: 'pressure-valve',
    name: 'Porcelain Pressure Valve',
    description: 'Compresses each tap into a denser gulp of storm sip goodness (+1 per click).',
    baseCost: 18,
    growth: 1.6,
    increment: 1,
    type: 'click',
  },
  {
    id: 'citrus-spiral',
    name: 'Citrus Cyclone Spiral',
    description: 'Suspends candied zest above the cup to drip steady sparks (+2 per second).',
    baseCost: 45,
    growth: 1.65,
    increment: 2,
    type: 'auto',
  },
  {
    id: 'peppermint-turbine',
    name: 'Peppermint Turbine',
    description: 'A whirligig straw stirs the brew for triple snap taps (+2 per click).',
    baseCost: 75,
    growth: 1.7,
    increment: 2,
    type: 'click',
  },
  {
    id: 'steam-chorus',
    name: 'Steam Sprite Chorus',
    description: 'Choirs of steam sprites hum counterpoint squalls (+4 per second).',
    baseCost: 120,
    growth: 1.72,
    increment: 4,
    type: 'auto',
  },
  {
    id: 'auric-orchard',
    name: 'Auric Orchard Condenser',
    description: 'Hangs sunwarmed citrus orbs overhead for dazzling torrent bursts (+5 per click).',
    baseCost: 210,
    growth: 1.8,
    increment: 5,
    type: 'click',
  },
  {
    id: 'thunder-siphon',
    name: 'Thunder Siphon Loom',
    description: 'Woven copper threads capture stray rumbles (+8 per second).',
    baseCost: 260,
    growth: 1.82,
    increment: 8,
    type: 'auto',
  },
];

function formatNumber(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return Math.round(value).toLocaleString();
}

function updateStatsDisplay() {
  totalSipsEl.textContent = formatNumber(state.totalSips);
  perClickEl.textContent = formatNumber(state.perClick);
  perSecondEl.textContent = `${formatNumber(state.perSecond)} /s`;
  updateMood();
  updateUpgradeButtons();
}

function updateMood() {
  let current = moods[0].message;
  for (const mood of moods) {
    if (state.totalSips >= mood.threshold) {
      current = mood.message;
    } else {
      break;
    }
  }
  moodTextEl.textContent = current;
}

function updateUpgradeButtons() {
  const buttons = upgradeListEl.querySelectorAll('button[data-upgrade-id]');
  buttons.forEach((button) => {
    const id = button.dataset.upgradeId;
    const level = state.upgrades[id] ?? 0;
    const upgrade = upgrades.find((item) => item.id === id);
    if (!upgrade) return;
    const cost = calculateCost(upgrade, level);
    button.disabled = state.totalSips < cost;
    button.querySelector('.upgrade-card__price').textContent = `${formatNumber(cost)} sips`;
    button.querySelector('.upgrade-card__level').textContent = `Tier ${level + 1}`;
  });
}

function calculateCost(upgrade, level) {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, level));
}

function addSips(amount, source = 'manual') {
  state.totalSips += amount;
  if (source === 'manual') {
    const descriptors = [
      'amber fizz ripples outward',
      'a zing of citrus static crackles',
      'a plume of honeyed mist sighs up',
      'sea-salt foam twirls along the rim',
      'peppercorn sparks glitter in the steam',
    ];
    const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
    lastActionEl.textContent = `You siphon ${amount} storm sip${amount === 1 ? '' : 's'} — ${descriptor}.`;
    spawnSteamPop();
  }
  checkMilestones();
  updateStatsDisplay();
}

function spawnSteamPop() {
  const bubble = document.createElement('span');
  bubble.className = 'steam-pop';
  bubble.style.left = `${40 + Math.random() * 20}%`;
  bubble.style.setProperty('--travel', `${60 + Math.random() * 40}px`);
  teacupEl.appendChild(bubble);
  requestAnimationFrame(() => bubble.classList.add('steam-pop--visible'));
  setTimeout(() => bubble.remove(), 900);
}

function pushLog(message) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.log.unshift({ message, timestamp });
  if (state.log.length > 8) {
    state.log.pop();
  }
  renderLog();
}

function renderLog() {
  logEntriesEl.innerHTML = '';
  state.log.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.timestamp}</strong> — ${entry.message}`;
    logEntriesEl.appendChild(li);
  });
}

function checkMilestones() {
  milestoneLog.forEach((milestone) => {
    if (state.totalSips >= milestone.threshold && !state.triggeredMilestones.has(milestone.threshold)) {
      state.triggeredMilestones.add(milestone.threshold);
      pushLog(milestone.message);
    }
  });
}

function purchaseUpgrade(upgrade) {
  const level = state.upgrades[upgrade.id] ?? 0;
  const cost = calculateCost(upgrade, level);
  if (state.totalSips < cost) return;
  state.totalSips -= cost;
  state.upgrades[upgrade.id] = level + 1;
  if (upgrade.type === 'click') {
    state.perClick += upgrade.increment;
  } else {
    state.perSecond += upgrade.increment;
  }
  pushLog(`${upgrade.name} hums to life. ${upgrade.type === 'click' ? 'Click potency surges.' : 'Passive infusion quickens.'}`);
  lastActionEl.textContent = `${upgrade.name} engaged at tier ${state.upgrades[upgrade.id]}.`;
  updateStatsDisplay();
}

function buildUpgradeCard(upgrade) {
  const level = state.upgrades[upgrade.id] ?? 0;
  const cost = calculateCost(upgrade, level);
  const card = document.createElement('article');
  card.className = 'upgrade-card';
  const button = document.createElement('button');
  button.className = 'upgrade-card__button';
  button.type = 'button';
  button.dataset.upgradeId = upgrade.id;
  button.innerHTML = `
    <div class="upgrade-card__header">
      <span class="upgrade-card__name">${upgrade.name}</span>
      <span class="upgrade-card__price">${formatNumber(cost)} sips</span>
    </div>
    <p class="upgrade-card__description">${upgrade.description}</p>
    <span class="upgrade-card__level">Tier ${level + 1}</span>
  `;
  button.addEventListener('click', () => purchaseUpgrade(upgrade));
  card.appendChild(button);
  return card;
}

function renderUpgrades() {
  upgradeListEl.innerHTML = '';
  upgrades.forEach((upgrade) => {
    const card = buildUpgradeCard(upgrade);
    upgradeListEl.appendChild(card);
  });
}

brewButton.addEventListener('click', () => {
  brewButton.classList.remove('burst');
  void brewButton.offsetWidth;
  brewButton.classList.add('burst');
  addSips(state.perClick, 'manual');
});

renderUpgrades();
updateStatsDisplay();
pushLog('The kettle hums quietly, awaiting its first tempest.');

setInterval(() => {
  if (state.perSecond <= 0) return;
  const amount = state.perSecond;
  state.totalSips += amount;
  updateStatsDisplay();
}, 1000);
