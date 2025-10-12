const stepCount = 12;
const crystals = new Map();
const baseFrequencies = {
  amethyst: 220,
  citrine: 330,
  obsidian: 110,
};

const defaultPatterns = {
  amethyst: [0, 3, 6, 9],
  citrine: [1, 4, 7, 10],
  obsidian: [0, 6],
};

const scaleOffsets = [0, 2, 5, 7, 9, 12, 14, 17, 19, 21, 24, 26];

let audioCtx;
let masterGain;
let reverbInput;
let reverbDelay;
let feedbackGain;
let reverbWet;
let stepTimer = null;
let currentStep = -1;
let tempo = 96;
let isPlaying = false;

function ensureAudio() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(audioCtx.destination);

  reverbInput = audioCtx.createGain();
  reverbDelay = audioCtx.createDelay(0.7);
  reverbDelay.delayTime.value = 0.34;
  feedbackGain = audioCtx.createGain();
  feedbackGain.gain.value = 0.35;
  reverbWet = audioCtx.createGain();
  reverbWet.gain.value = 0.45;

  reverbInput.connect(reverbDelay);
  reverbDelay.connect(feedbackGain);
  feedbackGain.connect(reverbDelay);
  reverbDelay.connect(reverbWet);
  reverbWet.connect(masterGain);
}

function buildSteps(crystalEl, slug) {
  const stepsContainer = crystalEl.querySelector('.steps');
  const stepStates = [];
  const pattern = new Set(defaultPatterns[slug] ?? []);

  for (let i = 0; i < stepCount; i += 1) {
    const stepButton = document.createElement('button');
    stepButton.type = 'button';
    stepButton.className = 'step';
    stepButton.textContent = String(i + 1).padStart(2, '0');
    stepButton.dataset.step = i;
    stepButton.setAttribute('role', 'gridcell');
    stepButton.setAttribute('aria-pressed', pattern.has(i) ? 'true' : 'false');
    stepButton.setAttribute('aria-label', `Toggle step ${i + 1}`);

    const active = pattern.has(i);
    if (active) {
      stepButton.classList.add('is-seeded');
    }

    stepStates.push({ button: stepButton, active });

    stepButton.addEventListener('click', () => {
      const newState = !stepStates[i].active;
      stepStates[i].active = newState;
      stepButton.setAttribute('aria-pressed', newState ? 'true' : 'false');
      if (!newState) {
        stepButton.classList.remove('is-seeded');
      }
    });

    stepsContainer.appendChild(stepButton);
  }

  const pitchControl = crystalEl.querySelector('[data-role="pitch"]');
  const glowControl = crystalEl.querySelector('[data-role="glow"]');

  const crystalData = {
    slug,
    element: crystalEl,
    steps: stepStates,
    pitchControl,
    glowControl,
  };

  updateGlowLevel(crystalData, parseFloat(glowControl.value));

  glowControl.addEventListener('input', (event) => {
    updateGlowLevel(crystalData, parseFloat(event.target.value));
  });

  crystalEl.addEventListener('pointermove', (event) => {
    const bounds = crystalEl.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    crystalEl.style.setProperty('--spark-x', `${x}%`);
    crystalEl.style.setProperty('--spark-y', `${y}%`);
  });

  crystals.set(slug, crystalData);
}

function updateGlowLevel(crystalData, rawValue) {
  const normalized = Math.min(Math.max(rawValue / 100, 0.1), 1);
  crystalData.element.style.setProperty('--glow-level', normalized.toFixed(2));
}

function toggleTransportState() {
  const playButton = document.getElementById('playToggle');
  const isActive = !isPlaying;

  if (isActive) {
    startLoop();
    playButton.setAttribute('aria-pressed', 'true');
    playButton.querySelector('.transport__icon').textContent = '⏸';
    playButton.querySelector('.transport__label').textContent = 'Pause Resonance';
  } else {
    stopLoop();
    playButton.setAttribute('aria-pressed', 'false');
    playButton.querySelector('.transport__icon').textContent = '▶';
    playButton.querySelector('.transport__label').textContent = 'Begin Resonance';
  }
}

function startLoop() {
  ensureAudio();
  audioCtx.resume();
  isPlaying = true;
  scheduleSteps();
}

function stopLoop() {
  isPlaying = false;
  if (stepTimer) {
    window.clearInterval(stepTimer);
    stepTimer = null;
  }
  currentStep = -1;
  crystals.forEach(({ steps }) => {
    steps.forEach(({ button }) => button.classList.remove('is-active'));
  });
}

function scheduleSteps() {
  if (stepTimer) {
    window.clearInterval(stepTimer);
  }

  const interval = (60000 / tempo) / 3;

  stepTimer = window.setInterval(() => {
    currentStep = (currentStep + 1) % stepCount;
    crystals.forEach((crystalData) => {
      const { steps } = crystalData;
      steps.forEach(({ button }, index) => {
        button.classList.toggle('is-active', index === currentStep);
      });
      const stepInfo = steps[currentStep];
      if (stepInfo && stepInfo.active) {
        triggerCrystal(crystalData, currentStep);
      }
    });
  }, interval);
}

function triggerCrystal(crystalData, stepIndex) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const { slug, pitchControl, glowControl, element } = crystalData;
  const baseFreq = baseFrequencies[slug] || 220;
  const pitchOffset = parseInt(pitchControl.value, 10) || 0;
  const interval = scaleOffsets[stepIndex % scaleOffsets.length] + pitchOffset;
  const freq = baseFreq * 2 ** (interval / 12);

  const osc = audioCtx.createOscillator();
  osc.type = slug === 'obsidian' ? 'sawtooth' : slug === 'citrine' ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  const noteGain = audioCtx.createGain();
  const release = slug === 'obsidian' ? 0.9 : 0.55;
  const maxGain = slug === 'obsidian' ? 0.22 : slug === 'citrine' ? 0.17 : 0.2;
  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.linearRampToValueAtTime(maxGain, now + 0.02);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + release);

  osc.connect(noteGain);
  noteGain.connect(masterGain);
  noteGain.connect(reverbInput);

  osc.start(now);
  osc.stop(now + release + 0.05);

  shimmerGlow(element, glowControl.value);
}

function shimmerGlow(element, glowValue) {
  element.style.setProperty('--spark-x', `${Math.random() * 100}%`);
  element.style.setProperty('--spark-y', `${Math.random() * 80 + 10}%`);
  const normalized = Math.min(Math.max(glowValue / 100, 0.1), 1);
  element.style.setProperty('--pulse-boost', normalized.toFixed(2));
  element.classList.add('is-shimmering');
  window.setTimeout(() => {
    element.classList.remove('is-shimmering');
    element.style.removeProperty('--pulse-boost');
  }, 280);
}

function clearPatterns() {
  crystals.forEach(({ steps }) => {
    steps.forEach((stepState) => {
      stepState.active = false;
      stepState.button.setAttribute('aria-pressed', 'false');
      stepState.button.classList.remove('is-seeded');
      stepState.button.classList.remove('is-active');
    });
  });
}

function setupTransportControls() {
  const playButton = document.getElementById('playToggle');
  const clearButton = document.getElementById('clearPatterns');
  const tempoControl = document.getElementById('tempoControl');
  const tempoValue = document.getElementById('tempoValue');
  const echoControl = document.getElementById('echoControl');
  const echoValue = document.getElementById('echoValue');
  const lumenControl = document.getElementById('lumenControl');
  const lumenValue = document.getElementById('lumenValue');

  playButton.addEventListener('click', toggleTransportState);
  clearButton.addEventListener('click', clearPatterns);

  tempo = parseInt(tempoControl.value, 10);
  tempoValue.textContent = `${tempo} BPM`;
  tempoControl.addEventListener('input', (event) => {
    tempo = parseInt(event.target.value, 10);
    tempoValue.textContent = `${tempo} BPM`;
    if (isPlaying) {
      scheduleSteps();
    }
  });

  echoValue.textContent = `${echoControl.value}%`;
  echoControl.addEventListener('input', (event) => {
    const value = parseInt(event.target.value, 10);
    echoValue.textContent = `${value}%`;
    const normalized = value / 100;
    if (feedbackGain) {
      feedbackGain.gain.value = 0.18 + normalized * 0.55;
    }
    if (reverbWet) {
      reverbWet.gain.value = 0.25 + normalized * 0.6;
    }
  });

  const lumenStart = parseInt(lumenControl.value, 10);
  lumenValue.textContent = `${lumenStart}%`;
  document.documentElement.style.setProperty('--lumen-factor', (lumenStart / 100).toFixed(2));
  lumenControl.addEventListener('input', (event) => {
    const value = parseInt(event.target.value, 10);
    const normalized = value / 100;
    lumenValue.textContent = `${value}%`;
    document.documentElement.style.setProperty('--lumen-factor', normalized.toFixed(2));
  });
}

function setupReflectionPanel() {
  const chips = Array.from(document.querySelectorAll('.reflection__chip'));
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const hue = parseInt(chip.dataset.hue, 10) || 210;
      document.documentElement.style.setProperty('--beam-hue', hue);
    });
  });

  const firstHue = parseInt(chips[0].dataset.hue, 10) || 210;
  chips[0].classList.add('is-active');
  document.documentElement.style.setProperty('--beam-hue', firstHue);
}

function init() {
  document.querySelectorAll('.crystal').forEach((crystalEl) => {
    const slug = crystalEl.dataset.crystal;
    buildSteps(crystalEl, slug);
  });

  setupTransportControls();
  setupReflectionPanel();
}

document.addEventListener('DOMContentLoaded', init);
