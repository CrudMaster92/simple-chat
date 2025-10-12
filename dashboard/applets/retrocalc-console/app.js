const displayValueEl = document.getElementById("displayValue");
const displayExpressionEl = document.getElementById("displayExpression");
const tapeListEl = document.getElementById("tapeList");
const conversionOutputEl = document.getElementById("conversionOutput");
const headerClockEl = document.getElementById("headerClock");

let storedValue = null;
let pendingOperator = null;
let overwriteDisplay = true;
let tapeEntries = [];
let audioContext = null;
let audioEnabled = false;

function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  headerClockEl.textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 30_000);
updateClock();

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-6)) {
    return value.toExponential(6).replace(/\+/, "");
  }
  return Number(value.toFixed(10)).toString();
}

function updateDisplay(statusText = null) {
  if (statusText) {
    displayExpressionEl.textContent = statusText;
  } else if (pendingOperator) {
    displayExpressionEl.textContent = `${formatNumber(storedValue ?? 0)} ${pendingOperator}`;
  } else {
    displayExpressionEl.textContent = "Ready";
  }
  displayValueEl.textContent = currentDisplayValue();
}

function currentDisplayValue() {
  return displayValueEl.textContent || "0";
}

function setDisplayValue(value) {
  displayValueEl.textContent = value;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  audioEnabled = true;
}

function playClickTone() {
  if (!audioEnabled) {
    return;
  }
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "square";
  osc.frequency.value = 420;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
  osc.connect(gain).connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.2);
}

function clearAll() {
  storedValue = null;
  pendingOperator = null;
  overwriteDisplay = true;
  setDisplayValue("0");
  updateDisplay();
}

function clearEntry() {
  overwriteDisplay = true;
  setDisplayValue("0");
  updateDisplay();
}

function backspace() {
  if (overwriteDisplay) {
    return;
  }
  const value = currentDisplayValue();
  if (value.length <= 1 || (value.length === 2 && value.startsWith("-"))) {
    setDisplayValue("0");
    overwriteDisplay = true;
  } else {
    setDisplayValue(value.slice(0, -1));
  }
  updateDisplay();
}

function inputDigit(digit) {
  const value = currentDisplayValue();
  if (overwriteDisplay || value === "Error") {
    setDisplayValue(digit === "." ? "0." : digit);
  } else {
    if (digit === "." && value.includes(".")) {
      return;
    }
    setDisplayValue(value === "0" && digit !== "." ? digit : value + digit);
  }
  overwriteDisplay = false;
  updateDisplay();
}

function negate() {
  if (overwriteDisplay) {
    overwriteDisplay = false;
  }
  const value = currentDisplayValue();
  if (value === "0" || value === "Error") {
    return;
  }
  setDisplayValue(value.startsWith("-") ? value.slice(1) : `-${value}`);
  updateDisplay();
}

function performOperation(operator) {
  const inputValue = Number(currentDisplayValue());
  if (!Number.isFinite(inputValue)) {
    return;
  }
  if (storedValue === null) {
    storedValue = inputValue;
  } else if (!overwriteDisplay) {
    const result = compute(pendingOperator, storedValue, inputValue);
    setDisplayValue(formatNumber(result));
    storedValue = Number.isFinite(result) ? result : null;
    if (storedValue === null) {
      pendingOperator = null;
      overwriteDisplay = true;
      updateDisplay("Error");
      return;
    }
  }
  pendingOperator = operator;
  overwriteDisplay = true;
  updateDisplay();
}

function compute(operator, a, b) {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function calculate() {
  if (pendingOperator === null) {
    updateDisplay();
    return;
  }
  const inputValue = Number(currentDisplayValue());
  const result = compute(pendingOperator, storedValue ?? 0, inputValue);
  const expression = `${formatNumber(storedValue ?? 0)} ${pendingOperator} ${formatNumber(inputValue)}`;
  const formatted = formatNumber(result);
  storedValue = Number.isFinite(result) ? result : null;
  pendingOperator = null;
  overwriteDisplay = true;
  setDisplayValue(formatted);
  appendTapeEntry(expression, formatted);
  updateDisplay(`${expression} =`);
}

function appendTapeEntry(expression, result) {
  tapeEntries.unshift({ expression, result });
  tapeEntries = tapeEntries.slice(0, 18);
  tapeListEl.innerHTML = "";
  tapeEntries.forEach((entry) => {
    const item = document.createElement("li");
    const exprSpan = document.createElement("span");
    exprSpan.textContent = entry.expression;
    const resultSpan = document.createElement("span");
    resultSpan.textContent = entry.result;
    item.append(exprSpan, resultSpan);
    tapeListEl.appendChild(item);
  });
}

function clearTape() {
  tapeEntries = [];
  tapeListEl.innerHTML = "";
}

const conversions = {
  "usd-eur": {
    label: "USD → EUR",
    convert: (v) => v * 0.92,
    suffix: "€",
  },
  "fahrenheit-celsius": {
    label: "°F → °C",
    convert: (v) => ((v - 32) * 5) / 9,
    suffix: "°C",
  },
  "inch-cm": {
    label: "in → cm",
    convert: (v) => v * 2.54,
    suffix: "cm",
  },
  "pound-kg": {
    label: "lb → kg",
    convert: (v) => v * 0.453592,
    suffix: "kg",
  },
};

function handleConversion(key) {
  const conversion = conversions[key];
  const rawValue = Number(currentDisplayValue());
  if (!conversion) {
    return;
  }
  if (!Number.isFinite(rawValue)) {
    conversionOutputEl.textContent = "Enter a numeric value to convert.";
    return;
  }
  const converted = conversion.convert(rawValue);
  const formatted = formatNumber(converted);
  const line = `${conversion.label}: ${formatted} ${conversion.suffix}`.trim();
  conversionOutputEl.textContent = line;
}

function handleKeyPress(button) {
  const { action, value } = button.dataset;
  if (!audioEnabled) {
    ensureAudio();
  }
  playClickTone();
  button.classList.add("is-pressed");
  setTimeout(() => button.classList.remove("is-pressed"), 120);

  switch (action) {
    case "clear-all":
      clearAll();
      break;
    case "clear-entry":
      clearEntry();
      break;
    case "backspace":
      backspace();
      break;
    case "negate":
      negate();
      break;
    case "calculate":
      calculate();
      break;
    case "tape-clear":
      clearTape();
      break;
    default:
      if (action?.startsWith("conversion")) {
        handleConversion(action.replace("conversion-", ""));
      } else if (value === ".") {
        inputDigit(".");
      } else if (["+", "-", "*", "/"].includes(value)) {
        performOperation(value);
      } else if (value) {
        inputDigit(value);
      }
      break;
  }
}

function handleConversionButton(button) {
  const key = button.dataset.conversion;
  if (!audioEnabled) {
    ensureAudio();
  }
  playClickTone();
  button.classList.add("is-pressed");
  setTimeout(() => button.classList.remove("is-pressed"), 140);
  handleConversion(key);
}

const keypadButtons = document.querySelectorAll(".button-grid .key, .tape-clear");
keypadButtons.forEach((button) => {
  button.addEventListener("click", () => handleKeyPress(button));
});

document.querySelectorAll(".conversion").forEach((button) => {
  button.addEventListener("click", () => handleConversionButton(button));
});

clearAll();
conversionOutputEl.textContent = "Conversion results will appear here.";

document.addEventListener("keydown", (event) => {
  const { key } = event;
  const keyMap = {
    Enter: "=",
    "=": "=",
    "+": "+",
    "-": "-",
    "*": "*",
    x: "*",
    X: "*",
    "/": "/",
    ".": ".",
    ",": ".",
    Backspace: "backspace",
    Escape: "clear-all",
  };
  if (/[0-9]/.test(key)) {
    inputDigit(key);
    playClickTone();
    return;
  }
  if (keyMap[key]) {
    if (keyMap[key] === "=") {
      calculate();
    } else if (["+", "-", "*", "/"].includes(keyMap[key])) {
      performOperation(keyMap[key]);
    } else if (keyMap[key] === ".") {
      inputDigit(".");
    } else if (keyMap[key] === "backspace") {
      backspace();
    } else if (keyMap[key] === "clear-all") {
      clearAll();
    }
    playClickTone();
  }
});
