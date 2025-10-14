(function () {
  const STORAGE_KEYS = {
    key: 'glyphLens.apiKey',
    remember: 'glyphLens.remember',
    modelCache: 'glyphLens.modelCache',
    preferences: 'glyphLens.preferences',
  };

  const FALLBACK_MODELS = {
    vision: ['gpt-5.0-vision-preview', 'gpt-5.0-vision', 'gpt-4o-mini-vision'],
    chat: ['gpt-5.0', 'gpt-4.1'],
    images: [],
    audio: [],
    embeddings: [],
  };

  const TOOL_DEFINITIONS = [
    {
      type: 'function',
      function: {
        name: 'register_discovery',
        description:
          'Document a concrete finding from the artifact scene. Always call this for each key object you identify.',
        parameters: {
          type: 'object',
          required: ['title', 'verdict'],
          properties: {
            title: {
              type: 'string',
              description: 'A punchy codename for the finding (max ~6 words).',
            },
            verdict: {
              type: 'string',
              description: 'One-line assessment of why the finding matters to the expedition.',
            },
            detail: {
              type: 'string',
              description: 'A vivid detail the crew should notice. Tie it directly to the uploaded image.',
            },
            difficulty: {
              type: 'string',
              enum: ['trivial', 'notable', 'perilous'],
              description: 'How tricky the finding was to secure.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'award_flux',
        description:
          'Shift the expedition flux meter to reflect boons or hazards you perceive. Use modest adjustments between -5 and 5.',
        parameters: {
          type: 'object',
          required: ['shift', 'outcome'],
          properties: {
            shift: {
              type: 'number',
              description: 'Integer between -5 and 5. Positive numbers mean good fortune.',
            },
            outcome: {
              type: 'string',
              description: 'Name the boon or hazard triggered.',
            },
            note: {
              type: 'string',
              description: 'A short note describing the ripple effect on the mission.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'set_final_rating',
        description:
          'Lock in the expedition verdict after reviewing discoveries. Call once with the overall mood.',
        parameters: {
          type: 'object',
          required: ['rating', 'reason'],
          properties: {
            rating: {
              type: 'string',
              description: 'Short celebratory or cautionary badge text.',
            },
            reason: {
              type: 'string',
              description: 'One sentence summarizing what tipped the outcome.',
            },
          },
        },
      },
    },
  ];

  const TOOL_HANDLERS = {
    register_discovery(args) {
      const entry = {
        title: sanitize(args.title ?? 'Unnamed Discovery'),
        verdict: sanitize(args.verdict ?? ''),
        detail: sanitize(args.detail ?? ''),
        difficulty: sanitize(args.difficulty ?? 'notable'),
      };
      state.discoveries.push(entry);
      renderDiscoveries();
      pushLog('Tool',
        `Discovery logged: <strong>${escapeHtml(entry.title)}</strong>`,
        `Verdict: ${escapeHtml(entry.verdict)}${entry.detail ? `<br/>Detail: ${escapeHtml(entry.detail)}` : ''}`
      );
    },
    award_flux(args) {
      const shift = clampNumber(Number(args.shift) || 0, -5, 5);
      const outcome = sanitize(args.outcome ?? 'Unnamed Event');
      const note = sanitize(args.note ?? '');
      state.flux = clampNumber(state.flux + shift, -10, 10);
      updateFlux();
      pushLog(
        'Tool',
        `Flux ${shift >= 0 ? 'boost' : 'dip'}: <strong>${escapeHtml(outcome)}</strong> (${shift >= 0 ? '+' : ''}${shift})`,
        note ? escapeHtml(note) : ''
      );
    },
    set_final_rating(args) {
      state.finalRating = {
        rating: sanitize(args.rating ?? 'Indecisive Outcome'),
        reason: sanitize(args.reason ?? ''),
      };
      renderFinalRating();
      pushLog('Tool', 'Final rating sealed', `${escapeHtml(state.finalRating.rating)} — ${escapeHtml(state.finalRating.reason)}`);
    },
  };

  const elements = {};

  const state = {
    apiKey: '',
    rememberKey: false,
    models: cloneModels(FALLBACK_MODELS),
    selectedModel: FALLBACK_MODELS.vision[0],
    modelStatus: 'Using fallback catalog.',
    missionName: '',
    hazard: 'steady',
    focus: '',
    imageDataUrl: null,
    flux: 0,
    discoveries: [],
    finalRating: null,
    busy: false,
    cache: {},
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    wireEvents();
    loadPreferences();
    loadCachedModels();
    renderModelSelect();
    updateFlux();
    renderDiscoveries();
    renderFinalRating();
    pushLog('System', 'Ready for launch', 'Drop an image and cue GPT-5 Vision to begin the expedition.');
  }

  function cacheElements() {
    elements.apiKeyInput = document.getElementById('apiKeyInput');
    elements.rememberToggle = document.getElementById('rememberKeyToggle');
    elements.refreshModelsButton = document.getElementById('refreshModelsButton');
    elements.modelStatus = document.getElementById('modelStatus');
    elements.modelSelect = document.getElementById('modelSelect');
    elements.missionNameInput = document.getElementById('missionNameInput');
    elements.hazardSelect = document.getElementById('hazardSelect');
    elements.focusInput = document.getElementById('focusInput');
    elements.dropZone = document.getElementById('dropZone');
    elements.imageInput = document.getElementById('imageInput');
    elements.imagePreview = document.getElementById('imagePreview');
    elements.dropContent = document.getElementById('dropContent');
    elements.analyzeButton = document.getElementById('analyzeButton');
    elements.newMissionButton = document.getElementById('newMissionButton');
    elements.fluxFill = document.getElementById('fluxFill');
    elements.fluxValue = document.getElementById('fluxValue');
    elements.discoveryList = document.getElementById('discoveryList');
    elements.ratingSlot = document.getElementById('ratingSlot');
    elements.logStream = document.getElementById('logStream');
  }

  function wireEvents() {
    elements.apiKeyInput.addEventListener('input', () => {
      state.apiKey = elements.apiKeyInput.value.trim();
      if (state.rememberKey) saveStoredKey(state.apiKey);
    });

    elements.rememberToggle.addEventListener('change', () => {
      state.rememberKey = elements.rememberToggle.checked;
      localStorage.setItem(STORAGE_KEYS.remember, JSON.stringify(state.rememberKey));
      if (state.rememberKey) {
        saveStoredKey(state.apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEYS.key);
      }
    });

    elements.refreshModelsButton.addEventListener('click', refreshModels);

    elements.modelSelect.addEventListener('change', () => {
      state.selectedModel = elements.modelSelect.value;
      persistPreferences();
    });

    elements.missionNameInput.addEventListener('input', () => {
      state.missionName = elements.missionNameInput.value;
      persistPreferences();
    });

    elements.hazardSelect.addEventListener('change', () => {
      state.hazard = elements.hazardSelect.value;
      persistPreferences();
    });

    elements.focusInput.addEventListener('input', () => {
      state.focus = elements.focusInput.value;
      persistPreferences();
    });

    elements.dropZone.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', handleFileInput);

    ;['dragenter', 'dragover'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropZone.classList.add('dragging');
      });
    });

    ;['dragleave', 'drop'].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === 'drop' && event.dataTransfer?.files?.length) {
          elements.imageInput.files = event.dataTransfer.files;
          handleFileInput();
        }
        elements.dropZone.classList.remove('dragging');
      });
    });

    elements.analyzeButton.addEventListener('click', runAnalysis);
    elements.newMissionButton.addEventListener('click', resetMission);
  }

  function loadPreferences() {
    try {
      const remember = JSON.parse(localStorage.getItem(STORAGE_KEYS.remember) ?? 'false');
      state.rememberKey = Boolean(remember);
      elements.rememberToggle.checked = state.rememberKey;
      if (state.rememberKey) {
        const storedKey = localStorage.getItem(STORAGE_KEYS.key) ?? '';
        state.apiKey = storedKey;
        elements.apiKeyInput.value = storedKey;
      }
      const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.preferences) ?? '{}');
      if (prefs.missionName) {
        state.missionName = prefs.missionName;
        elements.missionNameInput.value = state.missionName;
      }
      if (prefs.hazard) {
        state.hazard = prefs.hazard;
        elements.hazardSelect.value = state.hazard;
      }
      if (prefs.focus) {
        state.focus = prefs.focus;
        elements.focusInput.value = state.focus;
      }
      if (prefs.selectedModel) {
        state.selectedModel = prefs.selectedModel;
      }
    } catch (error) {
      console.warn('Unable to load preferences', error);
    }
  }

  function saveStoredKey(key) {
    try {
      localStorage.setItem(STORAGE_KEYS.key, key ?? '');
    } catch (error) {
      console.warn('Unable to store API key', error);
    }
  }

  function persistPreferences() {
    try {
      const payload = {
        missionName: state.missionName,
        hazard: state.hazard,
        focus: state.focus,
        selectedModel: state.selectedModel,
      };
      localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to store preferences', error);
    }
  }

  function loadCachedModels() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.modelCache);
      if (!raw) return;
      const cache = JSON.parse(raw);
      state.cache = cache;
      const entry = cache[fingerprintKey(state.apiKey)];
      if (entry?.models) {
        state.models = entry.models;
        state.selectedModel = entry.selectedModel ?? state.selectedModel;
        state.modelStatus = 'Loaded cached catalog.';
        renderModelSelect();
      }
    } catch (error) {
      console.warn('Unable to load cached models', error);
    }
  }

  function fingerprintKey(key) {
    if (!key) return 'anon';
    return `openai-${key.slice(0, 6)}`;
  }

  function cacheModels() {
    try {
      const cache = { ...(state.cache || {}) };
      cache[fingerprintKey(state.apiKey)] = {
        models: state.models,
        selectedModel: state.selectedModel,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.modelCache, JSON.stringify(cache));
      state.cache = cache;
    } catch (error) {
      console.warn('Unable to persist model cache', error);
    }
  }

  function renderModelSelect() {
    const select = elements.modelSelect;
    if (!select) return;
    const options = state.models.vision && state.models.vision.length ? state.models.vision : FALLBACK_MODELS.vision;
    select.innerHTML = '';
    if (!options.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No vision models available';
      select.appendChild(option);
      select.disabled = true;
      elements.modelStatus.textContent = 'Add a valid key and refresh to load GPT-5 vision models.';
      return;
    }
    select.disabled = false;
    options.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      select.appendChild(option);
    });
    if (options.includes(state.selectedModel)) {
      select.value = state.selectedModel;
    } else {
      state.selectedModel = options[0];
      select.value = state.selectedModel;
    }
    elements.modelStatus.textContent = state.modelStatus;
  }

  async function refreshModels() {
    if (!state.apiKey) {
      pushLog('System', 'Missing API key', 'Add a valid OpenAI API key to sync the GPT-5 model catalog.');
      elements.modelStatus.textContent = 'No key detected.';
      return;
    }
    elements.refreshModelsButton.disabled = true;
    elements.modelStatus.textContent = 'Fetching models from OpenAI…';
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${state.apiKey}`,
        },
      });
      if (response.status === 401) {
        elements.modelStatus.textContent = 'Key rejected. Keeping previous catalog.';
        pushLog('System', 'Unauthorized', 'The provided API key was not accepted.');
        return;
      }
      if (!response.ok) {
        const text = await response.text();
        elements.modelStatus.textContent = `Model refresh failed (${response.status}).`;
        console.error('Model refresh failed', text);
        pushLog('System', 'Model sync error', 'OpenAI responded with an error. Check the console for details.');
        return;
      }
      const payload = await response.json();
      const bucketed = bucketizeModels(payload?.data ?? []);
      state.models = bucketed;
      state.modelStatus = `Loaded ${countModels(bucketed)} models from OpenAI.`;
      renderModelSelect();
      cacheModels();
      pushLog('System', 'Catalog updated', 'GPT-5 vision roster refreshed successfully.');
    } catch (error) {
      console.error('Failed to refresh models', error);
      elements.modelStatus.textContent = 'Network error fetching models.';
      pushLog('System', 'Network issue', 'Could not reach OpenAI to refresh the catalog.');
    } finally {
      elements.refreshModelsButton.disabled = false;
    }
  }

  function countModels(models) {
    return Object.values(models).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);
  }

  function bucketizeModels(models) {
    const buckets = {
      chat: new Set(),
      vision: new Set(),
      images: new Set(),
      audio: new Set(),
      embeddings: new Set(),
    };
    models.forEach((entry) => {
      const id = typeof entry === 'string' ? entry : entry.id;
      if (!id) return;
      const bucket = resolveBucket(id);
      buckets[bucket].add(id);
    });
    return Object.fromEntries(
      Object.entries(buckets).map(([key, set]) => [key, Array.from(set).sort()])
    );
  }

  function resolveBucket(id) {
    const lowered = id.toLowerCase();
    if (lowered.includes('embedding')) return 'embeddings';
    if (lowered.includes('audio') || lowered.includes('voice')) return 'audio';
    if (lowered.includes('image') || lowered.includes('dall')) return 'images';
    if (lowered.includes('vision') || lowered.includes('gpt-5.0')) return 'vision';
    return 'chat';
  }

  function handleFileInput() {
    const file = elements.imageInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      pushLog('System', 'Unsupported file', 'Please provide an image file for the expedition.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.imageDataUrl = reader.result;
      elements.imagePreview.src = state.imageDataUrl;
      elements.imagePreview.hidden = false;
      elements.dropContent.hidden = true;
      pushLog('System', 'Artifact staged', `Loaded ${escapeHtml(file.name)} (${Math.round(file.size / 1024)} KB).`);
    };
    reader.onerror = () => {
      pushLog('System', 'Read error', 'Unable to read the selected file.');
    };
    reader.readAsDataURL(file);
  }

  function runAnalysis() {
    if (state.busy) return;
    if (!state.apiKey) {
      pushLog('System', 'Missing API key', 'Add an OpenAI API key before surveying the artifact.');
      return;
    }
    if (!state.selectedModel) {
      pushLog('System', 'Missing model', 'Select a GPT-5 vision model to continue.');
      return;
    }
    if (!state.imageDataUrl) {
      pushLog('System', 'No artifact', 'Drop an image so GPT-5 Vision can inspect it.');
      return;
    }

    state.busy = true;
    elements.analyzeButton.disabled = true;
    pushLog('System', 'Dispatching', 'Sending the artifact to GPT-5 Vision for analysis…');

    const userPrompt = buildUserPrompt();

    const payload = {
      model: state.selectedModel,
      messages: [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: 'You are the Glyph Lens expedition AI. Inspect uploaded images carefully with GPT-5 level perception. Narrate discoveries with enthusiasm and ALWAYS invoke the provided tools to log findings, adjust flux, and set a final rating before you conclude. Keep text concise and grounded in what you actually see.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: state.imageDataUrl } },
          ],
        },
      ],
      temperature: 0.6,
      max_tokens: 600,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
    };

    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.apiKey}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.status === 401) {
          throw new Error('The OpenAI API rejected the key.');
        }
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text || 'OpenAI request failed.');
          });
        }
        return response.json();
      })
      .then(handleResponse)
      .catch((error) => {
        console.error('Vision request failed', error);
        pushLog('System', 'Analysis failed', error.message || 'Unknown error occurred.', true);
      })
      .finally(() => {
        state.busy = false;
        elements.analyzeButton.disabled = false;
      });
  }

  function handleResponse(payload) {
    const choice = payload?.choices?.[0];
    const message = choice?.message;
    if (!message) {
      pushLog('System', 'Empty response', 'GPT-5 returned no message.');
      return;
    }
    const textSegments = [];
    (message.content || []).forEach((segment) => {
      if (segment.type === 'text' && segment.text) {
        textSegments.push(segment.text);
      }
    });
    if (textSegments.length) {
      pushLog('GPT-5', 'Field notes', textSegments.join('\n'));
    }
    const toolCalls = message.tool_calls || [];
    if (!toolCalls.length) {
      pushLog('System', 'No tool calls detected', 'Encourage GPT-5 to use the expedition tools to score discoveries.');
      return;
    }
    toolCalls.forEach((call) => {
      const handler = TOOL_HANDLERS[call.function?.name];
      if (!handler) {
        pushLog('System', 'Unknown tool', `GPT-5 attempted ${escapeHtml(call.function?.name || 'unnamed')} but no handler exists.`);
        return;
      }
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        handler(args);
      } catch (error) {
        console.error('Failed to process tool call', error);
        pushLog('System', 'Tool error', `Unable to parse arguments for ${escapeHtml(call.function?.name)}.`, true);
      }
    });
  }

  function buildUserPrompt() {
    return [
      `Mission Codename: ${state.missionName || 'Untitled Sweep'}`,
      `Hazard Vibe: ${state.hazard}`,
      state.focus ? `Focus Directive: ${state.focus}` : 'Focus Directive: Follow your best judgment.',
      'Instructions: Describe what you see, link every claim to the image, register discoveries with the tool, nudge the flux meter up or down based on thrills or threats, and call set_final_rating exactly once when finished.',
    ].join('\n');
  }

  function resetMission() {
    state.discoveries = [];
    state.flux = 0;
    state.finalRating = null;
    updateFlux();
    renderDiscoveries();
    renderFinalRating();
    pushLog('System', 'Mission reset', 'Flux cleared and logs ready for the next artifact.');
  }

  function renderDiscoveries() {
    elements.discoveryList.innerHTML = '';
    if (!state.discoveries.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'discovery-card-item';
      placeholder.innerHTML = '<p>No discoveries logged yet. GPT-5 tool calls will populate this dossier.</p>';
      elements.discoveryList.appendChild(placeholder);
      return;
    }
    state.discoveries.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'discovery-card-item';
      card.innerHTML = `
        <div class="discovery-meta">
          <span>${escapeHtml(entry.difficulty)}</span>
          <span>${new Date().toLocaleTimeString()}</span>
        </div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.verdict)}</p>
        ${entry.detail ? `<p>${escapeHtml(entry.detail)}</p>` : ''}
      `;
      elements.discoveryList.appendChild(card);
    });
  }

  function updateFlux() {
    const normalized = (state.flux + 10) / 20; // 0 to 1
    const translate = Math.round((normalized * 100 - 50) * 2);
    elements.fluxFill.style.transform = `translateX(${translate}%)`;
    elements.fluxValue.textContent = state.flux;
    persistPreferences();
  }

  function renderFinalRating() {
    if (!state.finalRating) {
      elements.ratingSlot.innerHTML = 'Awaiting analysis…';
      return;
    }
    elements.ratingSlot.innerHTML = `
      <div>
        <strong>${escapeHtml(state.finalRating.rating)}</strong>
        <span>${escapeHtml(state.finalRating.reason)}</span>
      </div>
    `;
  }

  function pushLog(source, title, body, isError = false) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${source === 'Tool' ? 'tool' : ''} ${isError ? 'error' : ''}`.trim();
    entry.innerHTML = `
      <strong>${escapeHtml(source)}</strong>
      <span>${escapeHtml(title)}</span>
      ${body ? `<div>${body}</div>` : ''}
    `;
    elements.logStream.appendChild(entry);
    elements.logStream.scrollTop = elements.logStream.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitize(value) {
    return typeof value === 'string' ? value.slice(0, 280) : '';
  }

  function clampNumber(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function cloneModels(models) {
    return JSON.parse(JSON.stringify(models));
  }
})();
