const profiles = [
  {
    id: 'aurora-shard',
    name: 'Aurora Shard Drift',
    caption: 'Emerald flecks from a magnet-storm winter, soft humming at dawn.',
    layers: [
      { label: 'Sky Ash', gradient: 'linear-gradient(135deg, #1b4d6b, #56cfe1)', weight: 1.1 },
      { label: 'Glass Veins', gradient: 'linear-gradient(135deg, #5dade2, #cdeefc)', weight: 0.9 },
      { label: 'Heritage Ice', gradient: 'linear-gradient(135deg, #0f3051, #1d4f73)', weight: 1.6 }
    ],
    analysis: { signal: 62, echo: 2800, risk: 18 },
    descriptors: ['ionised aurora dust', 'midnight glimmer', 'chorus-ready crystals']
  },
  {
    id: 'basalt-shelf',
    name: 'Basalt Shelf Archive',
    caption: 'Sealed under volcanic ash, warm mineral streaks ripple inside.',
    layers: [
      { label: 'Ash Sheen', gradient: 'linear-gradient(135deg, #5a5a66, #9aa0a6)', weight: 1.2 },
      { label: 'Iron Bloom', gradient: 'linear-gradient(135deg, #c97d60, #f4a259)', weight: 0.8 },
      { label: 'Deep Freeze', gradient: 'linear-gradient(135deg, #12263a, #1b3a4b)', weight: 1.4 }
    ],
    analysis: { signal: 54, echo: 4100, risk: 26 },
    descriptors: ['volcanic soot webs', 'slow thaw minerals', 'subsurface resonance']
  },
  {
    id: 'seagrass-memory',
    name: 'Seagrass Memory Column',
    caption: 'Tidal salts entwined with meadow pollen from a vanished shore.',
    layers: [
      { label: 'Salt Frost', gradient: 'linear-gradient(135deg, #95c8d8, #dff6ff)', weight: 1.0 },
      { label: 'Meadow Traces', gradient: 'linear-gradient(135deg, #8bb174, #c2d59c)', weight: 1.1 },
      { label: 'Ancient Ice', gradient: 'linear-gradient(135deg, #0b4f6c, #1b6b83)', weight: 1.3 }
    ],
    analysis: { signal: 58, echo: 3600, risk: 22 },
    descriptors: ['kelp aromatic halo', 'wind-bent pollen', 'tidal lullabies']
  }
];

const profileSelect = document.getElementById('profileSelect');
const depthInput = document.getElementById('depth');
const depthOutput = document.getElementById('depthValue');
const coreLayers = document.getElementById('coreLayers');
const profileMeta = document.getElementById('profileMeta');
const analysisTitle = document.getElementById('analysisTitleText');
const analysisDescription = document.getElementById('analysisDescription');
const signalValue = document.getElementById('signalValue');
const echoValue = document.getElementById('echoValue');
const riskValue = document.getElementById('riskValue');
const annotationInput = document.getElementById('annotation');
const pinButton = document.getElementById('pinButton');
const logList = document.getElementById('logList');

const focus = {
  strata: document.getElementById('focusStrata'),
  bubbles: document.getElementById('focusBubbles'),
  flora: document.getElementById('focusFlora')
};

let currentProfile = null;
const logEntries = [];

function init() {
  profiles.forEach((profile, index) => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.append(option);
    if (index === 0) {
      profileSelect.value = profile.id;
      setProfile(profile);
    }
  });

  renderLog();
}

function setProfile(profile) {
  currentProfile = profile;
  profileMeta.textContent = profile.caption;
  analysisTitle.textContent = profile.name;
  analysisDescription.textContent = `Highlights: ${profile.descriptors.join(' • ')}`;
  renderCore();
  updateAnalysis();
}

function renderCore() {
  coreLayers.innerHTML = '';
  if (!currentProfile) return;

  const depth = Number.parseInt(depthInput.value, 10);
  const depthFactor = (depth - 12) / (90 - 12);
  const totalWeight = currentProfile.layers.reduce((sum, layer) => sum + layer.weight, 0);

  currentProfile.layers.forEach((layer) => {
    const height = Math.max(22, (layer.weight / totalWeight) * 220 * (0.7 + depthFactor * 0.8));
    const layerElement = document.createElement('div');
    layerElement.className = 'core__layer';
    layerElement.style.height = `${height}px`;
    layerElement.style.background = buildLayerBackground(layer.gradient);
    const label = document.createElement('span');
    label.textContent = layer.label;
    layerElement.append(label);
    coreLayers.append(layerElement);
  });
}

function buildLayerBackground(baseGradient) {
  const overlays = [];
  if (focus.strata.checked) {
    overlays.push('repeating-linear-gradient(180deg, rgba(255,255,255,0.22) 0 8px, transparent 8px 16px)');
  }
  if (focus.bubbles.checked) {
    overlays.push('radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0 35%, transparent 40%)');
    overlays.push('radial-gradient(circle at 75% 60%, rgba(255,255,255,0.25) 0 30%, transparent 36%)');
  }
  if (focus.flora.checked) {
    overlays.push('linear-gradient(135deg, rgba(67,127,151,0.18), rgba(255,127,17,0.18))');
  }

  return overlays.length ? `${overlays.join(', ')}, ${baseGradient}` : baseGradient;
}

function updateAnalysis() {
  if (!currentProfile) return;
  const depth = Number.parseInt(depthInput.value, 10);
  const depthFactor = (depth - 12) / (90 - 12);

  const signal = Math.round(
    currentProfile.analysis.signal + depthFactor * 18 + (focus.strata.checked ? 4 : 0) + (focus.bubbles.checked ? 3 : 0)
  );
  const echoYears = Math.round(
    currentProfile.analysis.echo + depthFactor * 140 + (focus.flora.checked ? 85 : 0)
  );
  const risk = Math.min(
    80,
    Math.max(
      6,
      currentProfile.analysis.risk + (focus.flora.checked ? 12 : 0) - (focus.strata.checked ? 5 : 0) + (depth > 70 ? 7 : 0)
    )
  );

  signalValue.textContent = `${signal} µLumens/g`;
  echoValue.textContent = `${echoYears.toLocaleString()} yr archive`;
  riskValue.textContent = `${risk}% melt risk`;
}

function renderLog() {
  logList.innerHTML = '';
  if (logEntries.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'No pins yet. Sketch a core and pin the standouts.';
    logList.append(placeholder);
    return;
  }

  logEntries.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'log__entry';

    const header = document.createElement('header');
    header.innerHTML = `<span>${entry.profile}</span><span>${entry.depth} m</span>`;
    li.append(header);

    const body = document.createElement('p');
    body.textContent = entry.annotation || 'No annotation — mystery preserved.';
    li.append(body);

    const tags = document.createElement('p');
    tags.textContent = `Focus: ${entry.focus.length ? entry.focus.join(', ') : 'none'}`;
    li.append(tags);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const index = logEntries.findIndex((item) => item.id === entry.id);
      if (index !== -1) {
        logEntries.splice(index, 1);
        renderLog();
      }
    });
    li.append(remove);

    logList.append(li);
  });
}

profileSelect.addEventListener('change', (event) => {
  const profile = profiles.find((item) => item.id === event.target.value);
  if (profile) {
    setProfile(profile);
  }
});

depthInput.addEventListener('input', () => {
  depthOutput.value = depthInput.value;
  depthOutput.textContent = depthInput.value;
  renderCore();
  updateAnalysis();
});

Object.values(focus).forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    renderCore();
    updateAnalysis();
  });
});

pinButton.addEventListener('click', () => {
  if (!currentProfile) return;
  const annotation = annotationInput.value.trim();
  const focusList = Object.entries(focus)
    .filter(([, checkbox]) => checkbox.checked)
    .map(([key]) => key.replace(/^[a-z]/, (match) => match.toUpperCase()));

  const entry = {
    id: crypto.randomUUID(),
    profile: currentProfile.name,
    depth: Number.parseInt(depthInput.value, 10),
    focus: focusList,
    annotation
  };

  logEntries.unshift(entry);
  if (logEntries.length > 6) {
    logEntries.pop();
  }
  annotationInput.value = '';
  renderLog();
});

depthOutput.textContent = depthInput.value;
init();
