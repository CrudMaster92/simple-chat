const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

const themeSelect = document.getElementById("themeSelect");
const glyphSelect = document.getElementById("glyphSelect");
const densitySlider = document.getElementById("densitySlider");
const densityValue = document.getElementById("densityValue");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const trailSlider = document.getElementById("trailSlider");
const trailValue = document.getElementById("trailValue");
const glowSlider = document.getElementById("glowSlider");
const glowValue = document.getElementById("glowValue");
const gradientToggle = document.getElementById("gradientToggle");
const pulseButton = document.getElementById("pulseButton");
const pauseButton = document.getElementById("pauseButton");
const panelToggle = document.querySelector(".panel-toggle");
const shell = document.querySelector(".matrix-shell");

const glyphSets = {
  katakana: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ".split(""),
  binary: ["0", "1"],
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""),
  emoji: "✶✦✧✩✪✫✬✭✮✯★☆✰☀☼☄☯☽".split(""),
};

const themes = {
  classic: {
    primary: "#66ff66",
    secondary: "#0aff9d",
    accent: "#001f0f",
  },
  nebula: {
    primary: "#ff6cd3",
    secondary: "#a86cff",
    accent: "#1f0031",
  },
  glacier: {
    primary: "#6ce1ff",
    secondary: "#8cffd9",
    accent: "#001a33",
  },
  ember: {
    primary: "#ffb347",
    secondary: "#ff5f6d",
    accent: "#2a0900",
  },
};

const settings = {
  glyphs: glyphSets[glyphSelect.value],
  theme: themes[themeSelect.value],
  density: densitySlider.value / 120,
  speed: speedSlider.value / 100,
  trail: trailSlider.value / 100,
  glow: Number(glowSlider.value),
  gradient: gradientToggle.checked,
};

const charSize = 18;
let columns = [];
let ripples = [];
let burstTimer = 0;
let running = true;
let displayWidth = 0;
let displayHeight = 0;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  displayWidth = rect.width;
  displayHeight = rect.height;
  canvas.width = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initColumns();
}

function initColumns() {
  const columnCount = Math.ceil(displayWidth / charSize);
  columns = new Array(columnCount)
    .fill(0)
    .map(() => Math.random() * (displayHeight + charSize));
}

function updateOutputs() {
  densityValue.textContent = densitySlider.value;
  speedValue.textContent = `${(speedSlider.value / 100).toFixed(1)}×`;
  trailValue.textContent = (trailSlider.value / 100).toFixed(2);
  glowValue.textContent = `${glowSlider.value}px`;
}

function randomGlyph() {
  const glyphs = settings.glyphs;
  return glyphs[Math.floor(Math.random() * glyphs.length)] || "";
}

function drawGradientBackdrop() {
  ctx.save();
  ctx.globalAlpha = 0.08;
  const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight);
  gradient.addColorStop(0, settings.theme.secondary);
  gradient.addColorStop(0.5, "transparent");
  gradient.addColorStop(1, settings.theme.accent);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.restore();
}

function drawRipples() {
  if (!ripples.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ripples.forEach((ripple) => {
    const gradient = ctx.createRadialGradient(
      ripple.x,
      ripple.y,
      0,
      ripple.x,
      ripple.y,
      ripple.radius
    );
    gradient.addColorStop(0, settings.theme.secondary + "aa");
    gradient.addColorStop(0.6, settings.theme.secondary + "33");
    gradient.addColorStop(1, "transparent");
    ctx.globalAlpha = ripple.alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.fill();
    ripple.radius += 4 + settings.speed * 6;
    ripple.alpha *= 0.92;
  });
  ctx.restore();
  ripples = ripples.filter((ripple) => ripple.alpha > 0.02);
}

function step() {
  if (!running) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    drawRipples();
    requestAnimationFrame(step);
    return;
  }

  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(settings.trail, 0.6)})`;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  if (settings.gradient) {
    drawGradientBackdrop();
  }

  ctx.font = `${charSize}px "Share Tech Mono", monospace`;
  ctx.textBaseline = "top";
  ctx.fillStyle = settings.theme.primary;
  ctx.shadowBlur = settings.glow;
  ctx.shadowColor = settings.theme.primary;

  const densityBoost = burstTimer > 0 ? 0.35 : 0;
  const effectiveDensity = Math.min(1, settings.density + densityBoost);

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    if (Math.random() > effectiveDensity) {
      columns[columnIndex] += charSize * settings.speed * (0.8 + Math.random() * 0.5);
      if (columns[columnIndex] > displayHeight) {
        columns[columnIndex] = -Math.random() * displayHeight * 0.2;
      }
      continue;
    }

    const x = columnIndex * charSize;
    const y = columns[columnIndex];

    const glyph = randomGlyph();
    ctx.fillStyle = Math.random() < 0.12 ? settings.theme.secondary : settings.theme.primary;
    ctx.fillText(glyph, x, y);

    columns[columnIndex] =
      y + charSize * settings.speed * (0.75 + Math.random() * 0.6 + (burstTimer > 0 ? 0.6 : 0));

    if (columns[columnIndex] > displayHeight + charSize) {
      columns[columnIndex] = -Math.random() * 200;
    }
  }

  drawRipples();

  if (burstTimer > 0) {
    burstTimer -= 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.08 + Math.random() * 0.05;
    ctx.fillStyle = settings.theme.secondary;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.restore();
  }

  requestAnimationFrame(step);
}

function createRipple(x, y) {
  const rect = canvas.getBoundingClientRect();
  const localX = ((x - rect.left) / rect.width) * displayWidth;
  const localY = ((y - rect.top) / rect.height) * displayHeight;
  ripples.push({
    x: localX,
    y: localY,
    radius: 20,
    alpha: 0.7,
  });
}

function toggleRunning() {
  running = !running;
  pauseButton.textContent = running ? "Pause flow" : "Resume flow";
  pauseButton.setAttribute("aria-pressed", String(!running));
}

function togglePanel() {
  const isHidden = shell.classList.toggle("panel-hidden");
  const label = panelToggle.querySelector(".label");
  if (label) {
    label.textContent = isHidden ? "Show controls" : "Hide controls";
  }
  panelToggle.setAttribute("aria-expanded", String(!isHidden));
}

// Event listeners
window.addEventListener("resize", resizeCanvas);
themeSelect.addEventListener("change", () => {
  settings.theme = themes[themeSelect.value];
});

glyphSelect.addEventListener("change", () => {
  settings.glyphs = glyphSets[glyphSelect.value];
});

densitySlider.addEventListener("input", () => {
  settings.density = densitySlider.value / 120;
  densityValue.textContent = densitySlider.value;
});

speedSlider.addEventListener("input", () => {
  settings.speed = speedSlider.value / 100;
  speedValue.textContent = `${(speedSlider.value / 100).toFixed(1)}×`;
});

trailSlider.addEventListener("input", () => {
  settings.trail = trailSlider.value / 100;
  trailValue.textContent = (trailSlider.value / 100).toFixed(2);
});

glowSlider.addEventListener("input", () => {
  settings.glow = Number(glowSlider.value);
  glowValue.textContent = `${glowSlider.value}px`;
});

gradientToggle.addEventListener("change", () => {
  settings.gradient = gradientToggle.checked;
});

pulseButton.addEventListener("click", () => {
  burstTimer = 180;
});

pauseButton.addEventListener("click", toggleRunning);
panelToggle.addEventListener("click", togglePanel);

canvas.addEventListener("click", (event) => {
  createRipple(event.clientX, event.clientY);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pressure > 0.2) {
    createRipple(event.clientX, event.clientY);
  }
});

// Kick-off
resizeCanvas();
updateOutputs();
requestAnimationFrame(step);
