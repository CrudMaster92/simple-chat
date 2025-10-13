const materials = [
  {
    id: 'bamboo',
    name: 'Bamboo',
    tone: 'earthy hollow hush',
    quality: 'grounded warmth',
    flourish: 'soft percussive taps that sway with patience',
    tag: 'grounded',
    titleSeed: 'Bamboo Drift'
  },
  {
    id: 'glass',
    name: 'Glass',
    tone: 'crystalline shimmer',
    quality: 'gleaming clarity',
    flourish: 'delicate clinks that scatter refracted light',
    tag: 'luminous',
    titleSeed: 'Glass Gleam'
  },
  {
    id: 'ceramic',
    name: 'Ceramic',
    tone: 'hollow bell bloom',
    quality: 'handspun resonance',
    flourish: 'rounded tolls that pulse with heart',
    tag: 'resonant',
    titleSeed: 'Clay Bloom'
  },
  {
    id: 'shell',
    name: 'Shell',
    tone: 'tidal hush',
    quality: 'coastal calm',
    flourish: 'whispered knocks reminiscent of shoreline spray',
    tag: 'tidal',
    titleSeed: 'Shell Tide'
  },
  {
    id: 'bronze',
    name: 'Bronze',
    tone: 'sonorous ring',
    quality: 'ancient sustain',
    flourish: 'bold strikes that bloom into long overtones',
    tag: 'sonorous',
    titleSeed: 'Bronze Anthem'
  },
  {
    id: 'silver',
    name: 'Silver',
    tone: 'airy glint',
    quality: 'cool shimmer',
    flourish: 'soft chimes that skip like frost across glass',
    tag: 'sparkling',
    titleSeed: 'Silver Skip'
  }
];

const layouts = [
  {
    id: 'triad-sweep',
    name: 'Triad Sweep',
    description: 'Three staggered lengths forming a gentle arc.',
    chimeHeights: [150, 190, 170],
    title: 'Triad Sweep',
    gesture: 'Begin with the central column and let the flanking chimes answer a beat later.',
    tag: 'arched flow'
  },
  {
    id: 'cascade-fan',
    name: 'Cascade Fan',
    description: 'Wide spread with cascading midline focus.',
    chimeHeights: [130, 200, 160, 176],
    title: 'Cascade Fan',
    gesture: 'Stir breeze fingers diagonally, encouraging a cascading reply from tall to short.',
    tag: 'cascading sway'
  },
  {
    id: 'spiral-ring',
    name: 'Spiral Ring',
    description: 'Compact cluster with a spiral drop at center.',
    chimeHeights: [160, 140, 220, 180],
    title: 'Spiral Ring',
    gesture: 'Circle the striker subtly so inner chimes shimmer before the outer frame joins.',
    tag: 'spiraling pulse'
  }
];

const breezeLevels = {
  1: {
    label: 'Still Hush',
    tempo: 'Lingering rests with occasional sighs.',
    phrasing: 'Allow pauses to stretch nearly silent before feathering the next note.',
    tag: 'slow air',
    trails: [
      { size: 140, left: '12%', top: '44%', delay: '0s', alpha: 0.24, duration: 11 },
      { size: 170, right: '18%', top: '38%', delay: '1.6s', alpha: 0.18, duration: 12 },
      { size: 150, left: '32%', top: '22%', delay: '3.1s', alpha: 0.2, duration: 13 }
    ]
  },
  2: {
    label: 'Gentle Lift',
    tempo: 'Soft pulses with light overlapping sway.',
    phrasing: 'Brush across the hangers in two-beat patterns that leave trailing resonance.',
    tag: 'gentle pulses',
    trails: [
      { size: 150, left: '8%', top: '42%', delay: '0s', alpha: 0.3, duration: 9 },
      { size: 190, right: '14%', top: '32%', delay: '1.2s', alpha: 0.26, duration: 10 },
      { size: 160, left: '38%', top: '16%', delay: '2.4s', alpha: 0.28, duration: 11 }
    ]
  },
  3: {
    label: 'Measured Glide',
    tempo: 'Balanced motion with steady repeats.',
    phrasing: 'Guide the airflow in looping arcs that revisit the anchor tone every third beat.',
    tag: 'steady flow',
    trails: [
      { size: 150, left: '8%', top: '46%', delay: '0s', alpha: 0.32, duration: 8 },
      { size: 210, right: '12%', top: '28%', delay: '1s', alpha: 0.3, duration: 8.8 },
      { size: 180, left: '36%', top: '18%', delay: '2.4s', alpha: 0.28, duration: 9.4 }
    ]
  },
  4: {
    label: 'Brisk Current',
    tempo: 'Lively patterns with syncopated accents.',
    phrasing: 'Sweep in three-part bursts, letting the lightest chime sparkle on the offbeat.',
    tag: 'lively gusts',
    trails: [
      { size: 180, left: '6%', top: '48%', delay: '0s', alpha: 0.36, duration: 7.2 },
      { size: 210, right: '10%', top: '26%', delay: '0.8s', alpha: 0.32, duration: 7.6 },
      { size: 190, left: '34%', top: '14%', delay: '1.6s', alpha: 0.34, duration: 7.9 }
    ]
  },
  5: {
    label: 'Festival Gale',
    tempo: 'Radiant flurries with playful flits.',
    phrasing: 'Dance quick arcs through the rack, accenting alternating corners with vigor.',
    tag: 'radiant flurry',
    trails: [
      { size: 200, left: '4%', top: '50%', delay: '0s', alpha: 0.4, duration: 6.2 },
      { size: 230, right: '8%', top: '24%', delay: '0.6s', alpha: 0.36, duration: 6.4 },
      { size: 200, left: '32%', top: '12%', delay: '1.2s', alpha: 0.38, duration: 6.7 }
    ]
  }
};

const materialMap = new Map(materials.map((material) => [material.id, material]));
const layoutMap = new Map(layouts.map((layout) => [layout.id, layout]));

const materialChipsEl = document.getElementById('materialChips');
const layoutCardsEl = document.getElementById('layoutCards');
const breezeRangeEl = document.getElementById('breezeRange');
const breezeIndicatorEl = document.getElementById('breezeIndicator');
const ambientNotesEl = document.getElementById('ambientNotes');
const chimePreviewEl = document.getElementById('chimePreview');
const breezeTrailsEl = document.getElementById('breezeTrails');
const patternTitleEl = document.getElementById('patternTitle');
const patternSubtitleEl = document.getElementById('patternSubtitle');
const patternTagsEl = document.getElementById('patternTags');
const patternStepsEl = document.getElementById('patternSteps');
const composeButton = document.getElementById('composeButton');
const shuffleButton = document.getElementById('shuffleButton');

let selectedMaterials = [];
let selectedLayoutId = layouts[0]?.id ?? null;
let selectedBreeze = Number(breezeRangeEl.value);

function renderMaterialChips() {
  materialChipsEl.innerHTML = '';
  materials.forEach((material) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = material.name;
    button.dataset.id = material.id;
    button.setAttribute('aria-pressed', 'false');
    button.title = `${material.tone} • ${material.quality}`;
    button.addEventListener('click', () => toggleMaterial(material.id));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMaterial(material.id);
      }
    });
    materialChipsEl.appendChild(button);
  });
}

function renderLayoutCards() {
  layoutCardsEl.innerHTML = '';
  layouts.forEach((layout) => {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.tabIndex = 0;
    card.dataset.id = layout.id;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', layout.id === selectedLayoutId ? 'true' : 'false');

    const icon = document.createElement('div');
    icon.className = 'layout-card__icon';
    layout.chimeHeights.slice(0, 3).forEach((height, index) => {
      const span = document.createElement('span');
      span.style.height = `${36 + index * 8}px`;
      icon.appendChild(span);
    });

    const label = document.createElement('strong');
    label.textContent = layout.name;

    const description = document.createElement('p');
    description.textContent = layout.description;

    card.append(icon, label, description);

    card.addEventListener('click', () => setLayout(layout.id));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setLayout(layout.id);
      }
    });

    layoutCardsEl.appendChild(card);
  });
}

function toggleMaterial(id) {
  const isSelected = selectedMaterials.includes(id);
  if (isSelected) {
    selectedMaterials = selectedMaterials.filter((materialId) => materialId !== id);
  } else {
    if (selectedMaterials.length >= 3) {
      selectedMaterials.shift();
    }
    selectedMaterials.push(id);
  }
  updateMaterialChipStates();
  updateChimePreview();
}

function updateMaterialChipStates() {
  const chipButtons = materialChipsEl.querySelectorAll('.chip');
  chipButtons.forEach((chip) => {
    const pressed = selectedMaterials.includes(chip.dataset.id);
    chip.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  });
}

function setLayout(id) {
  selectedLayoutId = id;
  const cards = layoutCardsEl.querySelectorAll('.layout-card');
  cards.forEach((card) => {
    const checked = card.dataset.id === selectedLayoutId;
    card.setAttribute('aria-checked', checked ? 'true' : 'false');
  });
  updateChimePreview();
}

function updateBreezeIndicator(value) {
  selectedBreeze = value;
  const level = breezeLevels[selectedBreeze];
  breezeIndicatorEl.textContent = level?.label ?? '';
  updateBreezeTrails();
}

function updateChimePreview() {
  const layout = layoutMap.get(selectedLayoutId) ?? layouts[0];
  const heights = layout.chimeHeights;
  chimePreviewEl.innerHTML = '';
  const displayMaterials = selectedMaterials.length ? selectedMaterials : ['bronze'];

  heights.forEach((height, index) => {
    const materialId = displayMaterials[index % displayMaterials.length];
    const material = materialMap.get(materialId);
    const chime = document.createElement('div');
    chime.className = `chime chime--${material?.id ?? 'bronze'}`;
    chime.style.height = `${height}px`;
    chime.setAttribute('aria-hidden', 'true');
    chime.title = `${material?.name ?? 'Bronze'} voice`;
    chimePreviewEl.appendChild(chime);
  });
}

function updateBreezeTrails() {
  breezeTrailsEl.innerHTML = '';
  const level = breezeLevels[selectedBreeze];
  if (!level) return;

  level.trails.forEach((trail) => {
    const path = document.createElement('div');
    path.className = 'breeze-path';
    path.style.width = `${trail.size}px`;
    path.style.height = `${trail.size}px`;
    if (trail.left) path.style.left = trail.left;
    if (trail.right) path.style.right = trail.right;
    path.style.top = trail.top;
    path.style.animationDelay = trail.delay;
    path.style.borderColor = `rgba(199, 120, 53, ${trail.alpha})`;
    path.style.animationDuration = `${trail.duration}s`;
    breezeTrailsEl.appendChild(path);
  });
}

function generatePattern() {
  const layout = layoutMap.get(selectedLayoutId) ?? layouts[0];
  const level = breezeLevels[selectedBreeze];
  const chosenMaterials = selectedMaterials.length ? selectedMaterials : ['bronze'];
  const leadMaterial = materialMap.get(chosenMaterials[0]);
  const secondaryMaterial = chosenMaterials[1] ? materialMap.get(chosenMaterials[1]) : null;
  const tertiaryMaterial = chosenMaterials[2] ? materialMap.get(chosenMaterials[2]) : null;
  const ambient = ambientNotesEl.value.trim();

  const materialNames = chosenMaterials
    .map((id) => materialMap.get(id)?.name ?? '')
    .filter(Boolean);
  const materialLine = materialNames.length > 1
    ? `${materialNames.slice(0, -1).join(', ')} and ${materialNames.slice(-1)}`
    : materialNames[0];

  const ambientLine = ambient ? ` The setting leans into ${ambient.toLowerCase()}.` : '';

  const title = `${leadMaterial?.titleSeed ?? 'Windchime'} ${layout.title}`;
  const subtitle = `A ${level.tag} arrangement pairing ${materialLine || leadMaterial?.name} with ${layout.name.toLowerCase()} pacing.` + ambientLine;

  const tags = new Set([layout.tag, level.tag, leadMaterial?.tag]);
  if (secondaryMaterial) tags.add(secondaryMaterial.tag);
  if (tertiaryMaterial) tags.add(tertiaryMaterial.tag);
  if (ambient) tags.add('site mood');

  const steps = [
    {
      title: 'Opening Drift',
      detail: `${layout.gesture} Focus on ${leadMaterial?.quality ?? 'a steady anchor'} while keeping breaths ${level.tempo.toLowerCase()}`
    },
    {
      title: 'Middle Ripple',
      detail:
        secondaryMaterial
          ? `Blend in ${secondaryMaterial.name} accents so their ${secondaryMaterial.flourish} complements the primary tone.`
          : `Sustain the ${leadMaterial?.tone ?? 'primary voice'} and invite subtle dynamic shifts with gentle wrist turns.`
    },
    {
      title: 'Closing Echo',
      detail: `${level.phrasing} ${tertiaryMaterial ? `Let ${tertiaryMaterial.name.toLowerCase()} whispers close the arc.` : 'Let the final resonance fade naturally.'}`
    }
  ];

  return { title, subtitle, tags: Array.from(tags).filter(Boolean), steps };
}

function renderPattern(pattern) {
  patternTitleEl.textContent = pattern.title;
  patternSubtitleEl.textContent = pattern.subtitle;

  patternTagsEl.innerHTML = '';
  pattern.tags.forEach((tag) => {
    const li = document.createElement('li');
    li.textContent = tag;
    patternTagsEl.appendChild(li);
  });

  patternStepsEl.innerHTML = '';
  pattern.steps.forEach((step) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = step.title;
    const span = document.createElement('span');
    span.textContent = step.detail;
    li.append(strong, span);
    patternStepsEl.appendChild(li);
  });
}

function composePattern() {
  const pattern = generatePattern();
  renderPattern(pattern);
}

function shuffleSelections() {
  const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];
  setLayout(randomLayout.id);

  const availableIds = materials.map((material) => material.id);
  const selectedCount = Math.floor(Math.random() * 3) + 1;
  selectedMaterials = [];
  while (selectedMaterials.length < selectedCount) {
    const candidate = availableIds[Math.floor(Math.random() * availableIds.length)];
    if (!selectedMaterials.includes(candidate)) {
      selectedMaterials.push(candidate);
    }
  }
  updateMaterialChipStates();

  const randomBreeze = Math.floor(Math.random() * 5) + 1;
  breezeRangeEl.value = randomBreeze;
  updateBreezeIndicator(randomBreeze);

  updateChimePreview();
  composePattern();
}

breezeRangeEl.addEventListener('input', (event) => {
  updateBreezeIndicator(Number(event.target.value));
});

composeButton.addEventListener('click', composePattern);
shuffleButton.addEventListener('click', shuffleSelections);

renderMaterialChips();
renderLayoutCards();
updateMaterialChipStates();
updateChimePreview();
updateBreezeIndicator(selectedBreeze);
composePattern();
