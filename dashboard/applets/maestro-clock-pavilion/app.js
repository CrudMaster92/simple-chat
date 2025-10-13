const primaryTime = document.getElementById("primary-time");
const primaryDate = document.getElementById("primary-date");
const nextAlarmLabel = document.getElementById("next-alarm");
const headlineStatus = document.getElementById("headline-status");
const hourHand = document.getElementById("hour-hand");
const minuteHand = document.getElementById("minute-hand");
const secondHand = document.getElementById("second-hand");

const worldList = document.getElementById("world-clock-list");
const worldForm = document.getElementById("world-clock-form");
const worldSelect = document.getElementById("world-zone");
const refreshWorldBtn = document.getElementById("refresh-world");

const alarmForm = document.getElementById("alarm-form");
const alarmList = document.getElementById("alarm-list");
const testAlarmBtn = document.getElementById("test-alarm");
const alarmLog = document.getElementById("alarm-log");

const timerDisplay = document.getElementById("timer-display");
const timerProgress = document.getElementById("timer-progress");
const timerForm = document.getElementById("timer-form");
const pauseTimerBtn = document.getElementById("pause-timer");
const resetTimerBtn = document.getElementById("reset-timer");
const quickTimerButtons = document.querySelectorAll(".quick-buttons button");

const stopwatchDisplay = document.getElementById("stopwatch-display");
const lapCount = document.getElementById("lap-count");
const lapList = document.getElementById("lap-list");
const startStopwatchBtn = document.getElementById("start-stopwatch");
const lapStopwatchBtn = document.getElementById("lap-stopwatch");
const resetStopwatchBtn = document.getElementById("reset-stopwatch");

const ambienceForm = document.getElementById("ambience-form");
const stopPulseBtn = document.getElementById("stop-pulse");
const pulseStatus = document.getElementById("pulse-status");

const audioEngine = (() => {
  let context;
  let unlocked = false;

  const ensureContext = async () => {
    if (!context) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error("AudioContext not supported", error);
        return null;
      }
    }
    if (context.state === "suspended") {
      await context.resume();
    }
    unlocked = true;
    return context;
  };

  const unlockViaInteraction = async () => {
    await ensureContext();
    window.removeEventListener("pointerdown", unlockViaInteraction);
    window.removeEventListener("keydown", unlockViaInteraction);
  };

  window.addEventListener("pointerdown", unlockViaInteraction, { once: true });
  window.addEventListener("keydown", unlockViaInteraction, { once: true });

  const playTone = async ({ frequency = 880, duration = 0.8, type = "triangle" } = {}) => {
    const ctx = await ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.1);
  };

  const burst = async (mode = "bright") => {
    const pattern = mode === "gentle" ? [440, 554, 660] : [880, 660, 1046];
    for (let i = 0; i < pattern.length; i += 1) {
      await playTone({
        frequency: pattern[i],
        duration: mode === "gentle" ? 0.6 : 0.4,
        type: mode === "gentle" ? "sine" : "sawtooth",
      });
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
  };

  return {
    async chime(mode = "bright") {
      if (!unlocked) {
        await ensureContext();
      }
      burst(mode);
    },
  };
})();

const statusMessages = [
  "Pendulums aligned and tempo steady.",
  "Chronometers tuned for the next cue.",
  "Every dial warmed and ready to conduct.",
  "Frequencies balanced; rhythm on standby.",
  "Metronome baton poised for the next beat.",
];

const pavilionState = {
  worldClocks: [],
  alarms: [],
  alarmHistory: [],
  timer: {
    durationMs: 0,
    remainingMs: 0,
    running: false,
    paused: false,
    startedAt: null,
    intervalId: null,
  },
  stopwatch: {
    elapsedMs: 0,
    running: false,
    rafId: null,
    startStamp: 0,
    laps: [],
  },
  pulse: {
    intervalMinutes: 0,
    gentle: true,
    timerId: null,
    nextAt: null,
  },
};

const formatTwo = (value) => value.toString().padStart(2, "0");

const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

const updateHeadline = () => {
  headlineStatus.textContent = statusMessages[Math.floor(Math.random() * statusMessages.length)];
};

const updatePrimaryClock = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  primaryTime.textContent = `${formatTwo(((hours + 11) % 12) + 1)}:${formatTwo(minutes)}:${formatTwo(seconds)} ${
    hours >= 12 ? "PM" : "AM"
  }`;
  primaryDate.textContent = formatDate(now);

  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  hourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
  minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
  secondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
};

const renderWorldClocks = () => {
  worldList.innerHTML = "";
  pavilionState.worldClocks.forEach((clock) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: clock.zone,
    });
    const offsetFormatter = new Intl.DateTimeFormat([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: clock.zone,
      timeZoneName: "short",
    });

    const li = document.createElement("li");
    li.className = "world-entry";
    const citySpan = document.createElement("span");
    citySpan.className = "world-city";
    citySpan.textContent = clock.label;

    const timeSpan = document.createElement("span");
    timeSpan.className = "world-time";
    timeSpan.textContent = formatter.format(now);

    const offsetSpan = document.createElement("span");
    offsetSpan.className = "world-offset";
    const offsetParts = offsetFormatter.formatToParts(now);
    const zonePart = offsetParts.find((part) => part.type === "timeZoneName");
    offsetSpan.textContent = zonePart ? zonePart.value : "";

    const metaWrap = document.createElement("div");
    metaWrap.className = "world-meta";
    metaWrap.append(citySpan, offsetSpan);

    li.append(metaWrap, timeSpan);

    if (!clock.locked) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.className = "panel__action";
      removeBtn.addEventListener("click", () => {
        pavilionState.worldClocks = pavilionState.worldClocks.filter((c) => c.id !== clock.id);
        renderWorldClocks();
        logAlarmEvent(`Removed world clock for ${clock.label}.`);
      });
      li.appendChild(removeBtn);
    }

    worldList.appendChild(li);
  });
};

const initWorldClocks = () => {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  pavilionState.worldClocks = [
    { id: "local", label: "Local", zone: localZone, locked: true },
    { id: "utc", label: "UTC", zone: "UTC", locked: true },
    { id: "tokyo", label: "Tokyo", zone: "Asia/Tokyo", locked: false },
  ];
  renderWorldClocks();
};

const logAlarmEvent = (message) => {
  const timestamp = new Date();
  const record = `${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} – ${message}`;
  pavilionState.alarmHistory.unshift(record);
  pavilionState.alarmHistory = pavilionState.alarmHistory.slice(0, 12);
  alarmLog.innerHTML = pavilionState.alarmHistory
    .map((entry) => `<div class="log-entry">${entry}</div>`)
    .join("");
};

const computeNextTrigger = (timeString, repeat) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  if (repeat === "weekdays") {
    while ([0, 6].includes(next.getDay())) {
      next.setDate(next.getDate() + 1);
    }
  }
  return next;
};

const updateNextAlarmLabel = () => {
  const activeAlarms = pavilionState.alarms.filter((alarm) => alarm.active && alarm.nextTrigger);
  if (!activeAlarms.length) {
    nextAlarmLabel.textContent = "No alarms scheduled";
    return;
  }
  activeAlarms.sort((a, b) => a.nextTrigger - b.nextTrigger);
  const next = activeAlarms[0];
  const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffMinutes = Math.round((next.nextTrigger - Date.now()) / 60000);
  const label = `${next.label || "Alarm"} • ${next.nextTrigger.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} (${relativeFormatter.format(diffMinutes, "minute")})`;
  nextAlarmLabel.textContent = label;
};

const renderAlarms = () => {
  alarmList.innerHTML = "";
  pavilionState.alarms.forEach((alarm) => {
    const li = document.createElement("li");
    li.className = "alarm-item";

    const meta = document.createElement("div");
    meta.className = "alarm-meta";
    const title = document.createElement("strong");
    title.textContent = alarm.time;
    const label = document.createElement("span");
    label.textContent = alarm.label || "Untitled alarm";
    const cadence = document.createElement("span");
    cadence.textContent =
      alarm.repeat === "daily"
        ? "Repeats daily"
        : alarm.repeat === "weekdays"
        ? "Weekday repeat"
        : "One-time";
    meta.append(title, label, cadence);

    const toggleWrapper = document.createElement("label");
    toggleWrapper.className = "alarm-toggle";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = alarm.active;
    toggle.addEventListener("change", () => {
      alarm.active = toggle.checked;
      toggleText.textContent = alarm.active ? "Active" : "Muted";
      if (alarm.active) {
        alarm.nextTrigger = computeNextTrigger(alarm.time, alarm.repeat);
      }
      updateNextAlarmLabel();
    });
    const toggleText = document.createElement("span");
    toggleText.textContent = alarm.active ? "Active" : "Muted";
    toggleWrapper.append(toggle, toggleText);

    const actions = document.createElement("div");
    actions.className = "alarm-actions";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      pavilionState.alarms = pavilionState.alarms.filter((item) => item.id !== alarm.id);
      renderAlarms();
      updateNextAlarmLabel();
      logAlarmEvent(`Removed alarm “${alarm.label || alarm.time}”.`);
    });
    actions.append(deleteBtn);

    li.append(meta, toggleWrapper, actions);
    alarmList.appendChild(li);
  });
  updateNextAlarmLabel();
};

const addAlarm = (formData) => {
  const time = formData.get("time");
  const repeat = formData.get("repeat");
  const label = formData.get("label")?.trim() || "Alarm";
  const gentle = formData.get("gentle") === "on";

  if (!time) return;
  const existing = pavilionState.alarms.find((alarm) => alarm.time === time && alarm.label === label);
  const nextTrigger = computeNextTrigger(time, repeat);
  if (!nextTrigger) return;

  const alarm = {
    id: crypto.randomUUID ? crypto.randomUUID() : `alarm-${Date.now()}-${Math.random()}`,
    time,
    label,
    repeat,
    gentle,
    active: true,
    nextTrigger,
  };

  if (existing) {
    Object.assign(existing, alarm);
  } else {
    pavilionState.alarms.push(alarm);
  }

  pavilionState.alarms.sort((a, b) => (a.nextTrigger || Infinity) - (b.nextTrigger || Infinity));
  renderAlarms();
  logAlarmEvent(`Scheduled ${repeat === "once" ? "alarm" : repeat} “${label}” for ${time}.`);
};

const checkAlarms = () => {
  const now = new Date();
  pavilionState.alarms.forEach((alarm) => {
    if (!alarm.active || !alarm.nextTrigger) return;
    if (now >= alarm.nextTrigger) {
      logAlarmEvent(`Alarm “${alarm.label}” fired.`);
      audioEngine.chime(alarm.gentle ? "gentle" : "bright");
      if (alarm.repeat === "once") {
        alarm.active = false;
        alarm.nextTrigger = null;
      } else {
        alarm.nextTrigger = computeNextTrigger(alarm.time, alarm.repeat);
      }
    }
  });
  renderAlarms();
};

const timerState = pavilionState.timer;

const updateTimerDisplay = () => {
  const remaining = Math.max(0, timerState.remainingMs);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  timerDisplay.textContent = `${formatTwo(minutes)}:${formatTwo(seconds)}`;
  const progress = timerState.durationMs
    ? ((timerState.durationMs - remaining) / timerState.durationMs) * 100
    : 0;
  timerProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
};

const stopTimerInterval = () => {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
};

const startTimer = (durationMs) => {
  if (durationMs <= 0) return;
  stopTimerInterval();
  timerState.durationMs = durationMs;
  timerState.remainingMs = durationMs;
  timerState.startedAt = Date.now();
  timerState.running = true;
  timerState.paused = false;
  timerState.intervalId = setInterval(() => {
    const elapsed = Date.now() - timerState.startedAt;
    timerState.remainingMs = timerState.durationMs - elapsed;
    if (timerState.remainingMs <= 0) {
      timerState.remainingMs = 0;
      updateTimerDisplay();
      audioEngine.chime("bright");
      logAlarmEvent("Timer complete.");
      stopTimerInterval();
      timerState.running = false;
    } else {
      updateTimerDisplay();
    }
  }, 250);
  updateTimerDisplay();
};

const pauseTimer = () => {
  if (!timerState.running) return;
  timerState.running = false;
  timerState.paused = true;
  stopTimerInterval();
  timerState.remainingMs = Math.max(0, timerState.remainingMs);
  updateTimerDisplay();
};

const resumeTimer = () => {
  if (!timerState.paused || timerState.remainingMs <= 0) return;
  timerState.startedAt = Date.now() - (timerState.durationMs - timerState.remainingMs);
  timerState.running = true;
  timerState.paused = false;
  timerState.intervalId = setInterval(() => {
    const elapsed = Date.now() - timerState.startedAt;
    timerState.remainingMs = timerState.durationMs - elapsed;
    if (timerState.remainingMs <= 0) {
      timerState.remainingMs = 0;
      updateTimerDisplay();
      audioEngine.chime("bright");
      logAlarmEvent("Timer complete.");
      stopTimerInterval();
      timerState.running = false;
      timerState.paused = false;
    } else {
      updateTimerDisplay();
    }
  }, 250);
};

const resetTimer = () => {
  stopTimerInterval();
  timerState.durationMs = 0;
  timerState.remainingMs = 0;
  timerState.running = false;
  timerState.paused = false;
  timerState.startedAt = null;
  updateTimerDisplay();
};

const stopwatchState = pavilionState.stopwatch;

const renderLaps = () => {
  lapList.innerHTML = "";
  stopwatchState.laps.forEach((lap, index) => {
    const li = document.createElement("li");
    li.textContent = `Lap ${index + 1}: ${lap}`;
    lapList.appendChild(li);
  });
  lapCount.textContent = stopwatchState.laps.length
    ? `${stopwatchState.laps.length} laps recorded`
    : "No laps yet";
};

const formatStopwatch = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${formatTwo(minutes)}:${formatTwo(seconds)}.${formatTwo(hundredths)}`;
};

const updateStopwatchDisplay = (ms) => {
  stopwatchDisplay.textContent = formatStopwatch(ms);
};

const stepStopwatch = (timestamp) => {
  if (!stopwatchState.running) return;
  const elapsed = timestamp - stopwatchState.startStamp;
  stopwatchState.elapsedMs = elapsed;
  updateStopwatchDisplay(elapsed);
  stopwatchState.rafId = requestAnimationFrame(stepStopwatch);
};

const startStopwatch = () => {
  if (stopwatchState.running) return;
  stopwatchState.running = true;
  stopwatchState.startStamp = performance.now() - stopwatchState.elapsedMs;
  stopwatchState.rafId = requestAnimationFrame(stepStopwatch);
};

const pauseStopwatch = () => {
  stopwatchState.running = false;
  if (stopwatchState.rafId) {
    cancelAnimationFrame(stopwatchState.rafId);
    stopwatchState.rafId = null;
  }
};

const resetStopwatch = () => {
  pauseStopwatch();
  stopwatchState.elapsedMs = 0;
  stopwatchState.laps = [];
  updateStopwatchDisplay(0);
  renderLaps();
};

const addLap = () => {
  if (!stopwatchState.running) return;
  const lapTime = formatStopwatch(stopwatchState.elapsedMs);
  stopwatchState.laps.unshift(lapTime);
  if (stopwatchState.laps.length > 10) stopwatchState.laps.pop();
  renderLaps();
};

const pulseState = pavilionState.pulse;

const activatePulse = (minutes, gentle) => {
  if (pulseState.timerId) {
    clearInterval(pulseState.timerId);
  }
  pulseState.intervalMinutes = minutes;
  pulseState.gentle = gentle;
  pulseState.nextAt = Date.now() + minutes * 60000;
  pulseState.timerId = setInterval(() => {
    audioEngine.chime(gentle ? "gentle" : "bright");
    pulseState.nextAt = Date.now() + minutes * 60000;
    updatePulseStatus();
    logAlarmEvent(`Pulse chime (${minutes} min interval).`);
  }, minutes * 60000);
  updatePulseStatus();
  logAlarmEvent(`Activated pulse every ${minutes} minutes.`);
};

const stopPulse = () => {
  if (pulseState.timerId) {
    clearInterval(pulseState.timerId);
    pulseState.timerId = null;
  }
  pulseState.nextAt = null;
  updatePulseStatus();
  logAlarmEvent("Pulse stopped.");
};

const updatePulseStatus = () => {
  if (!pulseState.timerId || !pulseState.nextAt) {
    pulseStatus.textContent = "Pulse inactive";
    return;
  }
  const diffMinutes = Math.max(0, Math.round((pulseState.nextAt - Date.now()) / 60000));
  pulseStatus.textContent = `Next pulse in ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}.`;
};

const initEvents = () => {
  worldForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const zone = worldSelect.value;
    const label = worldSelect.options[worldSelect.selectedIndex].textContent;
    if (pavilionState.worldClocks.some((clock) => clock.zone === zone)) {
      logAlarmEvent(`Clock for ${label} already in list.`);
      return;
    }
    pavilionState.worldClocks.push({
      id: `zone-${Date.now()}`,
      label,
      zone,
    });
    renderWorldClocks();
    logAlarmEvent(`Added world clock for ${label}.`);
  });

  refreshWorldBtn.addEventListener("click", () => {
    renderWorldClocks();
    logAlarmEvent("World clocks refreshed.");
  });

  alarmForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(alarmForm);
    addAlarm(formData);
    alarmForm.reset();
  });

  testAlarmBtn.addEventListener("click", () => {
    audioEngine.chime("bright");
    logAlarmEvent("Soundcheck chime played.");
  });

  timerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const minutes = Number(timerForm.elements.minutes.value) || 0;
    const seconds = Number(timerForm.elements.seconds.value) || 0;
    const durationMs = minutes * 60000 + seconds * 1000;
    startTimer(durationMs);
    pauseTimerBtn.textContent = "Pause";
  });

  pauseTimerBtn.addEventListener("click", () => {
    if (timerState.running) {
      pauseTimer();
      pauseTimerBtn.textContent = "Resume";
    } else if (timerState.paused) {
      resumeTimer();
      pauseTimerBtn.textContent = "Pause";
    }
  });

  resetTimerBtn.addEventListener("click", () => {
    resetTimer();
    pauseTimerBtn.textContent = "Pause";
  });

  quickTimerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const minutes = Number(button.dataset.minutes);
      startTimer(minutes * 60000);
      pauseTimerBtn.textContent = "Pause";
    });
  });

  startStopwatchBtn.addEventListener("click", () => {
    if (stopwatchState.running) {
      pauseStopwatch();
      startStopwatchBtn.textContent = "Resume";
    } else {
      startStopwatch();
      startStopwatchBtn.textContent = "Pause";
    }
  });

  lapStopwatchBtn.addEventListener("click", addLap);

  resetStopwatchBtn.addEventListener("click", () => {
    resetStopwatch();
    startStopwatchBtn.textContent = "Start";
  });

  ambienceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const interval = Number(ambienceForm.elements.interval.value) || 1;
    const gentle = ambienceForm.elements.gentle.checked;
    activatePulse(interval, gentle);
  });

  stopPulseBtn.addEventListener("click", stopPulse);
};

const init = () => {
  updateHeadline();
  initWorldClocks();
  updatePrimaryClock();
  renderAlarms();
  updateTimerDisplay();
  updateStopwatchDisplay(0);
  renderLaps();
  updatePulseStatus();
  initEvents();

  setInterval(() => {
    updatePrimaryClock();
    renderWorldClocks();
    updatePulseStatus();
  }, 1000);

  setInterval(() => {
    checkAlarms();
  }, 1000);

  setInterval(updateHeadline, 60000);
};

init();
