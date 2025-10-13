const fibers = [
  {
    id: 'citrus',
    name: 'Citrus Rind Pulp',
    gradient: 'linear-gradient(135deg, #f9f1df, #e9d2a8)',
    weight: '120 gsm',
    texture: 'Soft pulp fleck',
    scent: 'Candied zest',
    description: 'Pressed by hillside pulp guilds with flecks of preserved citrus rind.',
    string: '#c56a2b',
    seal: { base: '#c56a2b', highlight: '#ffe0b8', motif: 'Citrus crest' }
  },
  {
    id: 'river',
    name: 'River Reed Cotton',
    gradient: 'linear-gradient(135deg, #f4eee0, #d8d3c0)',
    weight: '135 gsm',
    texture: 'Deckled reed striations',
    scent: 'Mist and linen chest',
    description: 'Pulped beside a sleepy canal where reedbeds meet cotton looms.',
    string: '#8c7a63',
    seal: { base: '#b67130', highlight: '#f4d5a1', motif: 'Bridge imprint' }
  },
  {
    id: 'meteor',
    name: 'Meteor Smoke Rag',
    gradient: 'linear-gradient(135deg, #efe8de, #c9bbae)',
    weight: '150 gsm',
    texture: 'Satin rag with charcoal veil',
    scent: 'Warm cedar & stardust',
    description: 'Refined from observatory logbooks dusted with meteor ash.',
    string: '#705b4d',
    seal: { base: '#a8562a', highlight: '#ffd0a0', motif: 'Meteor glyph' }
  }
];

const linings = [
  {
    id: 'fern',
    name: 'Sunprint Fern',
    pattern:
      'repeating-linear-gradient(135deg, rgba(197,106,43,0.28) 0 18px, rgba(255,249,239,0.65) 18px 36px)',
    description: 'Leaf silhouettes exposed at noon on salt-washed muslin.'
  },
  {
    id: 'ledger',
    name: 'Copper Ledger',
    pattern:
      'repeating-linear-gradient(0deg, rgba(140,122,99,0.35) 0 10px, transparent 10px 20px), repeating-linear-gradient(90deg, rgba(197,106,43,0.25) 0 12px, transparent 12px 24px)',
    description: 'Crosshatched columns for secret tallies and coded sums.'
  },
  {
    id: 'windletter',
    name: 'Windletter Script',
    pattern:
      'repeating-linear-gradient(90deg, rgba(181,140,110,0.25) 0 14px, transparent 14px 28px), repeating-linear-gradient(0deg, rgba(255,247,234,0.82) 0 24px, rgba(197,106,43,0.18) 24px 28px)',
    description: 'Loops of cursive carried from the aerogram archive.'
  },
  {
    id: 'atlas',
    name: 'Maple Atlas',
    pattern:
      'repeating-linear-gradient(135deg, rgba(141,122,99,0.28) 0 16px, rgba(255,249,239,0.55) 16px 32px), radial-gradient(circle at 30% 40%, rgba(197,106,43,0.3) 0 18%, transparent 30%)',
    description: 'Cartographic speckles charting courier glider routes.'
  }
];

const paperSelect = document.getElementById('paperSelect');
const liningPalette = document.getElementById('liningPalette');
const paperLayer = document.getElementById('paperLayer');
const liningLayer = document.getElementById('liningLayer');
const sealLayer = document.getElementById('sealLayer');
const stringLayer = document.getElementById('stringLayer');
const braidToggle = document.getElementById('braidToggle');
const waxToggle = document.getElementById('waxToggle');
const inkToggle = document.getElementById('inkToggle');
const phraseInput = document.getElementById('phraseInput');
const previewMeta = document.getElementById('previewMeta');
const ledgerButton = document.getElementById('ledgerButton');
const ledgerList = document.getElementById('ledgerList');
const detailTitle = document.getElementById('detailTitleText');
const detailDescription = document.getElementById('detailDescription');
const weightValue = document.getElementById('weightValue');
const textureValue = document.getElementById('textureValue');
const scentValue = document.getElementById('scentValue');

let selectedFiber = fibers[0];
let selectedLining = linings[0];
const ledgerEntries = [];

function initFiberSelect() {
  fibers.forEach((fiber) => {
    const option = document.createElement('option');
    option.value = fiber.id;
    option.textContent = fiber.name;
    paperSelect.append(option);
  });
  paperSelect.value = selectedFiber.id;
}

function initLiningPalette() {
  linings.forEach((lining) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.liningId = lining.id;
    button.innerHTML = `
      <div class="swatch" style="background:${lining.pattern};"></div>
      <span>${lining.name}</span>
    `;
    button.addEventListener('click', () => {
      selectedLining = lining;
      updateLiningPalette();
      updatePreview();
    });
    liningPalette.append(button);
  });
  updateLiningPalette();
}

function updateLiningPalette() {
  Array.from(liningPalette.children).forEach((button) => {
    button.classList.toggle('active', button.dataset.liningId === selectedLining.id);
  });
}

function updatePreview() {
  paperLayer.style.background = selectedFiber.gradient;
  liningLayer.style.background = selectedLining.pattern;
  stringLayer.style.borderColor = selectedFiber.string;
  stringLayer.style.opacity = braidToggle.checked ? '1' : '0';

  if (waxToggle.checked) {
    sealLayer.style.opacity = '1';
    sealLayer.style.transform = 'scale(1)';
    sealLayer.style.background = `radial-gradient(circle at 30% 30%, ${selectedFiber.seal.highlight}, ${selectedFiber.seal.base})`;
  } else {
    sealLayer.style.opacity = '0';
    sealLayer.style.transform = 'scale(0.8)';
  }

  paperLayer.style.boxShadow = inkToggle.checked
    ? 'inset 0 0 0 2px rgba(197,106,43,0.35)'
    : '0 20px 30px rgba(61,47,43,0.2)';

  const toggles = [];
  if (braidToggle.checked) toggles.push('braid wrap');
  if (waxToggle.checked) toggles.push(`${selectedFiber.seal.motif}`);
  if (inkToggle.checked) toggles.push('inked edges');

  const phrase = phraseInput.value.trim();
  const phraseSnippet = phrase ? `“${phrase}” tucked inside` : 'no hidden phrase';
  previewMeta.textContent = `${selectedFiber.name} · ${selectedLining.name} lining · ${toggles.join(' + ') || 'simple fold'} · ${phraseSnippet}`;

  detailTitle.textContent = selectedFiber.name;
  detailDescription.textContent = selectedFiber.description;
  weightValue.textContent = selectedFiber.weight;
  textureValue.textContent = selectedFiber.texture;
  scentValue.textContent = selectedFiber.scent;
}

function renderLedger() {
  ledgerList.innerHTML = '';
  if (ledgerEntries.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'Ledger empty — craft an envelope to dispatch.';
    ledgerList.append(placeholder);
    return;
  }

  ledgerEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'ledger__item';

    const header = document.createElement('header');
    header.innerHTML = `<span>${entry.fiber}</span><span>${entry.lining}</span>`;
    item.append(header);

    const body = document.createElement('p');
    body.textContent = entry.toggles.length ? `Rituals: ${entry.toggles.join(', ')}` : 'Rituals: none';
    item.append(body);

    const phrase = document.createElement('p');
    phrase.textContent = entry.phrase ? `Phrase: “${entry.phrase}”` : 'Phrase slot left blank';
    item.append(phrase);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const index = ledgerEntries.findIndex((log) => log.id === entry.id);
      if (index !== -1) {
        ledgerEntries.splice(index, 1);
        renderLedger();
      }
    });
    item.append(remove);

    ledgerList.append(item);
  });
}

function queueEnvelope() {
  const toggles = [];
  if (braidToggle.checked) toggles.push('braid wrap');
  if (waxToggle.checked) toggles.push(selectedFiber.seal.motif);
  if (inkToggle.checked) toggles.push('inked edges');

  const phrase = phraseInput.value.trim();

  const entry = {
    id: crypto.randomUUID(),
    fiber: selectedFiber.name,
    lining: selectedLining.name,
    toggles,
    phrase
  };

  ledgerEntries.unshift(entry);
  if (ledgerEntries.length > 6) {
    ledgerEntries.pop();
  }

  renderLedger();
}

paperSelect.addEventListener('change', (event) => {
  const nextFiber = fibers.find((fiber) => fiber.id === event.target.value);
  if (nextFiber) {
    selectedFiber = nextFiber;
    updatePreview();
  }
});

[braidToggle, waxToggle, inkToggle].forEach((toggle) => {
  toggle.addEventListener('change', updatePreview);
});

phraseInput.addEventListener('input', updatePreview);
ledgerButton.addEventListener('click', queueEnvelope);

initFiberSelect();
initLiningPalette();
updatePreview();
renderLedger();
