const ranges = {
  complexity: document.getElementById('complexity'),
  stability: document.getElementById('stability'),
  anomaly: document.getElementById('anomaly')
};

const outputs = {
  complexity: document.getElementById('complexityValue'),
  stability: document.getElementById('stabilityValue'),
  anomaly: document.getElementById('anomalyValue')
};

const runButton = document.getElementById('runButton');
const ribbonStack = document.getElementById('ribbonStack');
const reportSummary = document.getElementById('reportSummary');
const reportMeta = document.getElementById('reportMeta');
const bandValue = document.getElementById('bandValue');
const yieldValue = document.getElementById('yieldValue');
const driftValue = document.getElementById('driftValue');
const followUps = document.getElementById('followUps');

const anchors = {
  terrain: document.getElementById('anchorTerrain'),
  weather: document.getElementById('anchorWeather'),
  actors: document.getElementById('anchorActors')
};

let runCount = 0;
const ribbonHistory = [];

Object.entries(ranges).forEach(([key, input]) => {
  input.addEventListener('input', () => {
    outputs[key].textContent = input.value;
  });
});

runButton.addEventListener('click', () => {
  const values = Object.fromEntries(
    Object.entries(ranges).map(([key, input]) => [key, Number.parseInt(input.value, 10)])
  );

  const activeAnchors = Object.entries(anchors)
    .filter(([, checkbox]) => checkbox.checked)
    .map(([key]) => key);
  const anchorCount = activeAnchors.length;

  const stabilityScore = Math.round(values.stability * 1.1 + anchorCount * 7 - values.anomaly * 0.65);
  const fluxYield = Math.max(
    3,
    Math.round(values.complexity * 1.2 + values.anomaly * 1.35 - values.stability * 0.4 + anchorCount * 5)
  );
  const drift = Math.max(
    4,
    Math.round(100 - (values.stability * 0.9 + anchorCount * 9) + values.anomaly * 1.05)
  );

  const bandLabel = determineBand(stabilityScore);
  const summary = buildSummary(values, bandLabel, anchorCount);
  const followUpItems = buildFollowUps(values, bandLabel, activeAnchors);

  runCount += 1;
  ribbonHistory.unshift({
    id: runCount,
    values,
    bandLabel,
    fluxYield,
    drift,
    anchors: activeAnchors,
    summary
  });

  ribbonHistory.splice(0, ribbonHistory.length, ...ribbonHistory.slice(0, 5));
  renderRibbons();

  reportSummary.textContent = summary;
  reportMeta.textContent = `Run ${runCount.toString().padStart(2, '0')} · Complexity ${values.complexity} · Stability ${values.stability} · Charge ${values.anomaly}`;
  bandValue.textContent = `${bandLabel} (${stabilityScore})`;
  yieldValue.textContent = `${fluxYield} quanta`; // whimsical unit
  driftValue.textContent = `${drift}% drift risk`;

  renderFollowUps(followUpItems);
});

function determineBand(score) {
  if (score < 40) return 'Fractured band';
  if (score < 65) return 'Elastic band';
  if (score < 85) return 'Harmonic band';
  return 'Locked band';
}

function buildSummary(values, bandLabel, anchorCount) {
  const flavour = anchorCount === 0 ? 'anchorless' : `${anchorCount}-anchor`;
  const pressure = values.anomaly > 60 ? 'surging anomaly pressure' : 'contained impulses';
  const cadence = values.complexity > 70 ? 'multi-agent weave' : 'steady lane';

  return `${bandLabel} · ${flavour} run with ${pressure} and a ${cadence}.`;
}

function buildFollowUps(values, bandLabel, anchorsSelected) {
  const tips = [];

  if (values.anomaly > 55) {
    tips.push('Deploy redundancy beacons before the next pulse to soften anomaly spikes.');
  } else {
    tips.push('Document the current baseline — anomaly charge is docile enough for sampling.');
  }

  if (bandLabel === 'Fractured band') {
    tips.push('Schedule micro-sims to patch fracture seams before scaling to a full loom.');
  } else if (bandLabel === 'Elastic band') {
    tips.push('Introduce a gentle oscillation sweep to test how far the elastic band can stretch.');
  } else if (bandLabel === 'Locked band') {
    tips.push('Channel surplus stability into a reserve cell; you may need it for future turbulence.');
  }

  if (!anchorsSelected.includes('terrain')) {
    tips.push('Re-enable the terrain imprint anchor to capture elevation slipstreams.');
  }
  if (!anchorsSelected.includes('weather')) {
    tips.push('Weather signatures missing — pair a wind shear sensor before the next iteration.');
  }
  if (!anchorsSelected.includes('actors')) {
    tips.push('Consider actor memory tokens to rehearse social feedback loops.');
  }

  if (tips.length < 3) {
    tips.push('Log this run to the archive; the loom likes having a narrative trail.');
  }

  return tips.slice(0, 4);
}

function renderFollowUps(items) {
  followUps.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    followUps.append(li);
  });
}

function renderRibbons() {
  ribbonStack.innerHTML = '';
  ribbonHistory.forEach((entry) => {
    const hue = Math.max(15, Math.min(150, 160 - entry.values.stability * 0.6 + entry.values.anomaly * 0.5));
    const ribbon = document.createElement('div');
    ribbon.className = 'ribbon';
    ribbon.style.background = `linear-gradient(120deg, hsla(${hue}, 54%, 55%, 0.28), hsla(${hue + 35}, 65%, 45%, 0.18))`;

    ribbon.innerHTML = `
      <div class="ribbon__title">Run ${entry.id.toString().padStart(2, '0')}</div>
      <p class="ribbon__detail">${entry.summary}</p>
      <p class="ribbon__detail">Flux yield ${entry.fluxYield} · Drift risk ${entry.drift}%</p>
      <p class="ribbon__detail">Anchors: ${entry.anchors.length ? entry.anchors.join(', ') : 'none'}</p>
    `;

    ribbonStack.append(ribbon);
  });

  if (ribbonHistory.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'ribbon';
    placeholder.innerHTML = '<div class="ribbon__title">No runs yet</div><p class="ribbon__detail">Dial in a scenario to weave your first parallax ribbon.</p>';
    ribbonStack.append(placeholder);
  }
}

renderRibbons();
