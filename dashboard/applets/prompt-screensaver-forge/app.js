const monaco = await window.loadMonaco();

const themeInput = document.getElementById("themeInput");
const generateButton = document.getElementById("generateButton");
const runFileButton = document.getElementById("runFileButton");
const runProjectButton = document.getElementById("runProjectButton");
const resetButton = document.getElementById("resetEnvironment");
const killButton = document.getElementById("killSwitch");
const languageSelect = document.getElementById("languageSelect");
const fileList = document.getElementById("fileList");
const newFileButton = document.getElementById("newFileButton");
const deleteFileButton = document.getElementById("deleteFileButton");
const previewFrame = document.getElementById("previewFrame");
const generatorStatus = document.getElementById("generatorStatus");
const saveProjectButton = document.getElementById("saveProjectButton");
const loadProjectButton = document.getElementById("loadProjectButton");
const apiKeyInput = document.getElementById("apiKeyInput");
const rememberApiKeyToggle = document.getElementById("rememberApiKey");
const modelSelect = document.getElementById("modelSelect");
const refreshModelsButton = document.getElementById("refreshModelsButton");
const modelStatus = document.getElementById("modelStatus");

monaco.editor.defineTheme("forge-theme", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6fa8a8", fontStyle: "italic" },
    { token: "keyword", foreground: "f2a541" },
    { token: "string", foreground: "5cd5c0" },
    { token: "number", foreground: "f26d21" },
  ],
  colors: {
    "editor.background": "#0b3b3c",
    "editor.foreground": "#f1f4f5",
    "editorCursor.foreground": "#f2a541",
    "editor.lineHighlightBackground": "#114949aa",
    "editorLineNumber.foreground": "#2cb1a5",
    "editor.selectionBackground": "#2cb1a555",
  },
});

const editor = monaco.editor.create(document.getElementById("editor"), {
  value: "",
  language: "javascript",
  minimap: { enabled: false },
  fontFamily: '"JetBrains Mono", "DM Mono", monospace',
  fontSize: 14,
  lineHeight: 22,
  automaticLayout: true,
  theme: "forge-theme",
  wordWrap: "on",
  smoothScrolling: true,
});

const terminal = new Terminal({
  convertEol: true,
  fontSize: 13,
  fontFamily: '"JetBrains Mono", monospace',
  theme: {
    background: "#021f1f",
    foreground: "#cbe7e4",
    cursor: "#f2a541",
  },
});

terminal.open(document.getElementById("terminal"));
terminal.writeln("\x1b[38;2;44;177;165m⧖ Screensaver console ready.\x1b[0m");

const state = {
  files: new Map(),
  models: new Map(),
  activeFile: null,
  sandboxFrame: null,
  sandboxId: null,
  openAiKey: "",
  activeModel: "",
  modelCache: new Map(),
  lastModelFingerprint: null,
};

const OPENAI_RESPONSES_MODEL_PATTERNS = [/^gpt-4\.1/i, /^gpt-5/i, /^o[0-9]/i, /^o-mini/i];

const STORAGE_KEYS = {
  rememberKey: "prompt-screensaver-forge:remember-openai",
  storedKey: "prompt-screensaver-forge:openai-key",
  modelCache: "prompt-screensaver-forge:model-cache",
};

await initializeOpenAIControls();

const defaultJS = `// Prompt Screensaver Forge runtime entry
// Use the \`runtime\` helpers to create full-viewport animations.
// Functions available: runtime.size(), runtime.startLoop(step), runtime.clear(color), runtime.fade(alpha, color),
// runtime.randomRange(min, max), runtime.randomInt(min, max), runtime.wrap(value, max), runtime.gradientBackground(stops), runtime.setBackground(color).

const { width, height } = runtime.size();
const palette = { background: '#031715', primary: '#2cb1a5', accent: '#f2a541' };
runtime.setBackground(palette.background);

const particles = Array.from({ length: 60 }, () => ({
  angle: runtime.randomRange(0, Math.PI * 2),
  distance: runtime.randomRange(40, Math.min(width, height) / 2 - 20),
  speed: runtime.randomRange(0.1, 0.4),
  size: runtime.randomRange(4, 10),
}));

runtime.startLoop(({ ctx, width, height, time, delta }) => {
  runtime.fade(0.12, 'rgba(3, 23, 21, 0.8)');
  ctx.save();
  ctx.translate(width / 2, height / 2);
  particles.forEach((p, index) => {
    p.angle += p.speed * delta * (index % 2 === 0 ? 1 : -1);
    const wobble = Math.sin(time * 0.9 + index) * 12;
    const x = Math.cos(p.angle) * (p.distance + wobble);
    const y = Math.sin(p.angle) * (p.distance + wobble * 0.4);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2);
    gradient.addColorStop(0, palette.accent);
    gradient.addColorStop(1, 'rgba(44, 177, 165, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.font = '700 48px "DM Sans"';
  ctx.fillStyle = 'rgba(242, 165, 65, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('Prompt Screensaver Forge', width / 2, height * 0.25);
  ctx.restore();
});
`;

const defaultPy = `"""Prompt Screensaver Forge Pyodide template"""
from js import document, window, Math

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "#031715"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

palette = {
    "background": "#031715",
    "primary": "#2cb1a5",
    "accent": "#f2a541",
}

document.body.style.background = palette["background"]

import random

balls = [
    {
        "x": random.uniform(0, canvas.width / DPR),
        "y": random.uniform(0, canvas.height / DPR),
        "radius": random.uniform(10, 24),
        "speed": random.uniform(10, 30),
        "phase": random.uniform(0, 6.28),
    }
    for _ in range(40)
]

last_time = None

def step(timestamp):
    global last_time
    if last_time is None:
        last_time = timestamp
    dt = (timestamp - last_time) / 1000
    last_time = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "rgba(3, 23, 21, 0.24)"
    ctx.fillRect(0, 0, width, height)

    for bubble in balls:
        bubble["phase"] += dt * 0.8
        bubble["y"] -= bubble["speed"] * dt
        if bubble["y"] < -bubble["radius"]:
            bubble["y"] = height + bubble["radius"]
        bubble["x"] += Math.sin(bubble["phase"]) * 0.6

        grad = ctx.createRadialGradient(
            bubble["x"], bubble["y"], 0, bubble["x"], bubble["y"], bubble["radius"]
        )
        grad.addColorStop(0, palette["accent"])
        grad.addColorStop(1, "rgba(44, 177, 165, 0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(bubble["x"], bubble["y"], bubble["radius"], 0, Math.PI * 2)
        ctx.fill()

    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;

createFile("main.js", "javascript", defaultJS);
createFile("main.py", "python", defaultPy);
openFile("main.js");
updateFileList();

editor.onDidChangeModelContent(() => {
  const model = editor.getModel();
  if (!model) return;
  const name = model.uri.path.slice(1);
  const file = state.files.get(name);
  if (file) {
    file.content = model.getValue();
  }
});

languageSelect.addEventListener("change", () => {
  const language = languageSelect.value;
  const fileName = language === "python" ? "main.py" : "main.js";
  if (state.files.has(fileName)) {
    openFile(fileName);
  } else {
    const template = language === "python" ? defaultPy : defaultJS;
    createFile(fileName, language, template);
    openFile(fileName);
  }
  updateFileList();
  logInfo(`Active language switched to ${language}.`);
});

generateButton.addEventListener("click", async () => {
  const theme = themeInput.value.trim();
  const language = languageSelect.value;
  if (!theme) {
    setGeneratorStatus("Enter a theme prompt to generate a screensaver.", "warn");
    logWarn("Generation skipped – no theme provided.");
    return;
  }

  const key = state.openAiKey?.trim();
  if (!key) {
    setGeneratorStatus("Provide an OpenAI API key to synthesize a screensaver.", "warn");
    logWarn("Generation skipped – missing OpenAI API key.");
    return;
  }

  const model = state.activeModel;
  if (!model) {
    setGeneratorStatus("Refresh the OpenAI model list before generating.", "warn");
    logWarn("Generation skipped – no OpenAI model selected.");
    return;
  }

  setGeneratorStatus(`Contacting ${model} for a ${language} screensaver…`, "info");
  generateButton.disabled = true;

  try {
    const openAiCode = await generateScreensaverWithOpenAI({
      key,
      model,
      theme,
      language,
    });
    const code = extractCodeSnippet(openAiCode, language);
    if (!code.trim()) {
      throw new Error("OpenAI response did not include runnable code.");
    }
    const fileName = language === "python" ? "main.py" : "main.js";
    const file = state.files.get(fileName);
    if (file) {
      file.content = code;
      const modelRef = ensureModel(fileName, language);
      modelRef.setValue(code);
      editor.setModel(modelRef);
    }
    setGeneratorStatus(`Generated a ${language} loop with ${model}.`, "success");
    logInfo(`OpenAI generated ${language} screensaver using ${model} for theme: ${theme}`);
  } catch (error) {
    console.error(error);
    let fallbackApplied = false;
    const message = error?.message || "Check console for details.";
    try {
      const fallbackCode = language === "python" ? buildPythonScreensaver(theme) : buildJavaScriptScreensaver(theme);
      const fileName = language === "python" ? "main.py" : "main.js";
      const file = state.files.get(fileName);
      if (file) {
        file.content = fallbackCode;
        const modelRef = ensureModel(fileName, language);
        modelRef.setValue(fallbackCode);
        editor.setModel(modelRef);
      }
      fallbackApplied = true;
      logWarn("OpenAI generation failed – loaded offline fallback template instead.");
    } catch (fallbackError) {
      console.error(fallbackError);
      logError(`Fallback generator failed: ${fallbackError.message || fallbackError}`);
    }

    if (fallbackApplied) {
      setGeneratorStatus(`OpenAI generation failed. ${message} Loaded a fallback template instead.`, "warn");
    } else {
      setGeneratorStatus(`OpenAI generation failed. ${message}`, "warn");
    }
    logError(`OpenAI generation error: ${message}`);
  } finally {
    generateButton.disabled = false;
  }
});

runFileButton.addEventListener("click", () => {
  const active = state.activeFile;
  if (!active) {
    logWarn("No file selected.");
    return;
  }
  const file = state.files.get(active);
  if (!file) return;
  executeSnippet(file.content, file.language, `${active}`);
});

runProjectButton.addEventListener("click", () => {
  const jsFiles = [];
  const pyFiles = [];
  for (const [name, file] of state.files.entries()) {
    if (file.language === "python") {
      pyFiles.push(file);
    } else {
      jsFiles.push(file);
    }
  }

  if (jsFiles.length && pyFiles.length) {
    logWarn("Mixed-language projects must be run one language at a time.");
    return;
  }

  if (pyFiles.length) {
    const combined = pyFiles.map((f) => `# File: ${f.name}\n${f.content}`).join("\n\n");
    executeSnippet(combined, "python", "Python project");
  } else if (jsFiles.length) {
    const combined = jsFiles.map((f) => `// File: ${f.name}\n${f.content}`).join("\n\n");
    executeSnippet(combined, "javascript", "JavaScript project");
  } else {
    logWarn("Project is empty.");
  }
});

resetButton.addEventListener("click", () => {
  themeInput.value = "";
  setGeneratorStatus("Environment reset.", "success");
  destroySandbox();
  for (const [name, file] of state.files.entries()) {
    if (name === "main.py") {
      file.content = defaultPy;
    } else if (name === "main.js") {
      file.content = defaultJS;
    } else {
      file.content = file.language === "python" ? "# Reset module" : "// Reset module";
    }
    const model = ensureModel(name, file.language);
    model.setValue(file.content);
  }
  const preferred = languageSelect.value === "python" ? "main.py" : "main.js";
  if (state.files.has(preferred)) {
    openFile(preferred);
  } else if (state.activeFile) {
    openFile(state.activeFile);
  }
  updateFileList();
  terminal.clear();
  terminal.writeln("\x1b[38;2;44;177;165m⧖ Screensaver console ready.\x1b[0m");
  logInfo("Environment reset.");
});

killButton.addEventListener("click", () => {
  if (!state.sandboxFrame) {
    logWarn("No running preview to kill.");
    return;
  }
  destroySandbox();
  logError("Kill switch activated. Preview halted.");
});

newFileButton.addEventListener("click", () => {
  const name = window.prompt("File name (e.g. orbit.js or shader.py)");
  if (!name) return;
  if (state.files.has(name)) {
    logWarn("A file with that name already exists.");
    return;
  }
  const language = name.endsWith(".py") ? "python" : "javascript";
  createFile(name, language, language === "python" ? "# New Pyodide module" : "// New module");
  openFile(name);
  updateFileList();
  logInfo(`Created file ${name}.`);
});

deleteFileButton.addEventListener("click", () => {
  const active = state.activeFile;
  if (!active) {
    logWarn("No active file to delete.");
    return;
  }
  if (state.files.size <= 1) {
    logWarn("Cannot delete the last remaining file.");
    return;
  }
  state.files.delete(active);
  const model = state.models.get(active);
  if (model) {
    model.dispose();
    state.models.delete(active);
  }
  const fallback = state.files.keys().next().value;
  openFile(fallback);
  updateFileList();
  logInfo(`Deleted file ${active}.`);
});

fileList.addEventListener("click", (event) => {
  const target = event.target.closest("li[data-file]");
  if (!target) return;
  const name = target.getAttribute("data-file");
  openFile(name);
  updateFileList();
});

saveProjectButton.addEventListener("click", async () => {
  if (!navigator.storage || !navigator.storage.getDirectory) {
    logWarn("OPFS storage is not supported in this browser.");
    return;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const projectDir = await root.getDirectoryHandle("prompt-screensaver-forge", { create: true });
    for (const [name, file] of state.files.entries()) {
      const handle = await projectDir.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file.content);
      await writable.close();
    }
    logInfo("Project saved to OPFS.");
  } catch (error) {
    logError(`Failed to save project: ${error.message}`);
  }
});

loadProjectButton.addEventListener("click", async () => {
  if (!navigator.storage || !navigator.storage.getDirectory) {
    logWarn("OPFS storage is not supported in this browser.");
    return;
  }
  try {
    const root = await navigator.storage.getDirectory();
    const projectDir = await root.getDirectoryHandle("prompt-screensaver-forge");
    const newFiles = new Map();
    for await (const [name, handle] of projectDir.entries()) {
      if (handle.kind !== "file") continue;
      const file = await handle.getFile();
      const content = await file.text();
      const language = name.endsWith(".py") ? "python" : "javascript";
      newFiles.set(name, { name, language, content });
    }
    if (!newFiles.size) {
      logWarn("No files found in OPFS project directory.");
      return;
    }
    for (const [name, file] of state.models.entries()) {
      file.dispose();
    }
    state.models.clear();
    state.files = newFiles;
    const first = newFiles.keys().next().value;
    openFile(first);
    updateFileList();
    logInfo("Project loaded from OPFS.");
  } catch (error) {
    logError(`Failed to load project: ${error.message}`);
  }
});

apiKeyInput.addEventListener("input", (event) => {
  const value = event.target.value.trim();
  state.openAiKey = value;
  if (rememberApiKeyToggle.checked) {
    safeStorageSet(STORAGE_KEYS.storedKey, value);
  }
  if (!value) {
    clearModelSelect();
    state.lastModelFingerprint = null;
    setModelStatus("Add an OpenAI API key to refresh models.", "warn");
    return;
  }
  applyCachedModelsForKey(value).catch((error) => {
    console.error("Failed to apply cached OpenAI models", error);
  });
});

rememberApiKeyToggle.addEventListener("change", () => {
  if (rememberApiKeyToggle.checked) {
    if (state.openAiKey) {
      safeStorageSet(STORAGE_KEYS.storedKey, state.openAiKey);
    }
    safeStorageSet(STORAGE_KEYS.rememberKey, "1");
  } else {
    safeStorageRemove(STORAGE_KEYS.storedKey);
    safeStorageRemove(STORAGE_KEYS.rememberKey);
  }
});

refreshModelsButton.addEventListener("click", () => {
  refreshOpenAIModels().catch((error) => {
    console.error("Failed to refresh OpenAI models", error);
  });
});

modelSelect.addEventListener("change", () => {
  state.activeModel = modelSelect.value;
  persistModelSelection();
  if (state.activeModel) {
    logInfo(`Active OpenAI model set to ${state.activeModel}.`);
  }
});

window.addEventListener("message", (event) => {
  const { data } = event;
  if (!data || typeof data !== "object") return;
  if (data.__forgeSandboxId !== state.sandboxId) return;
  switch (data.type) {
    case "console": {
      const color = data.level === "error" ? "255;120;96" : data.level === "warn" ? "242;165;65" : "44;177;165";
      terminal.writeln(`\x1b[38;2;${color}m${data.message}\x1b[0m`);
      break;
    }
    case "status": {
      terminal.writeln(`\x1b[38;2;151;219;203m${data.message}\x1b[0m`);
      break;
    }
    case "error": {
      terminal.writeln(`\x1b[38;2;255;120;96m${data.message}\x1b[0m`);
      break;
    }
    default:
      break;
  }
});

function safeStorageGet(key) {
  try {
    if (!window.localStorage) return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Failed to read storage", error);
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    if (!window.localStorage) return;
    if (value === undefined || value === null || value === "") {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error("Failed to persist value", error);
  }
}

function safeStorageRemove(key) {
  try {
    if (!window.localStorage) return;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove storage key", error);
  }
}

function loadModelCacheFromStorage() {
  try {
    const raw = safeStorageGet(STORAGE_KEYS.modelCache);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    state.modelCache = new Map(Object.entries(parsed));
  } catch (error) {
    console.error("Failed to load OpenAI model cache", error);
    state.modelCache = new Map();
  }
}

function persistModelCache() {
  try {
    const serializable = Object.fromEntries(state.modelCache.entries());
    safeStorageSet(STORAGE_KEYS.modelCache, JSON.stringify(serializable));
  } catch (error) {
    console.error("Failed to persist OpenAI model cache", error);
  }
}

function persistModelSelection() {
  if (!state.lastModelFingerprint) return;
  const entry = state.modelCache.get(state.lastModelFingerprint);
  if (!entry) return;
  entry.selectedModel = state.activeModel;
  state.modelCache.set(state.lastModelFingerprint, entry);
  persistModelCache();
}

function clearModelSelect() {
  modelSelect.innerHTML = "";
  modelSelect.disabled = true;
  state.activeModel = "";
}

function defaultModelBuckets() {
  return {
    chat: [],
    vision: [],
    images: [],
    audio: [],
    embeddings: [],
    other: [],
  };
}

function renderModelOptions(buckets) {
  modelSelect.innerHTML = "";
  const labels = {
    chat: "Chat",
    vision: "Vision",
    images: "Images",
    audio: "Audio",
    embeddings: "Embeddings",
    other: "Other",
  };
  let added = false;
  Object.entries(buckets || {}).forEach(([bucket, list]) => {
    if (!Array.isArray(list) || !list.length) return;
    const group = document.createElement("optgroup");
    group.label = labels[bucket] || bucket;
    list.forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      group.appendChild(option);
    });
    modelSelect.appendChild(group);
    added = true;
  });
  if (!added) {
    modelSelect.disabled = true;
  }
}

function determineDefaultModel(buckets, preferred) {
  if (!buckets) return "";
  const lists = Object.values(buckets);
  const containsPreferred = preferred && lists.some((list) => Array.isArray(list) && list.includes(preferred));
  if (containsPreferred) {
    return preferred;
  }
  const chatList = buckets.chat || [];
  const preferredOrder = [
    "gpt-4o-mini",
    "gpt-4o-mini-2024-07-18",
    "gpt-4o",
    "gpt-4.1",
    "o3-mini",
    "o1-mini",
    "gpt-3.5-turbo",
  ];
  for (const candidate of preferredOrder) {
    if (chatList.includes(candidate)) return candidate;
  }
  if (chatList.length) return chatList[0];
  const fallbackOrder = ["vision", "images", "audio", "embeddings", "other"];
  for (const bucket of fallbackOrder) {
    const list = buckets[bucket] || [];
    if (list.length) return list[0];
  }
  return "";
}

function applyModelBuckets(buckets, preferredModel) {
  if (!buckets) {
    clearModelSelect();
    return;
  }
  renderModelOptions(buckets);
  const chosen = determineDefaultModel(buckets, preferredModel);
  if (chosen) {
    state.activeModel = chosen;
    modelSelect.value = chosen;
    modelSelect.disabled = false;
  } else {
    state.activeModel = "";
    modelSelect.disabled = true;
  }
  persistModelSelection();
}

function countTotalModels(groups) {
  return Object.values(groups || {}).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0);
}

function categorizeOpenAIModels(models) {
  const buckets = defaultModelBuckets();
  (models || []).forEach((model) => {
    const id = typeof model === "string" ? model : model?.id;
    if (!id || typeof id !== "string") return;
    const bucket = inferModelBucket(id);
    buckets[bucket] = buckets[bucket] || [];
    buckets[bucket].push(id);
  });
  Object.keys(buckets).forEach((key) => {
    buckets[key] = Array.from(new Set(buckets[key])).sort();
  });
  return buckets;
}

function inferModelBucket(id) {
  if (/embedding/i.test(id)) return "embeddings";
  if (/whisper|tts|audio/i.test(id)) return "audio";
  if (/image-\d|dall-e|image-edit/i.test(id)) return "images";
  if (/vision|omni-moderation|gpt-4o-mini-vision/i.test(id)) return "vision";
  if (/gpt-|chat|o-mini|omni|^o[0-9]/i.test(id)) return "chat";
  if (/edit/i.test(id)) return "other";
  return "other";
}

async function fingerprintKey(key) {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (!crypto?.subtle) {
    try {
      const base = btoa(unescape(encodeURIComponent(trimmed)));
      return base.replace(/[^a-z0-9]/gi, "").slice(0, 32);
    } catch (error) {
      console.error("Failed to fingerprint key without SubtleCrypto", error);
      return trimmed.slice(-32);
    }
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function applyCachedModelsForKey(key) {
  const trimmed = key.trim();
  if (!trimmed) return;
  const fingerprint = await fingerprintKey(trimmed);
  if (state.openAiKey.trim() !== trimmed) return;
  state.lastModelFingerprint = fingerprint;
  const cached = state.modelCache.get(fingerprint);
  if (cached) {
    applyModelBuckets(cached.buckets, cached.selectedModel);
    setModelStatus("Loaded cached models for this key. Refresh to sync with OpenAI.", "info");
    if (!modelSelect.disabled) {
      modelSelect.disabled = false;
    }
  } else {
    clearModelSelect();
    setModelStatus("Refresh models to sync with OpenAI.", "warn");
  }
}

async function initializeOpenAIControls() {
  loadModelCacheFromStorage();
  const rememberFlag = safeStorageGet(STORAGE_KEYS.rememberKey) === "1";
  if (rememberFlag) {
    rememberApiKeyToggle.checked = true;
  } else {
    safeStorageRemove(STORAGE_KEYS.storedKey);
  }
  const storedKey = rememberFlag ? safeStorageGet(STORAGE_KEYS.storedKey) : "";
  if (storedKey) {
    state.openAiKey = storedKey.trim();
    apiKeyInput.value = storedKey;
    await applyCachedModelsForKey(state.openAiKey);
  }
  if (!state.openAiKey) {
    clearModelSelect();
    setModelStatus("Add an OpenAI API key to refresh models.", "warn");
  }
}

async function refreshOpenAIModels() {
  const key = state.openAiKey?.trim();
  if (!key) {
    setModelStatus("Add an OpenAI API key to refresh models.", "warn");
    clearModelSelect();
    return;
  }
  const fingerprint = await fingerprintKey(key);
  state.lastModelFingerprint = fingerprint;
  const cached = state.modelCache.get(fingerprint);
  setModelStatus("Fetching models from OpenAI…", "info");
  refreshModelsButton.disabled = true;
  modelSelect.disabled = true;

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    const raw = await response.text();
    if (response.status === 401 || response.status === 403) {
      if (cached) {
        applyModelBuckets(cached.buckets, cached.selectedModel);
        setModelStatus("OpenAI rejected the API key. Using cached catalog.", "warn");
      } else {
        clearModelSelect();
        setModelStatus("OpenAI rejected the API key. Update it and try again.", "warn");
      }
      throw new Error("OpenAI rejected the API key.");
    }
    if (!response.ok) {
      throw new Error(parseOpenAIError(raw, `OpenAI model refresh failed (${response.status})`));
    }
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("Failed to parse OpenAI model payload", error);
    }
    const buckets = categorizeOpenAIModels(payload?.data || []);
    const chosen = determineDefaultModel(buckets, cached?.selectedModel);
    state.activeModel = chosen;
    applyModelBuckets(buckets, chosen);
    state.modelCache.set(fingerprint, {
      buckets,
      fetchedAt: Date.now(),
      selectedModel: state.activeModel,
    });
    persistModelCache();
    setModelStatus(`Loaded ${countTotalModels(buckets)} models from OpenAI.`, "success");
    if (state.activeModel) {
      logInfo(`OpenAI models synced. Active model: ${state.activeModel}.`);
    } else {
      logWarn("OpenAI models synced but no compatible chat model found.");
    }
  } catch (error) {
    if (error && error.message) {
      console.error("OpenAI model refresh error", error);
    }
    if (cached) {
      applyModelBuckets(cached.buckets, cached.selectedModel);
      setModelStatus("Could not reach OpenAI – using cached catalog.", "warn");
      logWarn("Using cached OpenAI model list due to refresh failure.");
    } else {
      clearModelSelect();
      setModelStatus(error?.message || "Could not reach OpenAI. Check console for details.", "warn");
    }
  } finally {
    refreshModelsButton.disabled = false;
    if (state.activeModel) {
      modelSelect.disabled = false;
    }
  }
}

function shouldUseOpenAIResponses(modelId) {
  if (!modelId) return false;
  return OPENAI_RESPONSES_MODEL_PATTERNS.some((pattern) => pattern.test(String(modelId).trim()));
}

function parseOpenAIError(raw, fallback) {
  if (raw) {
    try {
      const data = JSON.parse(raw);
      const message = data?.error?.message || data?.message || data?.error;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    } catch (error) {
      const trimmed = raw.trim();
      if (trimmed) return trimmed;
    }
  }
  return fallback || "OpenAI request failed";
}

function extractOpenAITextParts(parts) {
  if (!parts) return "";
  const list = Array.isArray(parts) ? parts : [parts];
  let buffer = "";
  list.forEach((part) => {
    if (!part) return;
    if (typeof part === "string") {
      buffer += part;
      return;
    }
    if (typeof part.text === "string") {
      buffer += part.text;
      return;
    }
    if (typeof part.value === "string") {
      buffer += part.value;
      return;
    }
    if (typeof part.content === "string") {
      buffer += part.content;
      return;
    }
    if (Array.isArray(part.content)) {
      buffer += extractOpenAITextParts(part.content);
    }
  });
  return buffer.trim();
}

function extractOpenAIChatText(payload) {
  if (!payload) return "";
  const choices = Array.isArray(payload?.choices) ? payload.choices : [];
  for (const choice of choices) {
    const message = choice?.message;
    if (!message) continue;
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content.trim();
    }
    if (Array.isArray(message.content)) {
      const text = extractOpenAITextParts(message.content);
      if (text) return text;
    }
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  return "";
}

function extractOpenAIResponsesText(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const streams = Array.isArray(payload.output)
    ? payload.output
    : Array.isArray(payload.responses)
    ? payload.responses
    : [];
  for (const entry of streams) {
    if (!entry) continue;
    const parts = entry.content || entry.outputs || entry.parts || entry.message?.content;
    const text = extractOpenAITextParts(parts);
    if (text) return text;
  }
  if (Array.isArray(payload.messages)) {
    for (const message of payload.messages) {
      if (message?.role === "assistant") {
        const text =
          typeof message.content === "string" ? message.content.trim() : extractOpenAITextParts(message.content);
        if (text) return text;
      }
    }
  }
  return "";
}

function buildOpenAIResponsesInput(messages) {
  return messages.map((message) => {
    const role = message.role || "user";
    const text = typeof message.content === "string" ? message.content : "";
    const type = role === "assistant" ? "output_text" : "input_text";
    return {
      role,
      content: [
        {
          type,
          text,
        },
      ],
    };
  });
}

async function generateScreensaverWithOpenAI({ key, model, theme, language }) {
  const trimmedTheme = theme.trim();
  const targetLanguage = language === "python" ? "Python" : "JavaScript";
  const systemPrompt = `You are a veteran creative coder who builds mesmerizing fullscreen canvas screensavers. Produce high-quality ${targetLanguage} code that runs in a browser without additional libraries.`;
  const userPrompt = [
    `Theme: ${trimmedTheme}`,
    language === "python"
      ? "Write Pyodide-compatible Python that manipulates the DOM canvas. Handle resize events and animation loops with requestAnimationFrame."
      : "Use the provided runtime helpers (runtime.startLoop, runtime.fade, runtime.gradientBackground, runtime.setBackground, runtime.randomRange).",
    "Return only the source code without explanations or markdown fences.",
  ].join("\n");

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  if (shouldUseOpenAIResponses(model)) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        input: buildOpenAIResponsesInput(messages),
        max_output_tokens: 2048,
      }),
    });
    const raw = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("OpenAI rejected the API key.");
    }
    if (!response.ok) {
      throw new Error(parseOpenAIError(raw, `OpenAI request failed (${response.status})`));
    }
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch (error) {
      throw new Error("Invalid JSON returned from OpenAI.");
    }
    const text = extractOpenAIResponsesText(payload) || extractOpenAIChatText(payload);
    if (!text) {
      throw new Error("OpenAI returned an empty response.");
    }
    return text;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.65,
    }),
  });
  const raw = await response.text();
  if (response.status === 401 || response.status === 403) {
    throw new Error("OpenAI rejected the API key.");
  }
  if (!response.ok) {
    throw new Error(parseOpenAIError(raw, `OpenAI request failed (${response.status})`));
  }
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    throw new Error("Invalid JSON returned from OpenAI.");
  }
  const text = extractOpenAIChatText(payload);
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }
  return text;
}

function extractCodeSnippet(text, language) {
  if (!text) return "";
  const normalized = text.replace(/\r\n/g, "\n");
  const patterns = language === "python"
    ? [/```python\s*\n([\s\S]*?)```/i, /```py\s*\n([\s\S]*?)```/i]
    : [/```javascript\s*\n([\s\S]*?)```/i, /```js\s*\n([\s\S]*?)```/i];
  patterns.push(/```\s*\n([\s\S]*?)```/i);
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return normalized.trim();
}

function setGeneratorStatus(message, tone = "info") {
  generatorStatus.textContent = message;
  generatorStatus.classList.remove("status-success", "status-warning", "status-info");
  if (tone === "success") {
    generatorStatus.classList.add("status-success");
  } else if (tone === "warn") {
    generatorStatus.classList.add("status-warning");
  } else {
    generatorStatus.classList.add("status-info");
  }
}

function setModelStatus(message, tone = "info") {
  modelStatus.textContent = message;
  modelStatus.classList.remove("status-success", "status-warning", "status-info");
  if (tone === "success") {
    modelStatus.classList.add("status-success");
  } else if (tone === "warn") {
    modelStatus.classList.add("status-warning");
  } else {
    modelStatus.classList.add("status-info");
  }
}

function createFile(name, language, content) {
  state.files.set(name, { name, language, content });
  ensureModel(name, language, content);
}

function ensureModel(name, language, content = "") {
  let model = state.models.get(name);
  if (model) {
    return model;
  }
  const uri = monaco.Uri.parse(`inmemory:///${name}`);
  model = monaco.editor.createModel(content ?? "", language === "python" ? "python" : "javascript", uri);
  state.models.set(name, model);
  return model;
}

function openFile(name) {
  const file = state.files.get(name);
  if (!file) return;
  state.activeFile = name;
  const model = ensureModel(name, file.language, file.content);
  if (model.getValue() !== file.content) {
    model.setValue(file.content);
  }
  editor.setModel(model);
  const targetLanguage = file.language === "python" ? "python" : "javascript";
  monaco.editor.setModelLanguage(model, targetLanguage);
  languageSelect.value = targetLanguage;
}

function updateFileList() {
  fileList.innerHTML = "";
  for (const [name, file] of state.files.entries()) {
    const li = document.createElement("li");
    li.dataset.file = name;
    li.className = name === state.activeFile ? "active" : "";
    li.innerHTML = `<span>${name}</span><span class="file-badge">${file.language}</span>`;
    fileList.appendChild(li);
  }
}

function destroySandbox() {
  if (state.sandboxFrame) {
    state.sandboxFrame.remove();
    state.sandboxFrame = null;
    state.sandboxId = null;
  }
  previewFrame.innerHTML = "";
}

function executeSnippet(code, language, label) {
  if (!code.trim()) {
    logWarn("Cannot run empty file.");
    return;
  }
  destroySandbox();
  terminal.writeln(`\x1b[38;2;151;219;203mRunning ${label}...\x1b[0m`);
  const sandboxId = crypto.randomUUID();
  state.sandboxId = sandboxId;

  if (language === "python") {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts allow-pointer-lock");
    iframe.className = "preview-iframe";
    iframe.srcdoc = buildPyodideSandboxHTML(code, sandboxId);
    previewFrame.appendChild(iframe);
    state.sandboxFrame = iframe;
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-pointer-lock");
  iframe.className = "preview-iframe";
  const html = buildSandboxHTML(code, sandboxId);
  iframe.srcdoc = html;
  previewFrame.appendChild(iframe);
  state.sandboxFrame = iframe;
}

function buildSandboxHTML(code, sandboxId) {
  const sanitized = JSON.stringify(code).replace(/<\/script>/gi, '<\\/script>');
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
        color: #fff;
        font-family: 'DM Sans', sans-serif;
      }
      canvas {
        display: block;
      }
    </style>
  </head>
  <body>
    <script>
      const sandboxId = ${JSON.stringify(sandboxId)};
      const send = (payload) => parent.postMessage({ __forgeSandboxId: sandboxId, ...payload }, '*');
      const consoleProxy = {};
      ['log', 'info', 'warn', 'error'].forEach((level) => {
        consoleProxy[level] = (...args) => {
          send({ type: 'console', level, message: args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') });
        };
      });
      window.console = consoleProxy;

      window.addEventListener('error', (event) => {
        send({ type: 'error', message: event.message || 'Runtime error' });
      });
      window.addEventListener('unhandledrejection', (event) => {
        send({ type: 'error', message: event.reason?.message || 'Unhandled rejection' });
      });

      const runtime = (() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);
        document.body.style.margin = '0';
        document.body.style.background = '#000';
        let dpr = window.devicePixelRatio || 1;
        const size = () => ({ width: canvas.width / dpr, height: canvas.height / dpr });

        const resize = () => {
          dpr = window.devicePixelRatio || 1;
          const width = window.innerWidth * dpr;
          const height = window.innerHeight * dpr;
          canvas.width = width;
          canvas.height = height;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener('resize', resize);

        const startLoop = (step) => {
          let running = true;
          let last = performance.now();
          const frame = (now) => {
            if (!running) return;
            const delta = (now - last) / 1000;
            last = now;
            const dims = size();
            step({ ctx, canvas, width: dims.width, height: dims.height, time: now / 1000, delta });
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
          return () => {
            running = false;
          };
        };

        const randomRange = (min, max) => Math.random() * (max - min) + min;
        const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));
        const wrap = (value, max) => ((value % max) + max) % max;
        const fade = (alpha, color = 'rgba(0, 0, 0, 1)') => {
          const dims = size();
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, dims.width, dims.height);
          ctx.restore();
        };
        const clear = (color) => {
          const dims = size();
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, dims.width, dims.height);
        };
        const gradientBackground = (stops) => {
          const dims = size();
          const gradient = ctx.createLinearGradient(0, 0, dims.width, dims.height);
          stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, dims.width, dims.height);
          return gradient;
        };
        const setBackground = (color) => {
          document.body.style.background = color;
        };

        return {
          canvas,
          ctx,
          size,
          startLoop,
          randomRange,
          randomInt,
          wrap,
          fade,
          clear,
          gradientBackground,
          setBackground,
        };
      })();

      try {
        const userModule = new Function('runtime', ${sanitized});
        userModule(runtime);
        send({ type: 'status', message: 'Sandbox boot complete.' });
      } catch (error) {
        send({ type: 'error', message: error.message });
      }
    <\\/script>
  </body>
</html>`;
}

function buildPyodideSandboxHTML(code, sandboxId) {
  const sanitized = JSON.stringify(code).replace(/<\/script>/gi, '<\\/script>');
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #031715;
        color: #f1f4f5;
        font-family: 'DM Sans', sans-serif;
      }
    </style>
  </head>
  <body>
    <script>
      const sandboxId = ${JSON.stringify(sandboxId)};
      const pythonSource = ${sanitized};
      const send = (payload) => parent.postMessage({ __forgeSandboxId: sandboxId, ...payload }, '*');
      const consoleProxy = {};
      ['log', 'info', 'warn', 'error'].forEach((level) => {
        consoleProxy[level] = (...args) => {
          send({ type: 'console', level, message: args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') });
        };
      });
      window.console = consoleProxy;

      const bootPyodide = async () => {
        send({ type: 'status', message: 'Loading Pyodide runtime…' });
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Pyodide assets'));
            document.head.appendChild(script);
          });
          const pyodide = await loadPyodide({
            stdout: (text) => send({ type: 'console', level: 'log', message: text }),
            stderr: (text) => send({ type: 'console', level: 'error', message: text }),
          });
          await pyodide.loadPackagesFromImports(pythonSource).catch(() => {});
          await pyodide.runPythonAsync(pythonSource);
          send({ type: 'status', message: 'Pyodide execution completed.' });
        } catch (error) {
          send({ type: 'error', message: error.message || 'Pyodide execution failed.' });
        }
      };

      bootPyodide();
    <\/script>
  </body>
</html>`;
}

function logInfo(message) {
  terminal.writeln(`\x1b[38;2;44;177;165m${message}\x1b[0m`);
}

function logWarn(message) {
  terminal.writeln(`\x1b[38;2;242;165;65m${message}\x1b[0m`);
}

function logError(message) {
  terminal.writeln(`\x1b[38;2;255;120;96m${message}\x1b[0m`);
}

function buildJavaScriptScreensaver(theme) {
  const profile = pickProfile(theme);
  const builder = JS_GENERATORS[profile.effect] || JS_GENERATORS.orbitals;
  return builder(theme, profile);
}

function buildPythonScreensaver(theme) {
  const profile = pickProfile(theme);
  const builder = PY_GENERATORS[profile.effect] || PY_GENERATORS.orbitals;
  return builder(theme, profile);
}

function pickProfile(theme) {
  const lower = theme.toLowerCase();
  for (const profile of THEME_PROFILES) {
    if (profile.keywords.some((keyword) => lower.includes(keyword))) {
      return profile;
    }
  }
  return THEME_PROFILES.find((profile) => profile.effect === 'orbitals');
}

const THEME_PROFILES = [
  {
    name: "Glyph Cascade",
    effect: "matrix",
    keywords: ["matrix", "cyber", "terminal", "code", "glitch", "neon green"],
    palette: {
      background: "#031b17",
      primary: "#0df29e",
      accent: "#1dd3b0",
      glow: "rgba(13, 242, 158, 0.35)",
    },
    glyphs: "1234567890<>[]{}/\\|-=+*#日月火水木金土未来夢光影虚空",
  },
  {
    name: "Orbiting Nebula",
    effect: "starfield",
    keywords: ["space", "galaxy", "nebula", "cosmic", "astral", "star"],
    palette: {
      background: "#010b1a",
      primary: "#2f99ff",
      accent: "#9bf3f0",
      depth: "#041f3f",
    },
  },
  {
    name: "Vapor Current",
    effect: "vaporwave",
    keywords: ["vaporwave", "retro", "sunset", "grid", "synth", "miami"],
    palette: {
      background: "#0b1f36",
      primary: "#ff6d6d",
      accent: "#46e5c1",
      glow: "rgba(255, 109, 109, 0.45)",
    },
  },
  {
    name: "Tidal Bloom",
    effect: "tidepool",
    keywords: ["ocean", "sea", "coral", "tide", "lagoon", "bubble"],
    palette: {
      background: "#021c29",
      primary: "#2cb1a5",
      accent: "#f2a541",
      glow: "rgba(44, 177, 165, 0.45)",
    },
  },
  {
    name: "Celestial Orbit",
    effect: "orbitals",
    keywords: [],
    palette: {
      background: "#041414",
      primary: "#2cb1a5",
      accent: "#f2a541",
      glow: "rgba(44, 177, 165, 0.4)",
    },
  },
];

const JS_GENERATORS = {
  matrix: (theme, profile) => {
    return `// ${profile.name} — ${theme}
const palette = ${JSON.stringify(profile.palette, null, 2)};
const glyphs = ${JSON.stringify(profile.glyphs)};
const columnWidth = 22;
const { width, height } = runtime.size();
const columnCount = Math.ceil(width / columnWidth);
const streams = Array.from({ length: columnCount }, (_, column) => ({
  column,
  y: runtime.randomRange(-height, 0),
  speed: runtime.randomRange(60, 160),
}));

runtime.setBackground(palette.background);
runtime.gradientBackground([
  [0, palette.background],
  [1, '#020e0c'],
]);

runtime.startLoop(({ ctx, width, height, delta }) => {
  ctx.fillStyle = 'rgba(3, 27, 23, 0.5)';
  ctx.fillRect(0, 0, width, height);
  streams.forEach((stream) => {
    stream.y += stream.speed * delta;
    if (stream.y > height + 80) {
      stream.y = runtime.randomRange(-120, -20);
      stream.speed = runtime.randomRange(60, 160);
    }

    const baseX = stream.column * columnWidth;
    for (let i = 0; i < 20; i++) {
      const y = stream.y - i * columnWidth;
      if (y < -60) continue;
      const intensity = Math.max(0, 1 - i / 18);
      ctx.fillStyle = intensity > 0.65
        ? palette.accent
        : 'rgba(13, 242, 158, ' + Math.max(intensity * 0.85, 0.2).toFixed(2) + ')';
      ctx.shadowColor = palette.glow || 'rgba(13, 242, 158, 0.45)';
      ctx.shadowBlur = intensity * 14;
      ctx.font = '18px "DM Mono", monospace';
      ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], baseX, y);
    }
  });
  ctx.shadowBlur = 0;
});
`;
  },
  starfield: (theme, profile) => {
    return `// ${profile.name} — ${theme}
const palette = ${JSON.stringify(profile.palette, null, 2)};
const { width, height } = runtime.size();
const origin = { x: width / 2, y: height / 2 };
const layers = [
  { count: 160, speed: 18, scale: 0.9 },
  { count: 120, speed: 32, scale: 1.2 },
  { count: 70, speed: 48, scale: 1.6 },
];

const stars = layers.flatMap((layer, idx) =>
  Array.from({ length: layer.count }, () => ({
    depth: idx,
    angle: runtime.randomRange(0, Math.PI * 2),
    radius: runtime.randomRange(20, Math.min(width, height) / 2),
    speed: layer.speed,
    scale: layer.scale,
  }))
);

runtime.setBackground(palette.background);
runtime.startLoop(({ ctx, width, height, delta }) => {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, Math.max(width, height));
  gradient.addColorStop(0, 'rgba(155, 243, 240, 0.05)');
  gradient.addColorStop(1, 'rgba(2, 12, 26, 0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    star.radius += star.speed * delta;
    if (star.radius > Math.max(width, height)) {
      star.radius = runtime.randomRange(10, 60);
      star.angle = runtime.randomRange(0, Math.PI * 2);
    }
    const x = origin.x + Math.cos(star.angle) * star.radius;
    const y = origin.y + Math.sin(star.angle) * star.radius;
    const size = 1 + star.scale * 0.8;
    ctx.fillStyle = star.depth === 0 ? palette.accent : palette.primary;
    ctx.globalAlpha = 0.5 + star.scale * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
});
`;
  },
  vaporwave: (theme, profile) => {
    return `// ${profile.name} — ${theme}
const palette = ${JSON.stringify(profile.palette, null, 2)};
runtime.setBackground(palette.background);
const gridSpacing = 60;

runtime.startLoop(({ ctx, width, height, time }) => {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.5);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(1, 'rgba(255, 109, 109, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.5, height * 0.28, Math.PI, 0);
  ctx.fill();

  ctx.save();
  ctx.translate(width / 2, height * 0.6);
  ctx.strokeStyle = 'rgba(70, 229, 193, 0.35)';
  ctx.lineWidth = 1.2;
  for (let y = 0; y < height; y += gridSpacing) {
    const wave = Math.sin((y + time * 80) * 0.01) * 18;
    ctx.beginPath();
    ctx.moveTo(-width, y + wave);
    ctx.lineTo(width, y + wave);
    ctx.stroke();
  }
  ctx.rotate(Math.PI / 6);
  for (let x = -width; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, -gridSpacing);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.6;
  ctx.font = '700 42px "DM Sans"';
  ctx.textAlign = 'center';
  ctx.fillText(${JSON.stringify(theme.toUpperCase())}, width / 2, height * 0.12);
  ctx.globalAlpha = 1;
});
`;
  },
  tidepool: (theme, profile) => {
    return `// ${profile.name} — ${theme}
const palette = ${JSON.stringify(profile.palette, null, 2)};
const bubbleCount = 70;
const bubbles = Array.from({ length: bubbleCount }, () => ({
  x: runtime.randomRange(0, runtime.size().width),
  y: runtime.randomRange(0, runtime.size().height),
  radius: runtime.randomRange(10, 28),
  drift: runtime.randomRange(0.3, 1.1),
  wobble: runtime.randomRange(0.8, 1.6),
}));

runtime.setBackground(palette.background);
runtime.startLoop(({ ctx, width, height, time, delta }) => {
  ctx.fillStyle = 'rgba(2, 28, 41, 0.65)';
  ctx.fillRect(0, 0, width, height);

  bubbles.forEach((bubble, index) => {
    bubble.y -= bubble.drift * 40 * delta;
    bubble.x += Math.sin(time * bubble.wobble + index) * 0.6;

    if (bubble.y < -bubble.radius) {
      bubble.y = height + bubble.radius;
      bubble.x = runtime.randomRange(0, width);
    }

    const gradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, bubble.radius * 1.6);
    gradient.addColorStop(0, palette.accent);
    gradient.addColorStop(1, 'rgba(44, 177, 165, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
  });
});
`;
  },
  orbitals: (theme, profile) => {
    return `// ${profile.name} — ${theme}
const palette = ${JSON.stringify(profile.palette, null, 2)};
const orbs = Array.from({ length: 64 }, (_, i) => ({
  angle: runtime.randomRange(0, Math.PI * 2),
  radius: runtime.randomRange(40, Math.min(runtime.size().width, runtime.size().height) / 2.2),
  speed: runtime.randomRange(0.4, 1.2) * (i % 2 ? 1 : -1),
  size: runtime.randomRange(4, 10),
}));

runtime.setBackground(palette.background);
runtime.startLoop(({ ctx, width, height, time, delta }) => {
  runtime.fade(0.2, 'rgba(4, 20, 20, 0.9)');
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(Math.sin(time * 0.05) * 0.05);

  orbs.forEach((orb, index) => {
    orb.angle += orb.speed * delta;
    const wobble = Math.sin(time * 0.6 + index) * 12;
    const x = Math.cos(orb.angle) * (orb.radius + wobble);
    const y = Math.sin(orb.angle) * (orb.radius + wobble * 0.4);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.size * 2);
    gradient.addColorStop(0, palette.accent);
    gradient.addColorStop(1, 'rgba(44, 177, 165, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, orb.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
});
`;
  },
};

const PY_GENERATORS = {
  matrix: (theme, profile) => {
    return `"""${profile.name} — ${theme}"""
from js import document, window, Math

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "${profile.palette.background}"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

glyphs = "0123456789abcdefghijklmnopqrstuvwxyz*&$#<>"
column_width = 22
column_count = int(canvas.width / DPR / column_width) + 1
import random
streams = [
    {
        "col": column,
        "y": random.uniform(-canvas.height / DPR, 0),
        "speed": random.uniform(60, 140),
    }
    for column in range(column_count)
]

last_time = None

def step(timestamp):
    global last_time
    if last_time is None:
        last_time = timestamp
    dt = (timestamp - last_time) / 1000
    last_time = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "rgba(3, 27, 23, 0.45)"
    ctx.fillRect(0, 0, width, height)

    for stream in streams:
        stream["y"] += stream["speed"] * dt
        if stream["y"] > height + 60:
            stream["y"] = random.uniform(-height, -20)
            stream["speed"] = random.uniform(60, 140)
        base_x = stream["col"] * column_width
        for i in range(24):
            y = stream["y"] - i * column_width
            if y < -60:
                continue
            intensity = max(0, 1 - i / 20)
            ctx.fillStyle = "rgba(13, 242, 158, " + str(intensity) + ")"
            ctx.font = "18px DM Mono, monospace"
            ctx.fillText(random.choice(glyphs), base_x, y)

    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;
  },
  starfield: (theme, profile) => {
    return `"""${profile.name} — ${theme}"""
from js import document, window

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "${profile.palette.background}"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

import random, math
origin = {"x": canvas.width / DPR / 2, "y": canvas.height / DPR / 2}
layers = [
    {"count": 140, "speed": 20, "scale": 1.0},
    {"count": 90, "speed": 30, "scale": 1.4},
    {"count": 60, "speed": 45, "scale": 1.8},
]
stars = []
for depth, layer in enumerate(layers):
    for _ in range(layer["count"]):
        stars.append(
            {
                "depth": depth,
                "angle": random.uniform(0, math.tau),
                "radius": random.uniform(20, min(canvas.width, canvas.height) / DPR / 2),
                "speed": layer["speed"],
                "scale": layer["scale"],
            }
        )

last = None

def step(timestamp):
    global last
    if last is None:
        last = timestamp
    dt = (timestamp - last) / 1000
    last = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "${profile.palette.background}"
    ctx.fillRect(0, 0, width, height)

    for star in stars:
        star["radius"] += star["speed"] * dt
        if star["radius"] > max(width, height):
            star["radius"] = random.uniform(10, 40)
            star["angle"] = random.uniform(0, math.tau)
        x = origin["x"] + math.cos(star["angle"]) * star["radius"]
        y = origin["y"] + math.sin(star["angle"]) * star["radius"]
        ctx.globalAlpha = 0.4 + star["scale"] * 0.3
        ctx.fillStyle = "${profile.palette.accent}"
        ctx.beginPath()
        ctx.arc(x, y, 1 + star["scale"] * 0.6, 0, math.tau)
        ctx.fill()

    ctx.globalAlpha = 1
    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;
  },
  vaporwave: (theme, profile) => {
    return `"""${profile.name} — ${theme}"""
from js import document, window, Math

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "${profile.palette.background}"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

grid_spacing = 60

last = None

def step(timestamp):
    global last
    if last is None:
        last = timestamp
    dt = (timestamp - last) / 1000
    last = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "${profile.palette.background}"
    ctx.fillRect(0, 0, width, height)

    gradient = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.5)
    gradient.addColorStop(0, "${profile.palette.primary}")
    gradient.addColorStop(1, "rgba(255, 109, 109, 0)")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(width / 2, height * 0.5, height * 0.28, Math.PI, 0)
    ctx.fill()

    ctx.save()
    ctx.translate(width / 2, height * 0.6)
    ctx.strokeStyle = "rgba(70, 229, 193, 0.3)"
    ctx.lineWidth = 1.2
    y = -grid_spacing
    while y < height:
        wave = Math.sin((y + timestamp * 0.08) * 0.08) * 18
        ctx.beginPath()
        ctx.moveTo(-width, y + wave)
        ctx.lineTo(width, y + wave)
        ctx.stroke()
        y += grid_spacing
    ctx.restore()

    ctx.globalAlpha = 0.7
    ctx.fillStyle = "${profile.palette.accent}"
    ctx.font = "700 40px DM Sans"
    ctx.textAlign = "center"
    ctx.fillText(${JSON.stringify(theme.upper())}, width / 2, height * 0.12)
    ctx.globalAlpha = 1

    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;
  },
  tidepool: (theme, profile) => {
    return `"""${profile.name} — ${theme}"""
from js import document, window, Math

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "${profile.palette.background}"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

import random
bubbles = [
    {
        "x": random.uniform(0, canvas.width / DPR),
        "y": random.uniform(0, canvas.height / DPR),
        "radius": random.uniform(12, 26),
        "speed": random.uniform(12, 30),
        "offset": random.uniform(0, 6.28),
    }
    for _ in range(80)
]

last = None

def step(timestamp):
    global last
    if last is None:
        last = timestamp
    dt = (timestamp - last) / 1000
    last = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "rgba(2, 28, 41, 0.6)"
    ctx.fillRect(0, 0, width, height)

    for bubble in bubbles:
        bubble["y"] -= bubble["speed"] * dt
        if bubble["y"] < -bubble["radius"]:
            bubble["y"] = height + bubble["radius"]
            bubble["x"] = random.uniform(0, width)
        bubble["x"] += Math.sin(timestamp * 0.001 + bubble["offset"]) * 0.8
        grad = ctx.createRadialGradient(bubble["x"], bubble["y"], 0, bubble["x"], bubble["y"], bubble["radius"] * 1.5)
        grad.addColorStop(0, "${profile.palette.accent}")
        grad.addColorStop(1, "rgba(44, 177, 165, 0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(bubble["x"], bubble["y"], bubble["radius"], 0, Math.PI * 2)
        ctx.fill()

    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;
  },
  orbitals: (theme, profile) => {
    return `"""${profile.name} — ${theme}"""
from js import document, window, Math

canvas = document.createElement("canvas")
canvas.style.width = "100%"
canvas.style.height = "100%"
document.body.style.margin = "0"
document.body.style.background = "${profile.palette.background}"
document.body.appendChild(canvas)
ctx = canvas.getContext("2d")

DPR = window.devicePixelRatio or 1

def resize(event=None):
    global DPR
    DPR = window.devicePixelRatio or 1
    canvas.width = window.innerWidth * DPR
    canvas.height = window.innerHeight * DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(DPR, DPR)

resize()
window.addEventListener("resize", resize)

import random
orbs = [
    {
        "angle": random.uniform(0, Math.tau),
        "radius": random.uniform(40, min(canvas.width, canvas.height) / DPR / 2.4),
        "speed": random.uniform(0.3, 1.0) * (1 if i % 2 == 0 else -1),
        "size": random.uniform(4, 10),
    }
    for i in range(64)
]

last = None

def step(timestamp):
    global last
    if last is None:
        last = timestamp
    dt = (timestamp - last) / 1000
    last = timestamp
    width = canvas.width / DPR
    height = canvas.height / DPR

    ctx.fillStyle = "rgba(4, 20, 20, 0.82)"
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(Math.sin(timestamp * 0.0005) * 0.08)
    for orb in orbs:
        orb["angle"] += orb["speed"] * dt
        wobble = Math.sin(timestamp * 0.001 + orb["radius"]) * 10
        x = Math.cos(orb["angle"]) * (orb["radius"] + wobble)
        y = Math.sin(orb["angle"]) * (orb["radius"] + wobble * 0.4)
        grad = ctx.createRadialGradient(x, y, 0, x, y, orb["size"] * 2)
        grad.addColorStop(0, "${profile.palette.accent}")
        grad.addColorStop(1, "rgba(44, 177, 165, 0)")
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, orb["size"], 0, Math.tau)
        ctx.fill()
    ctx.restore()

    window.requestAnimationFrame(step)

window.requestAnimationFrame(step)
`;
  },
};
