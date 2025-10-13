const modules = [
  createOrbitHopModule(),
  createGlitchGardenModule()
];

const canvas = document.getElementById('emulatorScreen');
const ctx = canvas.getContext('2d');

const moduleListEl = document.getElementById('moduleList');
const infoNameEl = document.getElementById('infoName');
const infoDescriptionEl = document.getElementById('infoDescription');
const infoControlsEl = document.getElementById('infoControls');
const moduleTitleEl = document.getElementById('moduleTitle');
const moduleStatusEl = document.getElementById('moduleStatus');

const powerButton = document.getElementById('powerButton');
const resetButton = document.getElementById('resetButton');

let emulatorOn = false;
let currentModule = null;
let gameState = null;
let lastTimestamp = 0;
const keysDown = new Set();

modules.forEach((module) => {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'module-tile';
  tile.setAttribute('role', 'listitem');
  tile.dataset.moduleId = module.id;
  tile.innerHTML = `
    <span class="module-tile__slug">${module.cartridge}</span>
    <span class="module-tile__name">${module.name}</span>
    <span class="module-tile__tagline">${module.tagline}</span>
  `;
  tile.addEventListener('click', () => selectModule(module.id));
  module.tile = tile;
  moduleListEl.appendChild(tile);
});

if (modules.length) {
  selectModule(modules[0].id);
}

powerButton.addEventListener('click', () => {
  emulatorOn = !emulatorOn;
  powerButton.textContent = emulatorOn ? 'Power Off' : 'Power On';
  if (emulatorOn) {
    keysDown.clear();
    if (currentModule) {
      bootModule();
    } else {
      setModuleTitle('Awaiting Cartridge');
      setModuleStatus('Select a cartridge to boot the dev kit.');
    }
  } else {
    if (currentModule && typeof currentModule.onPowerOff === 'function') {
      currentModule.onPowerOff(gameState, sharedContext());
    }
    gameState = null;
    keysDown.clear();
    setModuleTitle('Power Down');
    setModuleStatus('Systems offline. Flip the power to resume testing.');
  }
  updateResetState();
});

resetButton.addEventListener('click', () => {
  if (!emulatorOn || !currentModule) return;
  bootModule(true);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
  keysDown.add(key);
  if (emulatorOn && currentModule && typeof currentModule.onKeyDown === 'function') {
    currentModule.onKeyDown(gameState, key, sharedContext());
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keysDown.delete(key);
  if (emulatorOn && currentModule && typeof currentModule.onKeyUp === 'function') {
    currentModule.onKeyUp(gameState, key, sharedContext());
  }
});

function selectModule(moduleId) {
  const selected = modules.find((module) => module.id === moduleId);
  if (!selected) return;

  if (currentModule && currentModule.tile) {
    currentModule.tile.classList.remove('is-selected');
  }

  selected.tile.classList.add('is-selected');
  currentModule = selected;
  infoNameEl.textContent = selected.name;
  infoDescriptionEl.textContent = selected.description;
  renderControlList(selected.controls);

  if (emulatorOn) {
    bootModule();
  } else {
    setModuleTitle(selected.name);
    setModuleStatus('Power on to boot this cartridge.');
  }

  updateResetState();
}

function bootModule(fromReset = false) {
  if (!currentModule) return;
  gameState = currentModule.init(sharedContext());
  if (fromReset) {
    setModuleStatus('Module reset. Systems recalibrated.');
  }
}

function renderControlList(controls) {
  infoControlsEl.innerHTML = '';
  controls.forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    infoControlsEl.appendChild(item);
  });
}

function setModuleTitle(text) {
  moduleTitleEl.textContent = text;
}

function setModuleStatus(text) {
  moduleStatusEl.textContent = text;
}

function updateResetState() {
  resetButton.disabled = !emulatorOn || !currentModule;
}

function sharedContext() {
  return {
    width: canvas.width,
    height: canvas.height,
    setStatus: setModuleStatus,
    setTitle: setModuleTitle
  };
}

function renderIdle(timestamp) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#03111b');
  gradient.addColorStop(1, '#01080f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 70; i += 1) {
    const x = (Math.sin(timestamp * 0.002 + i) + 1) * 0.5 * width;
    const y = (Math.cos(timestamp * 0.003 + i * 1.2) + 1) * 0.5 * height;
    ctx.fillStyle = 'rgba(47, 245, 199, 0.4)';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(47, 245, 199, 0.35)';
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillText('Nebula Gear Dev Shell // Standby', 20, height - 18);
}

function loop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (emulatorOn && currentModule && gameState) {
    currentModule.update(gameState, {
      ...sharedContext(),
      dt: delta,
      keysDown
    });
    currentModule.render(ctx, gameState, {
      ...sharedContext()
    });
  } else {
    renderIdle(timestamp);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function createOrbitHopModule() {
  function spawnOrb(state, width, height) {
    const margin = 26;
    state.orbs.push({
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2),
      pulse: Math.random() * Math.PI * 2
    });
  }

  return {
    id: 'orbit-hop',
    cartridge: 'ROM-A1',
    name: 'Orbit Hop Prototype',
    tagline: 'Feather thrusters to scoop luminous drift seeds before the clock zeros out.',
    description:
      'Guide an agile capsule through a containment dome, chaining drift seed pickups to trigger experimental thruster boosts.',
    controls: [
      'Arrow keys / WASD — steer the capsule with gentle thrusters',
      'Space — vent stored combo energy for a brief surge (combo x3+)',
      'Collect 15 drift seeds before the timer collapses.'
    ],
    init(context) {
      const { width, height, setStatus, setTitle } = context;
      const state = {
        player: { x: width / 2, y: height / 2, vx: 0, vy: 0 },
        speed: 145,
        damping: 0.88,
        orbs: [],
        score: 0,
        combo: 0,
        comboTimer: 0,
        timer: 62,
        flash: 0,
        isRunning: true
      };
      state.orbs.length = 0;
      for (let i = 0; i < 5; i += 1) {
        spawnOrb(state, width, height);
      }
      setTitle('Orbit Hop Prototype');
      setStatus('Collect 15 drift seeds before the timer depletes. Maintain combos to unlock thruster surges.');
      return state;
    },
    update(state, helpers) {
      if (!state.isRunning) return;
      const { dt, keysDown, width, height, setStatus } = helpers;

      state.timer = Math.max(0, state.timer - dt);
      if (state.timer === 0) {
        state.isRunning = false;
        setStatus(`Time! Drift seeds stabilized: ${state.score}. Reset for another run.`);
        return;
      }

      const player = state.player;
      const acceleration = state.speed;
      if (keysDown.has('arrowup') || keysDown.has('w')) player.vy -= acceleration * dt;
      if (keysDown.has('arrowdown') || keysDown.has('s')) player.vy += acceleration * dt;
      if (keysDown.has('arrowleft') || keysDown.has('a')) player.vx -= acceleration * dt;
      if (keysDown.has('arrowright') || keysDown.has('d')) player.vx += acceleration * dt;

      if (keysDown.has(' ') && state.combo >= 3 && state.comboTimer > 0) {
        player.vx *= 1 + 0.6 * dt * (state.combo * 0.15);
        player.vy *= 1 + 0.6 * dt * (state.combo * 0.15);
        state.flash = 1;
      }

      player.vx *= state.damping;
      player.vy *= state.damping;

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      const radius = 14;
      if (player.x < radius) {
        player.x = radius;
        player.vx *= -0.4;
      }
      if (player.x > width - radius) {
        player.x = width - radius;
        player.vx *= -0.4;
      }
      if (player.y < radius) {
        player.y = radius;
        player.vy *= -0.4;
      }
      if (player.y > height - radius) {
        player.y = height - radius;
        player.vy *= -0.4;
      }

      for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
        const orb = state.orbs[i];
        orb.pulse = (orb.pulse + dt * 2) % (Math.PI * 2);
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < radius + 6) {
          state.orbs.splice(i, 1);
          spawnOrb(state, width, height);
          state.score += 1;
          state.combo += 1;
          state.comboTimer = 3.2;
          state.flash = 1;
          if (state.score >= 15) {
            state.isRunning = false;
            setStatus(`Prototype cleared! ${state.score} drift seeds stabilized with ${Math.round(state.timer)}s left.`);
          } else {
            setStatus(`Combo x${state.combo}. Drift seeds stabilized: ${state.score}/15.`);
          }
        }
      }

      if (state.comboTimer > 0) {
        state.comboTimer = Math.max(0, state.comboTimer - dt);
        if (state.comboTimer === 0) {
          state.combo = 0;
        }
      }

      if (state.flash > 0) {
        state.flash = Math.max(0, state.flash - dt * 2.4);
      }
    },
    render(ctx, state, helpers) {
      const { width, height } = helpers;
      ctx.clearRect(0, 0, width, height);

      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#042033');
      background.addColorStop(1, '#013247');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(47, 245, 199, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, width - 16, height - 16);

      ctx.fillStyle = 'rgba(47, 245, 199, 0.12)';
      ctx.fillRect(12, 12, width - 24, height - 24);

      state.orbs.forEach((orb) => {
        const glow = 7 + Math.sin(orb.pulse) * 3;
        const orbGradient = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, glow);
        orbGradient.addColorStop(0, '#7efff0');
        orbGradient.addColorStop(1, 'rgba(126, 255, 240, 0)');
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2ff5c7';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      const { player } = state;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(Math.atan2(player.vy, player.vx) + Math.PI / 2);

      const glowRadius = 16 + state.flash * 24;
      const shipGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, glowRadius);
      shipGlow.addColorStop(0, 'rgba(47, 245, 199, 0.55)');
      shipGlow.addColorStop(1, 'rgba(47, 245, 199, 0)');
      ctx.fillStyle = shipGlow;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0b1821';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#2ff5c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(12, height - 48, width - 24, 36);

      ctx.fillStyle = '#2ff5c7';
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillText(`Seeds: ${state.score}`, 20, height - 26);
      ctx.fillText(`Combo: x${state.combo}`, width / 2 - 50, height - 26);
      ctx.fillText(`Time: ${Math.ceil(state.timer)}s`, width - 140, height - 26);

      if (!state.isRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, height / 2 - 30, width, 60);
        ctx.fillStyle = '#ffb44b';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const message = state.score >= 15 ? 'Prototype Cleared!' : 'Containment Failed';
        ctx.fillText(message, width / 2, height / 2 + 6);
        ctx.textAlign = 'left';
      }
    },
    onPowerOff(state) {
      if (state) {
        state.isRunning = false;
      }
    }
  };
}

function createGlitchGardenModule() {
  function spawnGlitch(state) {
    const available = [];
    state.cells.forEach((cell, index) => {
      if (cell.state !== 'glitch') {
        available.push(index);
      }
    });
    if (!available.length) return;
    const index = available[Math.floor(Math.random() * available.length)];
    const cell = state.cells[index];
    if (cell.state === 'glitch') return;
    cell.state = 'glitch';
    cell.cooldown = 0;
    state.glitchCount += 1;
  }

  return {
    id: 'glitch-garden',
    cartridge: 'ROM-B2',
    name: 'Glitch Garden Debugger',
    tagline: 'Sweep a circuit garden and neutralize rogue blooms before stability collapses.',
    description:
      'Traverse a luminous horticulture grid where glitches sprout like weeds. Patch anomalies, deploy damping fields, and keep the wave counter calm.',
    controls: [
      'Arrow keys / WASD — move the inspection cursor',
      'Space or Enter — patch the selected glitch tile',
      'G — deploy a temporary damping field (10s cooldown)'
    ],
    init(context) {
      const { setStatus, setTitle } = context;
      const size = 6;
      const cells = Array.from({ length: size * size }, () => ({ state: 'stable', cooldown: 0 }));
      const state = {
        gridSize: size,
        cells,
        cursor: { x: Math.floor(size / 2), y: Math.floor(size / 2) },
        timer: 75,
        spawnTimer: 0,
        spawnInterval: 1.4,
        glitchCount: 0,
        score: 0,
        isRunning: true,
        fieldCooldown: 0
      };
      for (let i = 0; i < 4; i += 1) {
        spawnGlitch(state);
      }
      setTitle('Glitch Garden Debugger');
      setStatus('Contain rogue blooms before stability collapses. Space patches a glitch, G deploys a damping field.');
      return state;
    },
    update(state, helpers) {
      const { dt, setStatus } = helpers;
      if (!state.isRunning) return;

      state.timer = Math.max(0, state.timer - dt);
      state.spawnTimer += dt;
      if (state.fieldCooldown > 0) {
        state.fieldCooldown = Math.max(0, state.fieldCooldown - dt);
      }

      state.cells.forEach((cell) => {
        if (cell.state === 'cooldown') {
          cell.cooldown = Math.max(0, cell.cooldown - dt);
          if (cell.cooldown === 0) {
            cell.state = 'stable';
          }
        }
      });

      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        spawnGlitch(state);
        if (state.spawnInterval > 0.6) {
          state.spawnInterval -= 0.02;
        }
        if (state.glitchCount >= 12) {
          state.isRunning = false;
          setStatus('Garden overloaded! Too many glitches active. Reset to recalibrate.');
        }
      }

      if (state.timer === 0 && state.isRunning) {
        state.isRunning = false;
        setStatus(`Garden stabilized! ${state.score} glitches patched.`);
      }
    },
    render(ctx, state, helpers) {
      const { width, height } = helpers;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#02121d';
      ctx.fillRect(0, 0, width, height);

      const gridPadding = 36;
      const gridSize = state.gridSize;
      const gridWidth = width - gridPadding * 2;
      const cellSize = gridWidth / gridSize;
      const startX = gridPadding;
      const startY = (height - gridWidth) / 2;

      ctx.strokeStyle = 'rgba(47, 245, 199, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX - 8, startY - 8, gridWidth + 16, gridWidth + 16);

      state.cells.forEach((cell, index) => {
        const x = index % gridSize;
        const y = Math.floor(index / gridSize);
        const px = startX + x * cellSize;
        const py = startY + y * cellSize;
        let fill = 'rgba(11, 48, 61, 0.9)';
        if (cell.state === 'glitch') {
          fill = '#ffb44b';
        } else if (cell.state === 'cooldown') {
          fill = 'rgba(47, 245, 199, 0.35)';
        }
        ctx.fillStyle = fill;
        ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);

        if (cell.state === 'glitch') {
          ctx.fillStyle = 'rgba(255, 230, 160, 0.8)';
          ctx.beginPath();
          const pulse = 4 + Math.sin(Date.now() / 230 + index) * 2;
          ctx.arc(px + cellSize / 2, py + cellSize / 2, Math.min(cellSize / 2.6, pulse + cellSize * 0.1), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const cursorX = startX + state.cursor.x * cellSize;
      const cursorY = startY + state.cursor.y * cellSize;
      ctx.strokeStyle = state.fieldCooldown > 0 ? 'rgba(255, 180, 75, 0.8)' : '#2ff5c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(cursorX + 1.5, cursorY + 1.5, cellSize - 3, cellSize - 3);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(12, 12, width - 24, 44);
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#2ff5c7';
      ctx.fillText(`Stability: ${Math.ceil(state.timer)}s`, 20, 38);
      ctx.fillText(`Patched: ${state.score}`, width / 2 - 60, 38);
      ctx.fillText(`Glitches: ${state.glitchCount}`, width - 170, 38);

      if (!state.isRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, height / 2 - 30, width, 60);
        ctx.fillStyle = state.timer === 0 ? '#2ff5c7' : '#ffb44b';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const message = state.timer === 0 ? 'Garden Stabilized!' : 'Containment Breached';
        ctx.fillText(message, width / 2, height / 2 + 6);
        ctx.textAlign = 'left';
      }
    },
    onKeyDown(state, key, helpers) {
      if (!state || !state.isRunning) return;
      const { setStatus } = helpers;
      const size = state.gridSize;
      if (key === 'arrowup' || key === 'w') {
        state.cursor.y = (state.cursor.y + size - 1) % size;
      } else if (key === 'arrowdown' || key === 's') {
        state.cursor.y = (state.cursor.y + 1) % size;
      } else if (key === 'arrowleft' || key === 'a') {
        state.cursor.x = (state.cursor.x + size - 1) % size;
      } else if (key === 'arrowright' || key === 'd') {
        state.cursor.x = (state.cursor.x + 1) % size;
      } else if (key === ' ' || key === 'enter') {
        const index = state.cursor.y * size + state.cursor.x;
        const cell = state.cells[index];
        if (cell.state === 'glitch') {
          cell.state = 'cooldown';
          cell.cooldown = 0.7;
          state.glitchCount = Math.max(0, state.glitchCount - 1);
          state.score += 1;
          state.spawnInterval = Math.max(0.55, state.spawnInterval - 0.01);
          setStatus(`Glitch diffused. ${state.glitchCount} active anomalies remain.`);
        } else {
          setStatus('No anomaly detected on that tile.');
        }
      } else if (key === 'g') {
        if (state.fieldCooldown === 0) {
          state.fieldCooldown = 10;
          state.spawnInterval = Math.min(1.8, state.spawnInterval + 0.35);
          setStatus('Damping field deployed. Spawn rate slowed temporarily.');
        } else {
          setStatus(`Damping field recharging (${Math.ceil(state.fieldCooldown)}s).`);
        }
      }
    },
    onPowerOff(state) {
      if (state) {
        state.isRunning = false;
      }
    }
  };
}
