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
let melodyInterval = null;

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

function shapeEnvelope(gainNode, now, peakLevel, releaseDuration) {
  if (!gainNode) {
    return;
  }
  const minimum = 0.0008;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(minimum, now);
  gainNode.gain.linearRampToValueAtTime(peakLevel, now + 0.08);
  gainNode.gain.exponentialRampToValueAtTime(minimum, now + releaseDuration);
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
  const bassGain = audioContext.createGain();
  bassGain.gain.value = 0.001;
  bassOsc.connect(bassGain).connect(masterGain);
  bassOsc.start();

  const leadOsc = audioContext.createOscillator();
  leadOsc.type = 'triangle';
  const leadGain = audioContext.createGain();
  leadGain.gain.value = 0.001;
  leadOsc.connect(leadGain).connect(masterGain);
  leadOsc.start();

  audioNodes = {
    masterGain,
    bassOsc,
    bassGain,
    leadOsc,
    leadGain,
  };

  const now = audioContext.currentTime;
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.linearRampToValueAtTime(0.32, now + 1.4);

  const bassPattern = [55, 55, 82.41, 55, 98, 55, 73.42, 49];
  const leadPattern = [329.63, 392, 440, 392, 329.63, 246.94, 293.66, 329.63];
  let step = 0;

  melodyInterval = setInterval(() => {
    if (!audioContext || audioContext.state === 'closed') {
      return;
    }
    const currentTime = audioContext.currentTime;
    const bassFrequency = bassPattern[step % bassPattern.length];
    const leadFrequency = leadPattern[step % leadPattern.length];
    audioNodes.bassOsc.frequency.setValueAtTime(bassFrequency, currentTime);
    audioNodes.leadOsc.frequency.setValueAtTime(leadFrequency, currentTime);
    shapeEnvelope(audioNodes.bassGain, currentTime, 0.18, 0.32);
    shapeEnvelope(audioNodes.leadGain, currentTime, 0.12, 0.4);
    step += 1;
  }, prefersReducedMotion ? 560 : 430);
}

function stopAudio() {
  if (!audioContext) {
    return;
  }

  const context = audioContext;
  const nodes = audioNodes || {};

  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
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
