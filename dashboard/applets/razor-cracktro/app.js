const marqueeText = document.getElementById('marqueeText');
const starfield = document.querySelector('.cracktro__starfield');
const banners = Array.from(document.querySelectorAll('.cracktro__banner'));
const loadingBar = document.getElementById('loadingBar');
const loadingPercentage = document.getElementById('loadingPercentage');
const startButton = document.getElementById('startDemo');
const stopButton = document.getElementById('stopDemo');
const toggleScanlinesButton = document.getElementById('toggleScanlines');
const statusMessage = document.getElementById('statusMessage');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STAR_COUNT = prefersReducedMotion ? 24 : 96;
const LOADING_DURATION = prefersReducedMotion ? 2400 : 6400;

let marqueeExtended = false;
let starfieldInitialized = false;
let stars = [];
let ambientTimer = null;
let bannerTimeouts = [];
let loadingAnimationId = null;
let isRunning = false;

let audioContext = null;
let audioNodes = null;
let schedulerId = null;
let nextStepTime = 0;
let currentStepIndex = 0;
let noiseBuffer = null;

const TEMPO = prefersReducedMotion ? 96 : 132;
const STEPS_PER_BEAT = 4;
const PATTERN_LENGTH = 20; // Embrace an unexpected 5/4 feel.
const STEP_DURATION = 60 / TEMPO / STEPS_PER_BEAT;

const bassPattern = [
  40, null, null, null,
  47, null, null, null,
  52, null, null, null,
  47, null, null, null,
  45, null, null, null,
];

const chordPattern = [
  [52, 57, 61], null, null, [52, 57, 61],
  [54, 59, 63], null, [57, 61, 64], null,
  [59, 63, 66], null, null, [59, 63, 66],
  [54, 59, 63], null, [52, 57, 61], null,
  [50, 55, 59], null, null, [50, 55, 59],
];

const leadPattern = [
  null, 76, null, 74,
  null, 72, null, 74,
  null, 71, null, 74,
  null, 76, null, 79,
  null, 76, 74, null,
];

const percussionPattern = [
  'kick', 'hat', null, 'hat',
  null, 'hat', null, 'hat',
  'kick', 'hat', null, 'hat',
  'snare', 'hat', null, 'hat',
  'kick', 'hat', null, 'hat',
];

function updateStatus(message) {
  if (statusMessage) {
    statusMessage.textContent = message || '';
  }
}

function extendMarquee() {
  if (marqueeExtended || !marqueeText) {
    return;
  }
  const content = marqueeText.textContent.trim();
  marqueeText.textContent = `${content} ${content}`;
  marqueeExtended = true;
}

function createStarfield() {
  if (starfieldInitialized || !starfield) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const star = document.createElement('span');
    star.className = 'star';
    const size = (Math.random() * 2.5 + 1).toFixed(2);
    star.style.setProperty('--size', `${size}px`);
    star.style.setProperty('--delay', `${Math.random() * 6}s`);
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    fragment.appendChild(star);
    stars.push(star);
  }

  starfield.appendChild(fragment);
  starfieldInitialized = true;
}

function clearBannerTimeouts() {
  bannerTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  bannerTimeouts = [];
}

function revealBanners() {
  clearBannerTimeouts();
  banners.forEach((banner) => {
    banner.classList.remove('is-visible');
    const delay = Number(banner.dataset.delay) || 0;
    const timeoutId = setTimeout(() => {
      if (!isRunning) {
        return;
      }
      banner.classList.add('is-visible');
    }, delay);
    bannerTimeouts.push(timeoutId);
  });
}

function stopAmbientLoop() {
  if (ambientTimer) {
    clearInterval(ambientTimer);
    ambientTimer = null;
  }
}

function startAmbientLoop() {
  if (ambientTimer || stars.length === 0) {
    return;
  }

  ambientTimer = setInterval(() => {
    if (!isRunning) {
      return;
    }
    const star = stars[Math.floor(Math.random() * stars.length)];
    if (!star) {
      return;
    }
    star.classList.add('twinkle');
    setTimeout(() => star.classList.remove('twinkle'), 720);
  }, prefersReducedMotion ? 1100 : 420);
}

function animateLoadingBar(onComplete) {
  if (!loadingBar) {
    return;
  }

  if (loadingAnimationId) {
    cancelAnimationFrame(loadingAnimationId);
    loadingAnimationId = null;
  }

  loadingBar.style.width = '0%';
  loadingBar.classList.remove('is-complete');
  if (loadingPercentage) {
    loadingPercentage.textContent = '0%';
  }

  let startTime = null;

  const step = (timestamp) => {
    if (!isRunning) {
      return;
    }
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / LOADING_DURATION, 1);
    const percent = Math.floor(progress * 100);
    loadingBar.style.width = `${percent}%`;
    if (loadingPercentage) {
      loadingPercentage.textContent = `${percent}%`;
    }

    if (progress < 1) {
      loadingAnimationId = requestAnimationFrame(step);
    } else {
      loadingBar.style.width = '100%';
      loadingBar.classList.add('is-complete');
      if (loadingPercentage) {
        loadingPercentage.textContent = '100%';
      }
      loadingAnimationId = null;
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  };

  loadingAnimationId = requestAnimationFrame(step);
}

function resetScene() {
  clearBannerTimeouts();
  stopAmbientLoop();

  if (loadingAnimationId) {
    cancelAnimationFrame(loadingAnimationId);
    loadingAnimationId = null;
  }

  if (loadingBar) {
    loadingBar.style.width = '0%';
    loadingBar.classList.remove('is-complete');
  }

  if (loadingPercentage) {
    loadingPercentage.textContent = '0%';
  }

  banners.forEach((banner) => banner.classList.remove('is-visible'));
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function ensureNoiseBuffer(context) {
  if (noiseBuffer) {
    return noiseBuffer;
  }
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.35), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

function scheduleEnvelope(gainNode, time, {
  attack = 0.02,
  decay = 0.16,
  sustain = 0.4,
  release = 0.32,
  peak = 0.28,
} = {}) {
  if (!gainNode) {
    return;
  }
  const minimum = 0.0001;
  gainNode.gain.cancelScheduledValues(time);
  gainNode.gain.setValueAtTime(minimum, time);
  gainNode.gain.linearRampToValueAtTime(peak, time + attack);
  gainNode.gain.linearRampToValueAtTime(peak * sustain, time + attack + decay);
  gainNode.gain.exponentialRampToValueAtTime(minimum, time + attack + decay + release);
}

function triggerKick(context, masterGain, time) {
  const osc = context.createOscillator();
  osc.type = 'sine';
  const gain = context.createGain();
  gain.gain.value = 0;
  osc.frequency.setValueAtTime(92, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.22);
  osc.connect(gain).connect(masterGain);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.7, time + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
  osc.onended = () => {
    gain.disconnect();
  };
  osc.start(time);
  osc.stop(time + 0.5);
}

function triggerSnare(context, masterGain, time) {
  const buffer = ensureNoiseBuffer(context);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1800;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(masterGain);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.45, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  source.onended = () => {
    gain.disconnect();
    filter.disconnect();
  };
  source.start(time);
  source.stop(time + 0.32);
}

function triggerHat(context, masterGain, time) {
  const buffer = ensureNoiseBuffer(context);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 6500;
  filter.Q.value = 8;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(masterGain);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.16, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  source.onended = () => {
    gain.disconnect();
    filter.disconnect();
  };
  source.start(time);
  source.stop(time + 0.18);
}

function schedulePercussion(context, masterGain, hit, time) {
  if (hit === 'kick') {
    triggerKick(context, masterGain, time);
  } else if (hit === 'snare') {
    triggerSnare(context, masterGain, time);
  } else if (hit === 'hat') {
    triggerHat(context, masterGain, time);
  }
}

async function startAudio() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('Web Audio API not available');
  }

  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
    return;
  }

  if (audioContext) {
    return;
  }

  audioContext = new AudioContextCtor();

  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);

  const bassOsc = audioContext.createOscillator();
  bassOsc.type = 'sawtooth';
  const bassFilter = audioContext.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 180;
  const bassGain = audioContext.createGain();
  bassGain.gain.value = 0.0001;
  bassOsc.connect(bassFilter).connect(bassGain).connect(masterGain);
  bassOsc.start();

  const padOscillators = [0, 1, 2].map(() => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    return osc;
  });
  const padGain = audioContext.createGain();
  padGain.gain.value = 0.0001;
  padOscillators.forEach((osc) => {
    osc.connect(padGain);
    osc.start();
  });
  const padFilter = audioContext.createBiquadFilter();
  padFilter.type = 'bandpass';
  padFilter.frequency.value = 780;
  padFilter.Q.value = 1.2;
  padGain.connect(padFilter).connect(masterGain);

  const leadOsc = audioContext.createOscillator();
  leadOsc.type = 'triangle';
  const leadGain = audioContext.createGain();
  leadGain.gain.value = 0.0001;
  leadOsc.connect(leadGain).connect(masterGain);
  leadOsc.start();

  audioNodes = {
    masterGain,
    bassOsc,
    bassGain,
    padOscillators,
    padGain,
    leadOsc,
    leadGain,
  };

  const now = audioContext.currentTime;
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.linearRampToValueAtTime(prefersReducedMotion ? 0.2 : 0.34, now + 1.2);

  currentStepIndex = 0;
  nextStepTime = now + 0.2;

  if (schedulerId) {
    clearInterval(schedulerId);
    schedulerId = null;
  }

  const scheduleSteps = () => {
    if (!audioContext || audioContext.state === 'closed') {
      return;
    }
    while (nextStepTime < audioContext.currentTime + 0.24) {
      const step = currentStepIndex % PATTERN_LENGTH;
      const bassNote = bassPattern[step];
      if (typeof bassNote === 'number') {
        audioNodes.bassOsc.frequency.setValueAtTime(midiToFrequency(bassNote), nextStepTime);
        scheduleEnvelope(audioNodes.bassGain, nextStepTime, {
          attack: 0.01,
          decay: 0.12,
          sustain: 0.45,
          release: 0.28,
          peak: prefersReducedMotion ? 0.18 : 0.28,
        });
      }

      const chord = chordPattern[step];
      if (Array.isArray(chord) && chord.length === 3) {
        chord.forEach((midi, index) => {
          const osc = audioNodes.padOscillators[index];
          if (osc) {
            osc.frequency.setValueAtTime(midiToFrequency(midi), nextStepTime);
          }
        });
        scheduleEnvelope(audioNodes.padGain, nextStepTime, {
          attack: 0.08,
          decay: 0.2,
          sustain: 0.6,
          release: 0.72,
          peak: prefersReducedMotion ? 0.08 : 0.16,
        });
      }

      const leadNote = leadPattern[step];
      if (typeof leadNote === 'number') {
        audioNodes.leadOsc.frequency.setValueAtTime(midiToFrequency(leadNote), nextStepTime);
        scheduleEnvelope(audioNodes.leadGain, nextStepTime, {
          attack: 0.02,
          decay: 0.16,
          sustain: 0.4,
          release: 0.38,
          peak: prefersReducedMotion ? 0.1 : 0.18,
        });
      }

      const percussionHit = percussionPattern[step];
      if (percussionHit) {
        schedulePercussion(audioContext, audioNodes.masterGain, percussionHit, nextStepTime);
      }

      nextStepTime += STEP_DURATION;
      currentStepIndex += 1;
    }
  };

  schedulerId = setInterval(scheduleSteps, 45);
  scheduleSteps();
}

function stopAudio() {
  if (!audioContext) {
    return;
  }

  const context = audioContext;
  const nodes = audioNodes || {};

  if (schedulerId) {
    clearInterval(schedulerId);
    schedulerId = null;
  }

  const now = context.currentTime;
  if (nodes.masterGain) {
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
  }

  audioContext = null;
  audioNodes = null;

  setTimeout(() => {
    try {
      nodes.bassOsc?.stop();
    } catch (error) {
      // ignored
    }
    if (Array.isArray(nodes.padOscillators)) {
      nodes.padOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (error) {
          // ignored
        }
      });
    }
    try {
      nodes.leadOsc?.stop();
    } catch (error) {
      // ignored
    }
    if (context.state !== 'closed') {
      context.close();
    }
  }, 650);
}

function setRunningState(running) {
  isRunning = running;
  if (startButton) {
    startButton.disabled = running;
  }
  if (stopButton) {
    stopButton.disabled = !running;
  }
}

function startSequence() {
  if (isRunning) {
    return;
  }

  resetScene();
  setRunningState(true);
  updateStatus('Demo running... Initializing loader sequence.');

  extendMarquee();
  createStarfield();
  revealBanners();

  animateLoadingBar(() => {
    if (!isRunning) {
      return;
    }
    updateStatus('Sequence complete. Enjoy the vibes!');
    startAmbientLoop();
  });

  startAudio().catch((error) => {
    // eslint-disable-next-line no-console
    console.warn('Unable to start audio context', error);
    updateStatus('Demo running. Audio unavailable in this browser.');
  });
}

function stopSequence() {
  if (!isRunning) {
    return;
  }

  setRunningState(false);
  stopAudio();
  resetScene();
  updateStatus('Demo stopped. Hit Start to play again.');
}

function toggleScanlines() {
  if (!toggleScanlinesButton) {
    return;
  }
  const body = document.body;
  const scanlinesDisabled = body.classList.toggle('scanlines-disabled');
  toggleScanlinesButton.setAttribute('aria-pressed', scanlinesDisabled ? 'false' : 'true');
  if (!isRunning) {
    updateStatus(scanlinesDisabled ? 'Scanlines disabled.' : 'Scanlines enabled.');
    setTimeout(() => updateStatus('Press Start to launch the cracktro.'), 1500);
  }
}

function bindControls() {
  if (startButton) {
    startButton.addEventListener('click', () => {
      startSequence();
    });
  }

  if (stopButton) {
    stopButton.addEventListener('click', () => {
      stopSequence();
    });
  }

  if (toggleScanlinesButton) {
    toggleScanlinesButton.addEventListener('click', () => {
      toggleScanlines();
    });
  }
}

function init() {
  updateStatus('Press Start to launch the cracktro.');
  extendMarquee();
  createStarfield();
  bindControls();
}

document.addEventListener('DOMContentLoaded', init);
