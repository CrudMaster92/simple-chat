const form = document.querySelector('#fieldForm');
const sectorInput = document.querySelector('#sector');
const specimenInput = document.querySelector('#specimen');
const phenomenonInput = document.querySelector('#phenomenon');
const instrumentInput = document.querySelector('#instrument');
const moodInputs = Array.from(document.querySelectorAll('input[name="mood"]'));
const notesInput = document.querySelector('#notes');
const generateButton = document.querySelector('#generateButton');
const clearButton = document.querySelector('#clearButton');
const observationPlaceholder = document.querySelector('#observationPlaceholder');
const observationText = document.querySelector('#observationText');
const generationStatus = document.querySelector('#generationStatus');
const modelStatus = document.querySelector('#modelStatus');
const apiKeyInput = document.querySelector('#apiKey');
const modelSelect = document.querySelector('#modelSelect');
const refreshModelsButton = document.querySelector('#refreshModels');
const toggleKeyVisibilityButton = document.querySelector('#toggleKeyVisibility');

const fallbackModelIds = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4o-mini-vision',
  'o4-mini',
  'gpt-4.1-mini',
  'gpt-4o-mini-tts',
  'gpt-image-1',
  'text-embedding-3-small',
  'text-embedding-3-large'
];

const bucketLabels = {
  chat: 'Conversational & Reasoning',
  vision: 'Vision & Multimodal',
  images: 'Image Generation',
  audio: 'Audio & Speech',
  embeddings: 'Embeddings',
  other: 'Specialty Models'
};

const bucketOrder = ['chat', 'vision', 'images', 'audio', 'embeddings', 'other'];

const modelCache = new Map();
let revealKey = false;

const bucketizeModels = (models) => {
  const buckets = {
    chat: new Set(),
    vision: new Set(),
    images: new Set(),
    audio: new Set(),
    embeddings: new Set(),
    other: new Set()
  };

  const pickBucket = (id) => {
    const lower = id.toLowerCase();
    if (lower.includes('embedding')) return 'embeddings';
    if (lower.includes('vision')) return 'vision';
    if (lower.includes('image') || lower.includes('dall-e')) return 'images';
    if (lower.includes('tts') || lower.includes('speech') || lower.includes('audio')) return 'audio';
    if (lower.includes('omni-moderation') || lower.includes('moderation')) return 'other';
    if (lower.includes('realtime') || lower.includes('batch') || lower.includes('ft-')) return 'other';
    return 'chat';
  };

  models.forEach((model) => {
    if (!model || !model.id) return;
    const id = model.id;
    buckets[pickBucket(id)].add(id);
  });

  return Object.fromEntries(
    Object.entries(buckets).map(([bucket, values]) => [bucket, Array.from(values).sort()])
  );
};

const fallbackBuckets = bucketizeModels(fallbackModelIds.map((id) => ({ id })));

const setModelStatus = (message, tone = 'info') => {
  if (message) {
    modelStatus.textContent = message;
    modelStatus.dataset.tone = tone;
  } else {
    modelStatus.textContent = '';
    delete modelStatus.dataset.tone;
  }
};

const setGenerationStatus = (message, tone = 'info') => {
  if (message) {
    generationStatus.textContent = message;
    generationStatus.dataset.tone = tone;
  } else {
    generationStatus.textContent = '';
    delete generationStatus.dataset.tone;
  }
};

const applyModelsToSelect = (buckets, preferredModel) => {
  const desired = preferredModel ?? modelSelect.value;
  modelSelect.innerHTML = '';
  let total = 0;

  bucketOrder.forEach((bucket) => {
    const models = buckets[bucket];
    if (!models || !models.length) return;

    const group = document.createElement('optgroup');
    group.label = bucketLabels[bucket];

    models.forEach((id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      if (id === desired) {
        option.selected = true;
      }
      group.appendChild(option);
      total += 1;
    });

    modelSelect.appendChild(group);
  });

  if (!total) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No models available';
    modelSelect.appendChild(option);
    modelSelect.disabled = true;
  } else {
    modelSelect.disabled = false;
    if (!modelSelect.value && modelSelect.options.length > 0) {
      modelSelect.selectedIndex = 0;
    }
  }

  return total;
};

const getSelectedMood = () => {
  const checked = moodInputs.find((input) => input.checked);
  return checked ? checked.value : 'reverent hush';
};

const toggleKeyVisibility = () => {
  revealKey = !revealKey;
  apiKeyInput.type = revealKey ? 'text' : 'password';
  toggleKeyVisibilityButton.textContent = revealKey ? 'Hide' : 'Reveal';
};

toggleKeyVisibilityButton.addEventListener('click', toggleKeyVisibility);

const refreshModels = async ({ force = false } = {}) => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    setModelStatus('Enter an API key to fetch model listings.', 'warn');
    return;
  }

  const cached = modelCache.get(apiKey);
  if (cached && !force) {
    applyModelsToSelect(cached.buckets);
    setModelStatus(`Using cached listing from ${new Date(cached.fetchedAt).toLocaleTimeString()}.`, 'info');
    return;
  }

  setModelStatus('Fetching models from OpenAI…', 'info');
  modelSelect.disabled = true;

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        setModelStatus('The API key was rejected. Showing last known models if available.', 'error');
        if (cached) {
          applyModelsToSelect(cached.buckets);
        } else {
          applyModelsToSelect(fallbackBuckets);
          modelSelect.disabled = false;
        }
        return;
      }

      throw new Error(text || `Model refresh failed (${response.status}).`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const buckets = bucketizeModels(items);
    modelCache.set(apiKey, { buckets, fetchedAt: Date.now() });

    const total = applyModelsToSelect(buckets);
    const bucketCount = Object.values(buckets).filter((arr) => arr.length).length;
    setModelStatus(`Loaded ${total} models across ${bucketCount} bucket${bucketCount === 1 ? '' : 's'}.`, 'success');

    if (total === 0) {
      applyModelsToSelect(fallbackBuckets);
      setModelStatus('No models returned; falling back to reference catalog.', 'warn');
    }
  } catch (error) {
    console.error('Model refresh error', error);
    setModelStatus(`Failed to refresh models: ${error.message}`, 'error');
    if (cached) {
      applyModelsToSelect(cached.buckets);
    } else {
      applyModelsToSelect(fallbackBuckets);
      modelSelect.disabled = false;
    }
  }
};

refreshModelsButton.addEventListener('click', () => refreshModels({ force: true }));

apiKeyInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    refreshModels({ force: true });
  }
});

const clearObservation = () => {
  observationText.textContent = '';
  observationText.hidden = true;
  observationPlaceholder.hidden = false;
  setGenerationStatus('');
};

clearButton.addEventListener('click', () => {
  form.reset();
  clearObservation();
});

const buildPrompt = ({
  sector,
  specimen,
  phenomenon,
  instrument,
  mood,
  notes
}) => {
  const emphasis = notes ? `Incorporate these fragments verbatim where they make sense: ${notes.trim()}.` : 'Feel free to improvise shimmering sensory details.';

  return [
    'You are an interstellar botanist creating lyrical but precise field notes.',
    'Write in rich, evocative prose while keeping the structure readable.',
    'Include sensory impressions (scent, texture, sonic traces) and at least one observation about the instrument mentioned.',
    'Close with a concise recommendation for the next caretaker that fits the chosen mood.',
    '',
    `Observation site: ${sector}.`,
    `Specimen focus: ${specimen}.`,
    `Phenomenon under study: ${phenomenon}.`,
    `Instrument assisting: ${instrument}.`,
    `Mood to carry: ${mood}.`,
    emphasis
  ].join('\n');
};

const ensureModelSelected = () => {
  if (!modelSelect.value) {
    applyModelsToSelect(fallbackBuckets);
    modelSelect.disabled = false;
    modelSelect.value = fallbackBuckets.chat[0] || fallbackModelIds[0];
  }
  return modelSelect.value;
};

const generateObservation = async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setGenerationStatus('Provide an OpenAI API key to synthesize a report.', 'warn');
    apiKeyInput.focus();
    return;
  }

  const sector = sectorInput.value.trim();
  const specimen = specimenInput.value.trim();

  if (!sector || !specimen) {
    setGenerationStatus('Fill in both sector and specimen to brief the botanist.', 'warn');
    return;
  }

  const phenomenon = phenomenonInput.value;
  const instrument = instrumentInput.value;
  const mood = getSelectedMood();
  const notes = notesInput.value;
  const prompt = buildPrompt({ sector, specimen, phenomenon, instrument, mood, notes });
  const model = ensureModelSelected();

  generateButton.disabled = true;
  generateButton.dataset.loading = 'true';
  const originalLabel = generateButton.textContent;
  generateButton.textContent = 'Synthesizing…';
  setGenerationStatus('Consulting the cosmic botanist…', 'info');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          { role: 'system', content: 'You are a poetic field researcher cataloging interstellar flora with scientific rigor.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        setGenerationStatus('The botanist could not authenticate with this key.', 'error');
      } else {
        setGenerationStatus(text || `OpenAI request failed (${response.status}).`, 'error');
      }
      return;
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message?.content;

    if (!message) {
      setGenerationStatus('No lyrical note was returned. Try again.', 'warn');
      return;
    }

    observationText.textContent = message.trim();
    observationText.hidden = false;
    observationPlaceholder.hidden = true;
    setGenerationStatus('Field note captured. Archive when ready.', 'success');
  } catch (error) {
    console.error('Generation error', error);
    setGenerationStatus(`Failed to synthesize observation: ${error.message}`, 'error');
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = originalLabel;
    delete generateButton.dataset.loading;
  }
};

generateButton.addEventListener('click', generateObservation);

// Populate the select with fallback models so the UI feels alive immediately.
applyModelsToSelect(fallbackBuckets);
modelSelect.disabled = false;
modelSelect.value = fallbackBuckets.chat[0] || fallbackModelIds[0];
setModelStatus('Using reference model catalog. Provide an API key to refresh.', 'info');
