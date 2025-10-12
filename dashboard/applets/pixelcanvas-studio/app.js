const palette = [
  '#2dd1a4',
  '#ff9d3b',
  '#f07167',
  '#f4f1de',
  '#34a0a4',
  '#1f7a8c',
  '#cb997e',
  '#e36414',
  '#0ead69',
  '#ffd166',
  '#1b9aaa',
  '#f4a259',
  '#bc4749',
  '#1d3557',
  '#a9d6e5',
  '#577590',
  '#ef8354',
  '#2ec4b6',
  '#ffbf69',
  '#adb36e',
  '#22333b',
  '#f9dcc4',
  '#4d908e',
  '#f77f00'
];

const brushSizes = [1, 2, 4, 8];

const stampPatterns = [
  {
    id: 'freehand',
    name: 'Freehand',
    pattern: null
  },
  {
    id: 'block',
    name: 'Block',
    pattern: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ]
  },
  {
    id: 'plus',
    name: 'Plus',
    pattern: [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 0],
      [1, 0]
    ]
  },
  {
    id: 'burst',
    name: 'Burst',
    pattern: [
      [0, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]
  },
  {
    id: 'diagonal',
    name: 'Slash',
    pattern: [
      [-1, -1],
      [0, 0],
      [1, 1]
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond',
    pattern: [
      [0, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1]
    ]
  }
];

const backgroundColor = '#06151f';
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, canvas.width, canvas.height);

const swatchGrid = document.getElementById('swatchGrid');
const brushGroup = document.getElementById('brushSizeGroup');
const stampGrid = document.getElementById('stampGrid');
const brushLabel = document.getElementById('brushLabel');
const colorLabel = document.getElementById('colorLabel');
const soundToggle = document.getElementById('soundToggle');
const gridToggle = document.getElementById('gridToggle');
const pixelFrame = document.getElementById('pixelFrame');
const saveButton = document.getElementById('saveButton');
const clearButton = document.getElementById('clearButton');
const fillButton = document.getElementById('fillButton');
const undoButton = document.getElementById('undoButton');
const eraseButton = document.getElementById('eraseButton');

let currentColor = palette[0];
let currentBrush = brushSizes[0];
let activeStamp = null;
let lastStampButton = null;
let isDrawing = false;
let isErasing = false;
let soundEnabled = false;
let audioCtx = null;
let undoStack = [];
let lastBlipTime = 0;
const MAX_UNDOS = 25;

function createButton({ element, label, onClick }) {
  element.type = 'button';
  element.setAttribute('aria-label', label);
  element.addEventListener('click', onClick);
  return element;
}

function setActiveState(collection, target, attribute = 'aria-checked') {
  collection.forEach((item) => {
    if (item === target) {
      item.dataset.active = 'true';
      item.setAttribute(attribute, 'true');
    } else {
      item.dataset.active = 'false';
      item.setAttribute(attribute, 'false');
    }
  });
}

function updateLabels() {
  brushLabel.textContent = `Brush: ${currentBrush}x`;
  colorLabel.textContent = isErasing ? 'Eraser' : `Color: ${currentColor.toUpperCase()}`;
}

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  audioCtx = new Context();
  return audioCtx;
}

function playBlip() {
  if (!soundEnabled) return;
  const nowMs = performance.now();
  if (nowMs - lastBlipTime < 80) {
    return;
  }
  lastBlipTime = nowMs;
  const context = ensureAudio();
  if (!context) return;
  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(320 + Math.random() * 160, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

function pushUndo() {
  try {
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDOS) {
      undoStack.shift();
    }
  } catch (error) {
    console.error('Undo capture failed', error);
  }
}

function restoreUndo() {
  const snapshot = undoStack.pop();
  if (snapshot) {
    ctx.putImageData(snapshot, 0, 0);
  }
}

function setColor(color, swatchButton) {
  currentColor = color;
  isErasing = false;
  eraseButton.dataset.active = 'false';
  const swatches = Array.from(swatchGrid.querySelectorAll('.swatch'));
  setActiveState(swatches, swatchButton, 'aria-selected');
  updateLabels();
}

function setBrush(size, brushButton) {
  currentBrush = size;
  const brushes = Array.from(brushGroup.querySelectorAll('.brush-button'));
  setActiveState(brushes, brushButton);
  updateLabels();
}

function setStamp(pattern, stampButton) {
  activeStamp = pattern;
  const stampButtons = Array.from(stampGrid.querySelectorAll('.stamp-button'));
  setActiveState(stampButtons, stampButton);
  eraseButton.dataset.active = 'false';
  if (pattern === null) {
    activeStamp = null;
  }
  lastStampButton = stampButton;
}

function toggleEraser() {
  const newState = eraseButton.dataset.active !== 'true';
  eraseButton.dataset.active = newState ? 'true' : 'false';
  isErasing = newState;
  if (newState) {
    const stampButtons = Array.from(stampGrid.querySelectorAll('.stamp-button'));
    stampButtons.forEach((btn) => {
      btn.dataset.active = 'false';
      btn.setAttribute('aria-checked', 'false');
    });
    activeStamp = null;
  }
  if (!newState) {
    const target = lastStampButton || stampGrid.querySelector('.stamp-button');
    if (target) {
      const stampId = target.dataset.stampId;
      const patternEntry = stampPatterns.find((item) => item.id === stampId);
      setStamp(patternEntry ? patternEntry.pattern : null, target);
    }
  }
  updateLabels();
}

function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);
  return { x, y };
}

function drawBrush(x, y) {
  const half = Math.floor(currentBrush / 2);
  const color = isErasing ? backgroundColor : currentColor;
  ctx.fillStyle = color;
  const startX = Math.max(0, x - half);
  const startY = Math.max(0, y - half);
  const width = Math.min(currentBrush, canvas.width - startX);
  const height = Math.min(currentBrush, canvas.height - startY);
  ctx.fillRect(startX, startY, width, height);
}

function drawStamp(x, y) {
  const color = isErasing ? backgroundColor : currentColor;
  ctx.fillStyle = color;
  activeStamp.forEach(([dx, dy]) => {
    const px = x + dx;
    const py = y + dy;
    if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
      ctx.fillRect(px, py, 1, 1);
    }
  });
}

function handleDraw(event, isPointerMove = false) {
  if (!isDrawing && !isPointerMove) {
    pushUndo();
  }
  isDrawing = true;
  const { x, y } = getCanvasCoordinates(event);
  if (activeStamp && !isPointerMove) {
    drawStamp(x, y);
    playBlip();
  } else {
    drawBrush(x, y);
    playBlip();
  }
}

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  handleDraw(event, false);
});

canvas.addEventListener('pointermove', (event) => {
  if (!isDrawing) return;
  handleDraw(event, true);
});

function endDrawing(event) {
  if (!isDrawing) return;
  isDrawing = false;
  if (event && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener('pointerup', endDrawing);
canvas.addEventListener('pointercancel', endDrawing);
canvas.addEventListener('pointerleave', () => {
  isDrawing = false;
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'z' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    restoreUndo();
  }
});

saveButton.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'pixelcanvas-studio.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

clearButton.addEventListener('click', () => {
  pushUndo();
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

fillButton.addEventListener('click', () => {
  pushUndo();
  const color = isErasing ? backgroundColor : currentColor;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

undoButton.addEventListener('click', restoreUndo);

eraseButton.addEventListener('click', toggleEraser);

soundToggle.addEventListener('change', () => {
  soundEnabled = soundToggle.checked;
  if (soundEnabled) {
    ensureAudio();
  }
});

gridToggle.addEventListener('change', () => {
  if (gridToggle.checked) {
    pixelFrame.classList.remove('grid-off');
  } else {
    pixelFrame.classList.add('grid-off');
  }
});

function buildSwatches() {
  palette.forEach((color, index) => {
    const button = document.createElement('button');
    button.className = 'swatch';
    button.style.setProperty('background', color);
    button.setAttribute('role', 'option');
    button.dataset.active = index === 0 ? 'true' : 'false';
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    createButton({
      element: button,
      label: `Select color ${color}`,
      onClick: () => setColor(color, button)
    });
    swatchGrid.appendChild(button);
  });
}

function buildBrushButtons() {
  brushSizes.forEach((size, index) => {
    const button = document.createElement('button');
    button.className = 'brush-button';
    button.dataset.active = index === 0 ? 'true' : 'false';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
    button.textContent = `${size}x`;
    createButton({
      element: button,
      label: `Set brush size ${size}`,
      onClick: () => setBrush(size, button)
    });
    brushGroup.appendChild(button);
  });
}

function buildStampButtons() {
  stampPatterns.forEach(({ id, name, pattern }, index) => {
    const button = document.createElement('button');
    button.className = 'stamp-button';
    button.dataset.active = index === 0 ? 'true' : 'false';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
    button.dataset.stampId = id;
    button.innerHTML = `<span class="stamp-icon" aria-hidden="true">${createStampPreview(
      pattern
    )}</span><span>${name}</span>`;
    createButton({
      element: button,
      label: `Use ${name} stamp`,
      onClick: () => {
        setStamp(pattern, button);
      }
    });
    stampGrid.appendChild(button);
    if (index === 0) {
      lastStampButton = button;
    }
  });
}

function createStampPreview(pattern) {
  if (!pattern) {
    return '<span>···</span>';
  }
  const size = 6;
  const preview = Array.from({ length: size }, () => Array(size).fill('&nbsp;'));
  const offset = Math.floor(size / 2);
  pattern.forEach(([x, y]) => {
    const px = x + offset;
    const py = y + offset;
    if (px >= 0 && px < size && py >= 0 && py < size) {
      preview[py][px] = '■';
    }
  });
  return preview
    .map((row) => `<span>${row.join('')}</span>`)
    .join('');
}

function setup() {
  buildSwatches();
  buildBrushButtons();
  buildStampButtons();
  updateLabels();
}

setup();
