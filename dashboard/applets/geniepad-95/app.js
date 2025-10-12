const storageKey = "geniepad95-settings";

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
temperatureValue.textContent = Number(temperatureInput.value).toFixed(1);
