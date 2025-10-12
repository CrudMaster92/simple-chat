const storageKey = "geniepad95-settings";
const drawerSelectionKey = "geniepad95-active-drawer";

const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const temperatureInput = document.getElementById("temperature");
const temperatureValue = document.getElementById("temperatureValue");
const saveSettingsButton = document.getElementById("saveSettings");
const noteInput = document.getElementById("noteInput");
const genieOutput = document.getElementById("genieOutput");
const statusMessage = document.getElementById("statusMessage");
const copyButton = document.getElementById("copyOutput");
const actionButtons = document.querySelectorAll(".genie-button");
const tabButtons = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".panel");
const fileButtons = document.querySelectorAll(".file-item");
const formatButtons = document.querySelectorAll(".format-button");

const drawerEntries = {
  "draft-notes": {
    label: "draft_notes.txt",
    summary: "Morning scribbles",
    body: `# Morning Draft\n\n**Focus for today**\n- Polish onboarding copy\n- Prep call notes for 14:30 sync\n- Log any tricky phrasing for genie review\n\n_Quick reminder_: celebrate small wins and keep the tone encouraging.`
  },
  "meeting-log": {
    label: "meeting_log.md",
    summary: "Stand-up recap",
    body: `## Daily Stand-up – Feb 9\n\n**Attendees:** Morgan, Lee, Priya\n**Highlights:**\n- GeniePad beta feedback trending positive\n- Identified two UI snags to triage\n- Shipping voiceover lines by Friday\n\n> Action item: capture follow-up questions for tomorrow's sync.`
  },
  "idea-sheet": {
    label: "idea_sheet.rtf",
    summary: "Concept sparks",
    body: `Genie Concepts\n==============\n\n• Retro toolbar with smart formatting chips\n• Notebook "focus mode" with dimmed chrome\n• Built-in prompt snippets for tone and style shifts\n\nRemember to mark favorites with ==highlight marks== for later polish.`
  }
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed.model) modelInput.value = parsed.model;
    if (typeof parsed.temperature === "number") {
      const clamped = Math.min(2, Math.max(0, parsed.temperature));
      temperatureInput.value = clamped;
      temperatureValue.textContent = clamped.toFixed(1);
    }
    if (parsed.apiKey) apiKeyInput.value = parsed.apiKey;
  } catch (error) {
    console.warn("GeniePad settings could not be loaded", error);
  }
}

function restoreDrawerSelection() {
  const storedId = localStorage.getItem(drawerSelectionKey);
  if (!storedId || !drawerEntries[storedId]) {
    return;
  }
  if (noteInput.value.trim()) {
    setActiveDrawerButton(storedId);
    return;
  }
  loadDrawerEntry(storedId, { skipStatus: true });
}

function saveSettings() {
  const settings = {
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim() || "gpt-4o-mini",
    temperature: Number(temperatureInput.value),
  };
  localStorage.setItem(storageKey, JSON.stringify(settings));
  flashStatus("Settings saved locally.");
}

function flashStatus(message, options = {}) {
  const { tone = "info" } = options;
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function loadDrawerEntry(fileId, options = {}) {
  const entry = drawerEntries[fileId];
  if (!entry) return;
  const { skipStatus = false } = options;

  noteInput.value = entry.body;
  noteInput.focus();
  setActiveDrawerButton(fileId);
  activatePanel("noteInput");
  localStorage.setItem(drawerSelectionKey, fileId);

  if (!skipStatus) {
    flashStatus(`Loaded ${entry.label} from the drawer.`, { tone: "info" });
  }
}

function setActiveDrawerButton(fileId) {
  fileButtons.forEach((button) => {
    const isActive = button.dataset.file === fileId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function wrapSelection(prefix, suffix = prefix, placeholder = "text") {
  const start = noteInput.selectionStart ?? 0;
  const end = noteInput.selectionEnd ?? start;
  const selected = noteInput.value.slice(start, end);
  const content = selected || placeholder;
  const replacement = `${prefix}${content}${suffix}`;
  noteInput.setRangeText(replacement, start, end, "end");
  const focusStart = start + prefix.length;
  if (typeof noteInput.setSelectionRange === "function") {
    noteInput.setSelectionRange(focusStart, focusStart + content.length);
  }
  noteInput.focus();
  activatePanel("noteInput");
}

function applyBulletList() {
  const start = noteInput.selectionStart ?? 0;
  const end = noteInput.selectionEnd ?? start;
  const segment = noteInput.value.slice(start, end) || "First idea";
  const lines = segment.split(/\r?\n/);
  const formatted = lines
    .map((line) => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, "");
      return trimmed ? `- ${trimmed}` : "- ";
    })
    .join("\n");
  noteInput.setRangeText(formatted, start, end, "end");
  if (typeof noteInput.setSelectionRange === "function") {
    noteInput.setSelectionRange(start, start + formatted.length);
  }
  noteInput.focus();
  activatePanel("noteInput");
}

function applyFormatting(format) {
  if (!noteInput) return;

  const presets = {
    bold: { prefix: "**", suffix: "**", placeholder: "bold text", message: "Bold formatting applied." },
    italic: { prefix: "_", suffix: "_", placeholder: "italic text", message: "Italic formatting applied." },
    highlight: { prefix: "==", suffix: "==", placeholder: "highlight", message: "Highlight added." },
    code: { prefix: "`", suffix: "`", placeholder: "code", message: "Inline code formatting applied." }
  };

  if (format === "bullet") {
    applyBulletList();
    flashStatus("Converted selection to a bullet list.", { tone: "info" });
    return;
  }

  const preset = presets[format];
  if (!preset) return;
  wrapSelection(preset.prefix, preset.suffix, preset.placeholder);
  flashStatus(preset.message, { tone: "success" });
}

async function runGenie(action) {
  const note = noteInput.value.trim();
  if (!note) {
    flashStatus("Add some notebook text before calling the genie.", { tone: "warn" });
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    flashStatus("Enter your OpenAI API key to unlock the genie.", { tone: "warn" });
    apiKeyInput.focus();
    return;
  }

  const model = modelInput.value.trim() || "gpt-4o-mini";
  const temperature = Math.min(2, Math.max(0, Number(temperatureInput.value) || 0));
  temperatureInput.value = temperature;
  temperatureValue.textContent = temperature.toFixed(1);

  const actionPrompts = {
    rewrite:
      "Rewrite the notebook text to improve clarity and tone. Maintain the original meaning while tightening phrasing and suggesting subtle polish.",
    summarize:
      "Summarize the notebook text into a concise digest of the main points. Include key action items or decisions if present.",
    brainstorm:
      "Generate three to five creative brainstorm ideas inspired by the notebook text. Use bullet points and keep each idea actionable.",
  };

  const instruction = actionPrompts[action];
  if (!instruction) return;

  setLoadingState(true, action);
  flashStatus("Consulting the Genie...", { tone: "progress" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content:
              "You are the GeniePad 95 assistant, a friendly writing genie living inside a retro notepad. Provide helpful, succinct responses while honoring the user's intent.",
          },
          {
            role: "user",
            content: `${instruction}\n\nNotebook text:\n${note}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || "The genie ran into a connection issue.");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("No response received. Try again in a moment.");
    }

    genieOutput.textContent = text;
    activatePanel("genieOutput");
    flashStatus("Genie response ready.", { tone: "success" });
  } catch (error) {
    console.error(error);
    flashStatus(error.message || "Something went wrong with the genie.", { tone: "error" });
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading, action) {
  actionButtons.forEach((button) => {
    if (isLoading) {
      button.disabled = true;
      if (button.dataset.action === action) {
        button.textContent = "Working...";
      }
    } else {
      button.disabled = false;
      const label = button.dataset.action;
      if (label === "rewrite") button.textContent = "Rewrite ✨";
      if (label === "summarize") button.textContent = "Summarize 📄";
      if (label === "brainstorm") button.textContent = "Brainstorm 💡";
    }
  });
}

function activatePanel(panelId) {
  panels.forEach((panel) => {
    const id = panel.id === "noteInput" ? "noteInput" : panel.id;
    panel.classList.toggle("active", panel.id === panelId || (panelId === "noteInput" && id === "noteInput"));
  });
  tabButtons.forEach((button) => {
    const isNotebookTab = !button.dataset.tab;
    const targetId = button.dataset.tab === "genie-output" ? "genieOutput" : "noteInput";
    button.classList.toggle("active", targetId === panelId);
  });
}

actionButtons.forEach((button) => {
  button.addEventListener("click", () => runGenie(button.dataset.action));
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab === "genie-output" ? "genieOutput" : "noteInput";
    activatePanel(target);
  });
});

fileButtons.forEach((button) => {
  button.addEventListener("click", () => loadDrawerEntry(button.dataset.file));
});

formatButtons.forEach((button) => {
  button.addEventListener("click", () => applyFormatting(button.dataset.format));
});

copyButton.addEventListener("click", async () => {
  const text = genieOutput.textContent.trim();
  if (!text) {
    flashStatus("Nothing to copy yet—ask the genie first.", { tone: "warn" });
    return;
  }
  if (!navigator.clipboard) {
    flashStatus("Clipboard access is unavailable in this browser.", { tone: "warn" });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    flashStatus("Genie output copied to clipboard.", { tone: "success" });
  } catch (error) {
    flashStatus("Clipboard copy failed. Please copy manually.", { tone: "error" });
  }
});

saveSettingsButton.addEventListener("click", saveSettings);

temperatureInput.addEventListener("input", () => {
  const value = Number(temperatureInput.value);
  temperatureValue.textContent = value.toFixed(1);
});

loadSettings();
restoreDrawerSelection();
temperatureValue.textContent = Number(temperatureInput.value).toFixed(1);
