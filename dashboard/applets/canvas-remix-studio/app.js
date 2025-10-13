const palette = [
  '#1F7A8C',
  '#FF7D00',
  '#EC9A29',
  '#12664F',
  '#F4A259',
  '#136F63',
  '#2A9D8F',
  '#FFB703',
  '#1E6091',
  '#184D47',
  '#F28482',
  '#8EC3B0'
];

const scenes = [
  {
    id: 'paper',
    name: 'Soft Paper',
    fill(ctx, canvas) {
      ctx.fillStyle = '#FEFBF4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
  {
    id: 'sunrise',
    name: 'Sunrise Fade',
    fill(ctx, canvas) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#FFE5B4');
      gradient.addColorStop(0.6, '#FFD27F');
      gradient.addColorStop(1, '#FFB570');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
  {
    id: 'aqua',
    name: 'Aqua Mist',
    fill(ctx, canvas) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#D9F4FF');
      gradient.addColorStop(0.55, '#B5E9F5');
      gradient.addColorStop(1, '#E1FFF0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  },
  {
    id: 'nocturne',
    name: 'Night Alloy',
    fill(ctx, canvas) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#E7F0FF');
      gradient.addColorStop(0.4, '#C3D9EE');
      gradient.addColorStop(1, '#9CBEDB');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
];

const statusMessages = {
  sketch: 'Sketch mode: freehand strokes respond instantly to your movement.',
  highlight: 'Highlight mode: translucent streaks layer softly over your scene.',
  line: 'Vector Line: click-drag to preview, release to drop a precise line.',
  fill: 'Canvas Fill: tap to flood the canvas with your selected color.'
};

const canvas = document.getElementById('remixCanvas');
const ctx = canvas.getContext('2d');
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

const swatchGrid = document.getElementById('swatchGrid');
const activeColorChip = document.getElementById('activeColor');
const harmonyToggle = document.getElementById('harmonyToggle');
const toolButtons = document.querySelectorAll('.tool-button');
const brushSlider = document.getElementById('brushSize');
const brushLabel = document.getElementById('brushLabel');
const activeToolLabel = document.getElementById('activeTool');
const sceneGrid = document.getElementById('sceneGrid');
const statusText = document.getElementById('statusText');
const downloadButton = document.getElementById('downloadButton');
const resetButton = document.getElementById('resetButton');

let currentColor = palette[0];
let brushSize = Number(brushSlider.value);
let currentTool = 'sketch';
let mirrorMode = false;
let isDrawing = false;
let lastPoint = null;
let lineStart = null;
let previewSnapshot = null;
let activeScene = scenes[0].id;

function initialize() {
  buildPalette();
  buildScenes();
  applyScene(activeScene, { preserve: false });
  updateActiveColor(currentColor);
  updateTool(currentTool);
  brushLabel.textContent = `${brushSize} px`;
  attachEvents();
}

function buildPalette() {
  palette.forEach((color, index) => {
    const button = document.createElement('button');
    button.className = 'swatch';
    button.style.setProperty('background', color);
    button.type = 'button';
    button.setAttribute('role', 'option');
    button.setAttribute('aria-label', `Select color ${color}`);
    button.dataset.color = color;
    button.dataset.active = index === 0 ? 'true' : 'false';
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    button.addEventListener('click', () => selectColor(color, button));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectColor(color, button);
      }
    });
    swatchGrid.appendChild(button);
  });
}

function selectColor(color, element) {
  currentColor = color;
  updateActiveColor(color);
  Array.from(swatchGrid.children).forEach((swatch) => {
    swatch.dataset.active = swatch === element ? 'true' : 'false';
    swatch.setAttribute('aria-selected', swatch === element ? 'true' : 'false');
  });
  statusText.textContent = `Color locked: ${color}`;
}

function updateActiveColor(color) {
  activeColorChip.textContent = color.toUpperCase();
  activeColorChip.style.setProperty('color', color);
  activeColorChip.style.setProperty('background', hexToTranslucent(color));
}

function hexToTranslucent(hex) {
  return `${hex}22`;
}

function buildScenes() {
  scenes.forEach((scene, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-button';
    button.textContent = scene.name;
    button.dataset.sceneId = scene.id;
    button.dataset.active = index === 0 ? 'true' : 'false';
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.addEventListener('click', () => {
      setScene(scene.id, button);
    });
    sceneGrid.appendChild(button);
  });
}

function setScene(sceneId, button) {
  activeScene = sceneId;
  applyScene(sceneId, { preserve: true });
  Array.from(sceneGrid.children).forEach((sceneButton) => {
    const isActive = sceneButton === button;
    sceneButton.dataset.active = isActive ? 'true' : 'false';
    sceneButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  statusText.textContent = `Backdrop set to ${button.textContent}.`;
}

function applyScene(sceneId, { preserve }) {
  const scene = scenes.find((item) => item.id === sceneId) ?? scenes[0];
  let overlay = null;
  if (preserve) {
    overlay = document.createElement('canvas');
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const overlayCtx = overlay.getContext('2d');
    overlayCtx.drawImage(canvas, 0, 0);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scene.fill(ctx, canvas);
  ctx.restore();
  if (overlay) {
    ctx.drawImage(overlay, 0, 0);
  }
}

function attachEvents() {
  harmonyToggle.addEventListener('change', () => {
    mirrorMode = harmonyToggle.checked;
    statusText.textContent = mirrorMode
      ? 'Mirror strokes active: strokes echo across the center line.'
      : 'Mirror strokes off: focus on a single side of the canvas.';
  });

  toolButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateTool(button.dataset.tool);
    });
  });

  brushSlider.addEventListener('input', () => {
    brushSize = Number(brushSlider.value);
    brushLabel.textContent = `${brushSize} px`;
  });

  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'canvas-remix-studio.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  resetButton.addEventListener('click', () => {
    applyScene(activeScene, { preserve: false });
    statusText.textContent = 'Canvas cleared. Fresh layer ready for new strokes.';
  });

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointerleave', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
}

function updateTool(tool) {
  currentTool = tool;
  activeToolLabel.textContent = toolLabel(tool);
  toolButtons.forEach((button) => {
    const match = button.dataset.tool === tool;
    button.setAttribute('aria-checked', match ? 'true' : 'false');
  });
  statusText.textContent = statusMessages[tool];
}

function toolLabel(tool) {
  switch (tool) {
    case 'sketch':
      return 'Sketch';
    case 'highlight':
      return 'Highlight';
    case 'line':
      return 'Vector Line';
    case 'fill':
      return 'Canvas Fill';
    default:
      return tool.charAt(0).toUpperCase() + tool.slice(1);
  }
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function handlePointerDown(event) {
  const point = getCanvasPoint(event);
  if (currentTool === 'fill') {
    floodCanvas(currentColor);
    statusText.textContent = `Canvas filled with ${currentColor}.`;
    return;
  }
  isDrawing = true;
  lastPoint = point;
  if (currentTool === 'line') {
    lineStart = point;
    previewSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } else {
    drawStroke(point, point);
  }
}

function handlePointerMove(event) {
  if (!isDrawing) {
    return;
  }
  const point = getCanvasPoint(event);
  if (currentTool === 'line') {
    restorePreview();
    drawLine(lineStart, point, { preview: true });
  } else {
    drawStroke(lastPoint, point);
    lastPoint = point;
  }
}

function handlePointerUp(event) {
  if (!isDrawing) {
    return;
  }
  if (currentTool === 'line') {
    const point = getCanvasPoint(event);
    restorePreview();
    drawLine(lineStart, point, { preview: false });
    lineStart = null;
    previewSnapshot = null;
  }
  isDrawing = false;
  lastPoint = null;
}

function restorePreview() {
  if (previewSnapshot) {
    ctx.putImageData(previewSnapshot, 0, 0);
  }
}

function drawStroke(from, to) {
  const start = from ?? to;
  const end = to;
  ctx.save();
  ctx.globalAlpha = currentTool === 'highlight' ? 0.35 : 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = brushSize;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  if (mirrorMode) {
    ctx.beginPath();
    const mirrorStart = mirrorPoint(start);
    const mirrorEnd = mirrorPoint(end);
    ctx.moveTo(mirrorStart.x, mirrorStart.y);
    ctx.lineTo(mirrorEnd.x, mirrorEnd.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLine(start, end, { preview }) {
  if (!start || !end) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = currentTool === 'highlight' ? 0.35 : 1;
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = brushSize;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  if (mirrorMode) {
    ctx.beginPath();
    const mirrorStart = mirrorPoint(start);
    const mirrorEnd = mirrorPoint(end);
    ctx.moveTo(mirrorStart.x, mirrorStart.y);
    ctx.lineTo(mirrorEnd.x, mirrorEnd.y);
    ctx.stroke();
  }
  ctx.restore();
  if (!preview) {
    statusText.textContent = `Line anchored across ${formatPoint(start)} → ${formatPoint(end)}.`;
  }
}

function mirrorPoint(point) {
  return {
    x: canvas.width - point.x,
    y: point.y
  };
}

function formatPoint(point) {
  return `${Math.round(point.x)}, ${Math.round(point.y)}`;
}

function floodCanvas(color) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

initialize();
