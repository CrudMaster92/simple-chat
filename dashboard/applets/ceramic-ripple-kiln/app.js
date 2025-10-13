const clays = [
  {
    id: 'riverstone',
    name: 'Riverstone Blend',
    gradient: ['#d4b08a', '#b28358'],
    rim: '#f0d7c0',
    description: 'River gravel stoneware with a sandy tooth — ripples glow softly.',
    schedule: { bisquePeak: 980, glazePeak: 1230, rampBisque: 170, rampGlaze: 210, holdBase: 14, coolHold: 45 }
  },
  {
    id: 'porcelain',
    name: 'Porcelain Veil',
    gradient: ['#f3ede7', '#d7cdc4'],
    rim: '#fff4e9',
    description: 'Translucent porcelain craving patient ramps and mist glazes.',
    schedule: { bisquePeak: 960, glazePeak: 1245, rampBisque: 160, rampGlaze: 205, holdBase: 16, coolHold: 40 }
  },
  {
    id: 'ironstone',
    name: 'Ironstone Ember',
    gradient: ['#c47b4f', '#844c2f'],
    rim: '#f1c4a8',
    description: 'Iron-rich clay that fires to ember tones and loves ash glass.',
    schedule: { bisquePeak: 1000, glazePeak: 1220, rampBisque: 180, rampGlaze: 215, holdBase: 12, coolHold: 52 }
  }
];

const glazes = [
  {
    id: 'amber-shino',
    name: 'Amber Shino',
    swatch: ['#d9822b', '#f5c57b'],
    tint: 'rgba(217,130,43,0.48)',
    highlight: 'rgba(245,197,123,0.35)',
    adjustments: { peak: 16, hold: 4, cool: 4, ramp: 6 },
    note: 'Caramel melt with flame-line flashes.'
  },
  {
    id: 'feldspar-ash',
    name: 'Feldspar Ash',
    swatch: ['#748c69', '#c7d3b0'],
    tint: 'rgba(116,140,105,0.45)',
    highlight: 'rgba(199,211,176,0.3)',
    adjustments: { peak: 10, hold: 6, cool: 12, ramp: -8 },
    note: 'Wood ash cascades and satiny drips.'
  },
  {
    id: 'misty-celadon',
    name: 'Misty Celadon',
    swatch: ['#a7c4bc', '#6e998a'],
    tint: 'rgba(167,196,188,0.5)',
    highlight: 'rgba(110,153,138,0.35)',
    adjustments: { peak: -4, hold: 8, cool: 14, ramp: -6 },
    note: 'Seagrass fog, soft pooling, loves porcelain.'
  },
  {
    id: 'graphite-slip',
    name: 'Graphite Slip',
    swatch: ['#4a4a4a', '#9da2a6'],
    tint: 'rgba(74,74,74,0.55)',
    highlight: 'rgba(157,162,166,0.35)',
    adjustments: { peak: 12, hold: 2, cool: 6, ramp: 4 },
    note: 'Smoky satin undercoat that sharpens glazes.'
  }
];

const claySelect = document.getElementById('claySelect');
const glazePalette = document.getElementById('glazePalette');
const vesselBody = document.getElementById('vesselBody');
const previewDial = document.getElementById('previewDial');
const previewMeta = document.getElementById('previewMeta');
const scheduleBody = document.getElementById('scheduleBody');
const queueButton = document.getElementById('queueButton');
const queueList = document.getElementById('queueList');

const textures = {
  ripple: document.getElementById('textureRipple'),
  craze: document.getElementById('textureCraze'),
  matte: document.getElementById('textureMatte')
};

let selectedClayId = clays[0].id;
let selectedGlazes = [];
let lastSchedule = [];
const queueEntries = [];

function initClaySelect() {
  clays.forEach((clay) => {
    const option = document.createElement('option');
    option.value = clay.id;
    option.textContent = clay.name;
    claySelect.append(option);
  });
  claySelect.value = selectedClayId;
}

function initGlazePalette() {
  glazes.forEach((glaze) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'glaze-chip';
    button.dataset.glazeId = glaze.id;
    button.innerHTML = `
      <div class="glaze-chip__swatch" style="background: linear-gradient(135deg, ${glaze.swatch[0]}, ${glaze.swatch[1]});"></div>
      <div class="glaze-chip__details">
        <div class="glaze-chip__label">${glaze.name}</div>
        <div class="glaze-chip__note">${glaze.note}</div>
      </div>
    `;
    button.addEventListener('click', () => toggleGlaze(glaze.id));
    glazePalette.append(button);
  });
}

function toggleGlaze(glazeId) {
  const index = selectedGlazes.indexOf(glazeId);
  if (index >= 0) {
    selectedGlazes.splice(index, 1);
  } else {
    selectedGlazes.push(glazeId);
    if (selectedGlazes.length > 3) {
      selectedGlazes.shift();
    }
  }
  updateGlazePalette();
  updatePreview();
  updateSchedule();
}

function updateGlazePalette() {
  Array.from(glazePalette.children).forEach((chip) => {
    chip.classList.toggle('glaze-chip--active', selectedGlazes.includes(chip.dataset.glazeId));
  });
}

function currentClay() {
  return clays.find((clay) => clay.id === selectedClayId) ?? clays[0];
}

function activeGlazes() {
  return selectedGlazes.map((id) => glazes.find((glaze) => glaze.id === id)).filter(Boolean);
}

function updatePreview() {
  const clay = currentClay();
  const overlays = [];
  activeGlazes().forEach((glaze, index) => {
    const angle = 110 + index * 12;
    overlays.push(`linear-gradient(${angle}deg, ${glaze.tint} 0%, transparent 75%)`);
    overlays.push(`radial-gradient(circle at ${25 + index * 25}% ${35 + index * 20}%, ${glaze.highlight} 0%, transparent 60%)`);
  });

  const base = `linear-gradient(135deg, ${clay.gradient[0]}, ${clay.gradient[1]})`;
  const surface = overlays.length ? `${overlays.join(', ')}, ${base}` : base;
  vesselBody.style.background = surface;

  const dial = Number.parseInt(previewDial.value, 10);
  const tilt = (dial - 50) / 6;
  vesselBody.style.transform = `rotate(${tilt}deg)`;

  const filterParts = [];
  if (textures.matte.checked) filterParts.push('saturate(0.82)', 'brightness(0.95)');
  if (textures.craze.checked) filterParts.push('contrast(1.05)');
  if (!filterParts.length) filterParts.push('saturate(1.05)');
  vesselBody.style.filter = filterParts.join(' ');
  vesselBody.style.boxShadow = textures.ripple.checked
    ? '0 22px 32px rgba(59, 48, 37, 0.28)'
    : '0 18px 28px rgba(59, 48, 37, 0.24)';

  const glazeNames = activeGlazes().map((glaze) => glaze.name);
  const textureNames = Object.entries(textures)
    .filter(([, checkbox]) => checkbox.checked)
    .map(([key]) => key.replace(/^[a-z]/, (match) => match.toUpperCase()));

  const descriptors = [clay.description];
  if (glazeNames.length) descriptors.push(glazeNames.join(', '));
  if (textureNames.length) descriptors.push(`${textureNames.join(' + ')} finish`);

  previewMeta.textContent = descriptors.join(' · ');
}

function updateSchedule() {
  const clay = currentClay();
  const glazeList = activeGlazes();

  const adjustments = glazeList.reduce(
    (acc, glaze) => {
      acc.peak += glaze.adjustments.peak;
      acc.hold += glaze.adjustments.hold;
      acc.cool += glaze.adjustments.cool;
      acc.ramp += glaze.adjustments.ramp;
      return acc;
    },
    { peak: 0, hold: 0, cool: 0, ramp: 0 }
  );

  if (textures.ripple.checked) {
    adjustments.peak += 3;
    adjustments.hold += 2;
  }
  if (textures.craze.checked) {
    adjustments.peak += 8;
    adjustments.hold += 6;
    adjustments.cool += 10;
  }
  if (textures.matte.checked) {
    adjustments.peak -= 12;
    adjustments.hold += 8;
    adjustments.cool += 8;
    adjustments.ramp -= 10;
  }

  const bisqueRamp = Math.max(140, clay.schedule.rampBisque + Math.round(adjustments.ramp * 0.4));
  const glazeRamp = Math.max(150, clay.schedule.rampGlaze + Math.round(adjustments.ramp * 0.6));
  const bisquePeak = clay.schedule.bisquePeak + Math.round(adjustments.peak * 0.35) + (glazeList.length > 1 ? 6 : 0);
  const glazePeak = clay.schedule.glazePeak + adjustments.peak;
  const holdMinutes = Math.max(12, clay.schedule.holdBase + adjustments.hold);
  const coolHold = Math.max(24, clay.schedule.coolHold + adjustments.cool);

  lastSchedule = [
    { phase: 'Candling', ramp: '60°/hr', peak: '110°C', hold: '45 min' },
    { phase: 'Bisque climb', ramp: `${bisqueRamp}°/hr`, peak: `${bisquePeak}°C`, hold: `${Math.round(holdMinutes * 0.6)} min` },
    { phase: 'Glaze soak', ramp: `${glazeRamp}°/hr`, peak: `${glazePeak}°C`, hold: `${Math.round(holdMinutes)} min` },
    { phase: 'Cooling pause', ramp: 'Vented @ 650°C', peak: '650°C', hold: `${Math.round(coolHold)} min` }
  ];

  scheduleBody.innerHTML = '';
  lastSchedule.forEach((step) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <th scope="row">${step.phase}</th>
      <td>${step.ramp}</td>
      <td>${step.peak}</td>
      <td>${step.hold}</td>
    `;
    scheduleBody.append(row);
  });
}

function renderQueue() {
  queueList.innerHTML = '';
  if (queueEntries.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'Queue is empty — stage a blend and send it in.';
    queueList.append(placeholder);
    return;
  }

  queueEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'queue__item';

    const header = document.createElement('header');
    header.innerHTML = `<span>${entry.clay}</span><span>${entry.schedule[2].peak}</span>`;
    item.append(header);

    const glazesLine = document.createElement('p');
    glazesLine.textContent = entry.glazes.length ? `Glazes: ${entry.glazes.join(', ')}` : 'No glaze layers';
    item.append(glazesLine);

    const textureLine = document.createElement('p');
    textureLine.textContent = entry.textures.length ? `Textures: ${entry.textures.join(', ')}` : 'Textures: smooth body';
    item.append(textureLine);

    const holdLine = document.createElement('p');
    holdLine.textContent = `Hold ${entry.schedule[2].hold} · Cool pause ${entry.schedule[3].hold}`;
    item.append(holdLine);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const index = queueEntries.findIndex((queueEntry) => queueEntry.id === entry.id);
      if (index !== -1) {
        queueEntries.splice(index, 1);
        renderQueue();
      }
    });
    item.append(remove);

    queueList.append(item);
  });
}

function queueCurrentBlend() {
  const clay = currentClay();
  const glazesLine = activeGlazes().map((glaze) => glaze.name);
  const textureNames = Object.entries(textures)
    .filter(([, checkbox]) => checkbox.checked)
    .map(([key]) => key.replace(/^[a-z]/, (match) => match.toUpperCase()));

  const entry = {
    id: crypto.randomUUID(),
    clay: clay.name,
    glazes: glazesLine,
    textures: textureNames,
    schedule: lastSchedule
  };

  queueEntries.unshift(entry);
  if (queueEntries.length > 4) {
    queueEntries.pop();
  }

  renderQueue();
}

claySelect.addEventListener('change', (event) => {
  selectedClayId = event.target.value;
  updatePreview();
  updateSchedule();
});

previewDial.addEventListener('input', () => {
  updatePreview();
});

Object.values(textures).forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    updatePreview();
    updateSchedule();
  });
});

queueButton.addEventListener('click', () => {
  if (lastSchedule.length === 0) updateSchedule();
  queueCurrentBlend();
});

initClaySelect();
initGlazePalette();
updateGlazePalette();
updatePreview();
updateSchedule();
renderQueue();
