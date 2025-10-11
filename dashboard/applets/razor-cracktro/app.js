const canvas = document.getElementById('rasterCanvas');
const ctx = canvas.getContext('2d');
const scrollTextEl = document.getElementById('scrollText');
const screen = document.querySelector('.cracktro__screen');

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const scanlineButton = document.getElementById('scanlineButton');

let animationFrameId = null;
let scrollOffset = 0;
let audioContext = null;
let synthNodes = [];
let running = false;

const barColors = ['#00e0ff', '#ff00d4', '#ffe600', '#00ff94'];

function drawRasterBars(time) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const barHeight = 18;
  for (let y = 0; y < height + barHeight; y += barHeight) {
    const t = (time / 200 + y) * 0.02;
    const amplitude = Math.sin(t) * 20;
    const offsetX = Math.cos(t * 0.7) * 30 + amplitude;

    const gradient = ctx.createLinearGradient(0, y, width, y + barHeight);
    const color = barColors[y / barHeight % barColors.length];
    gradient.addColorStop(0, '#01010f');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, '#01010f');

    ctx.save();
    ctx.translate(offsetX, 0);
    ctx.fillStyle = gradient;
    ctx.fillRect(-40, y, width + 80, barHeight);
    ctx.restore();
  }
}

function updateScrollText() {
  scrollOffset -= 2;
  if (Math.abs(scrollOffset) > scrollTextEl.scrollWidth) {
    scrollOffset = scrollTextEl.clientWidth;
  }
  scrollTextEl.style.transform = `translateX(${scrollOffset}px)`;
}

function loop(time) {
  drawRasterBars(time);
  updateScrollText();
  animationFrameId = requestAnimationFrame(loop);
}

function startDemo() {
  if (running) return;
  running = true;
  animationFrameId = requestAnimationFrame(loop);
  startAudio();
}

function stopDemo() {
  running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  stopAudio();
}

function startAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioContext.currentTime;

  const bass = audioContext.createOscillator();
  const bassGain = audioContext.createGain();
  bass.type = 'sawtooth';
  bass.frequency.setValueAtTime(55, now);
  bassGain.gain.setValueAtTime(0.1, now);
  bass.connect(bassGain).connect(audioContext.destination);
  bass.start();

  const lead = audioContext.createOscillator();
  const leadGain = audioContext.createGain();
  lead.type = 'square';
  lead.frequency.setValueAtTime(440, now);
  lead.frequency.linearRampToValueAtTime(880, now + 1.5);
  lead.frequency.linearRampToValueAtTime(440, now + 3);
  leadGain.gain.setValueAtTime(0.05, now);
  lead.connect(leadGain).connect(audioContext.destination);
  lead.start();

  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  lfo.frequency.value = 4;
  lfoGain.gain.value = 20;
  lfo.connect(lfoGain);
  lfoGain.connect(lead.frequency);
  lfo.start();

  synthNodes = [bass, lead, lfo, bassGain, leadGain, lfoGain];
}

function stopAudio() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  synthNodes.forEach((node) => {
    if (node.stop) {
      try {
        node.stop(now + 0.1);
      } catch (error) {
        console.warn('Node already stopped', error);
      }
    }
    if (node.gain) {
      node.gain.setTargetAtTime(0, now, 0.1);
    }
    if (node.disconnect) {
      node.disconnect();
    }
  });
  synthNodes = [];
}

function toggleScanlines() {
  screen.classList.toggle('cracktro__screen--scanlines');
}

startButton.addEventListener('click', startDemo);
stopButton.addEventListener('click', stopDemo);
scanlineButton.addEventListener('click', toggleScanlines);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopDemo();
  }
});
