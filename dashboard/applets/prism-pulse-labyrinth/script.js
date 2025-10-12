const tiles = Array.from(document.querySelectorAll('.tile'));
const startButton = document.getElementById('startButton');
const waveValue = document.getElementById('wave');
const bestValue = document.getElementById('best');
const stabilityMeter = document.getElementById('stability');
const logFeed = document.getElementById('logFeed');

const tileMap = new Map(tiles.map((tile) => [tile.dataset.tile, tile]));

let sequence = [];
let wave = 0;
let best = 0;
let stability = 3;
let acceptingInput = false;
let playerIndex = 0;
let streak = 0;

startButton.addEventListener('click', startGame);
tiles.forEach((tile) => tile.addEventListener('click', handleTileClick));

disableTiles(true);

function startGame() {
  if (acceptingInput) return;
  resetBoard();
  startButton.textContent = 'Running Pulse…';
  startButton.disabled = true;
  logMessage('Sequence initialized. Watch the pulses, then trace them back.', 'system');
  nextWave();
}

function resetBoard() {
  sequence = [];
  wave = 0;
  stability = 3;
  streak = 0;
  updateWave();
  updateStability();
  disableTiles(true);
  logFeed.innerHTML = '';
}

function nextWave() {
  acceptingInput = false;
  disableTiles(true);
  const tileKeys = Array.from(tileMap.keys());
  const nextTile = tileKeys[Math.floor(Math.random() * tileKeys.length)];
  sequence.push(nextTile);
  wave += 1;
  updateWave();
  playSequence().then(() => {
    acceptingInput = true;
    disableTiles(false);
    playerIndex = 0;
    logMessage(`Echo wave ${wave} ready. Trace ${sequence.length} pulses.`, 'system');
  });
}

async function playSequence() {
  const baseDelay = Math.max(440 - wave * 14, 220);
  await sleep(400);
  for (const key of sequence) {
    const tile = tileMap.get(key);
    flashTile(tile, Math.max(baseDelay - 100, 180));
    await sleep(baseDelay + 260);
  }
}

function handleTileClick(event) {
  if (!acceptingInput) {
    return;
  }

  const { tile } = event.currentTarget.dataset;
  const expected = sequence[playerIndex];

  flashTile(event.currentTarget, 220);

  if (tile === expected) {
    playerIndex += 1;
    if (playerIndex === sequence.length) {
      acceptingInput = false;
      disableTiles(true);
      streak += 1;
      best = Math.max(best, wave);
      updateWave();
      const bonusNote = streak > 1 ? ` Streak ×${streak} maintained!` : '';
      logMessage(`Wave ${wave} cleared.${bonusNote}`, 'success');
      setTimeout(() => {
        if (stability > 0) {
          nextWave();
        }
      }, 900);
    }
  } else {
    handleMistake(expected);
  }
}

function handleMistake(expectedTile) {
  stability -= 1;
  streak = 0;
  acceptingInput = false;
  disableTiles(true);
  updateStability();

  if (stability > 0) {
    logMessage(
      `Signal misfire detected. Stability down to ${stability}. Replaying wave ${wave}.`,
      'warning'
    );
    setTimeout(async () => {
      await playSequence();
      acceptingInput = true;
      disableTiles(false);
      playerIndex = 0;
      logMessage(
        `Try wave ${wave} again. Remember: ${formatTileName(expectedTile)} pulsed there.`,
        'system'
      );
    }, 900);
  } else {
    logMessage('Signal collapsed. Stability depleted. Tap "Start Pulse" to relaunch.', 'danger');
    startButton.textContent = 'Restart Pulse';
    startButton.disabled = false;
  }
}

function updateWave() {
  waveValue.textContent = wave.toString();
  bestValue.textContent = best.toString();
}

function updateStability() {
  const pips = Array.from(stabilityMeter.querySelectorAll('.pip'));
  stabilityMeter.setAttribute('aria-valuenow', String(stability));
  pips.forEach((pip, index) => {
    pip.classList.toggle('filled', index < stability);
  });
}

function disableTiles(shouldDisable) {
  tiles.forEach((tile) => {
    tile.disabled = shouldDisable;
    tile.classList.toggle('disabled', shouldDisable);
  });
}

function flashTile(tile, duration = 320) {
  tile.classList.add('flash');
  setTimeout(() => {
    tile.classList.remove('flash');
  }, duration);
}

function logMessage(message, tone = 'system') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${tone}`;
  entry.innerHTML = `<strong>${formatToneLabel(tone)}</strong> ${message}`;
  logFeed.appendChild(entry);
  logFeed.scrollTop = logFeed.scrollHeight;
}

function formatToneLabel(tone) {
  switch (tone) {
    case 'success':
      return 'Resonance';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'Critical';
    default:
      return 'System';
  }
}

function formatTileName(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
