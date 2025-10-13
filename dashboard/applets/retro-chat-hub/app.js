(function () {
  const STORAGE_KEYS = {
    chats: 'retroChatHub.sessions',
    settings: 'retroChatHub.settings',
    openaiCache: 'retroChatHub.openaiModels',
  };

  const DEFAULT_GEMINI_MODELS = {
    chat: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    vision: ['gemini-1.5-flash-vision'],
    images: ['imagen-3.0'],
    audio: ['audiolight-1.0'],
    embeddings: ['text-embedding-004'],
  };

  const state = {
    provider: 'openai',
    chats: [],
    activeChatId: null,
    rememberKeys: false,
    composerAttachments: [],
    typingTimer: null,
    voice: {
      recognition: null,
      listening: false,
    },
    openai: {
      key: '',
      models: DEFAULT_OPTIONS(),
      status: 'idle',
      selectedModel: 'gpt-4o-mini',
      cache: {},
    },
    gemini: {
      key: '',
      models: DEFAULT_GEMINI_MODELS,
      selectedModel: 'gemini-1.5-flash',
    },
  };

  const STOPWORDS = new Set([
    'that',
    'with',
    'have',
    'about',
    'your',
    'from',
    'there',
    'their',
    'would',
    'could',
    'should',
    'just',
    'really',
    'this',
    'then',
    'into',
    'been',
    'were',
    'will',
    'what',
    'when',
    'where',
    'which',
    'while',
    'after',
    'before',
    'because',
    'again',
    'once',
    'even',
    'also',
    'like',
    'thing',
    'maybe',
    'some',
    'more',
    'take',
    'make',
    'going',
    'want',
    'need',
    'much',
  ]);

  const elements = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    wireEvents();
    loadState();
    initVoice();
    renderAll();
    ensureChatExists();
  }

  function cacheElements() {
    elements.main = document.querySelector('.retro-chat');
    elements.newChatButton = document.getElementById('newChatButton');
    elements.clearAllButton = document.getElementById('clearAllButton');
    elements.conversationList = document.getElementById('conversationList');
    elements.rememberKeysToggle = document.getElementById('rememberKeysToggle');
    elements.providerTabs = [...document.querySelectorAll('.provider-tab')];
    elements.apiKeyInput = document.getElementById('apiKeyInput');
    elements.loadModelsButton = document.getElementById('loadModelsButton');
    elements.modelStatus = document.getElementById('modelStatus');
    elements.modelSelect = document.getElementById('modelSelect');
    elements.temperatureInput = document.getElementById('temperatureInput');
    elements.connectionStatus = document.getElementById('connectionStatus');
    elements.activeChatTitle = document.getElementById('activeChatTitle');
    elements.chatMeta = document.getElementById('chatMeta');
    elements.typingIndicator = document.getElementById('typingIndicator');
    elements.messageList = document.getElementById('messageList');
    elements.composer = document.getElementById('composer');
    elements.messageInput = document.getElementById('messageInput');
    elements.imageInput = document.getElementById('imageInput');
    elements.attachmentPreview = document.getElementById('attachmentPreview');
    elements.voiceButton = document.getElementById('voiceButton');
    elements.voiceStatus = document.getElementById('voiceStatus');
  }

  function wireEvents() {
    elements.newChatButton.addEventListener('click', () => {
      createChat();
    });

    elements.clearAllButton.addEventListener('click', () => {
      if (confirm('Delete all saved chats?')) {
        state.chats = [];
        state.activeChatId = null;
        persistChats();
        renderChatList();
        ensureChatExists();
      }
    });

    elements.conversationList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-chat-id]');
      if (!item) return;
      selectChat(item.dataset.chatId);
    });

    elements.rememberKeysToggle.addEventListener('change', () => {
      state.rememberKeys = elements.rememberKeysToggle.checked;
      if (!state.rememberKeys) {
        state.openai.key = '';
        state.gemini.key = '';
        elements.apiKeyInput.value = '';
        elements.connectionStatus.textContent = 'Offline – add an API key to sync models.';
      }
      persistSettings();
      updateConnectionStatus();
    });

    elements.providerTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchProvider(tab.dataset.provider));
    });

    elements.apiKeyInput.addEventListener('input', (event) => {
      const key = event.target.value.trim();
      const target = state.provider === 'openai' ? state.openai : state.gemini;
      target.key = key;
      if (state.rememberKeys) {
        persistSettings();
      }
      updateConnectionStatus();
    });

    elements.loadModelsButton.addEventListener('click', handleModelRefresh);

    elements.modelSelect.addEventListener('change', (event) => {
      if (state.provider === 'openai') {
        state.openai.selectedModel = event.target.value;
      } else {
        state.gemini.selectedModel = event.target.value;
      }
      persistSettings();
    });

    elements.temperatureInput.addEventListener('change', () => {
      const clamped = clamp(parseFloat(elements.temperatureInput.value), 0, 2, 0.7);
      elements.temperatureInput.value = clamped.toFixed(1);
    });

    elements.composer.addEventListener('submit', onSendMessage);
    elements.imageInput.addEventListener('change', onAttachmentsSelected);

    elements.voiceButton.addEventListener('click', toggleVoiceInput);
  }

  function ensureChatExists() {
    if (!state.chats.length) {
      createChat();
    }
    if (!state.activeChatId && state.chats.length) {
      selectChat(state.chats[0].id);
    }
  }

  function DEFAULT_OPTIONS() {
    return {
      chat: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
      vision: ['gpt-4o-mini-vision'],
      images: ['dall-e-3'],
      audio: ['gpt-4o-mini-tts'],
      embeddings: ['text-embedding-3-large', 'text-embedding-3-small'],
      other: [],
    };
  }

  function loadState() {
    try {
      const savedChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.chats) || '[]');
      if (Array.isArray(savedChats)) {
        state.chats = savedChats.map((chat) => {
          const { memory, ...rest } = chat || {};
          return { ...rest };
        });
      }
    } catch (error) {
      console.error('Failed to load saved chats', error);
    }

    try {
      const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
      if (savedSettings) {
        state.rememberKeys = Boolean(savedSettings.rememberKeys);
        if (state.rememberKeys) {
          state.openai.key = savedSettings.openaiKey || '';
          state.gemini.key = savedSettings.geminiKey || '';
        }
        if (savedSettings.openaiSelectedModel) {
          state.openai.selectedModel = savedSettings.openaiSelectedModel;
        }
        if (savedSettings.geminiSelectedModel) {
          state.gemini.selectedModel = savedSettings.geminiSelectedModel;
        }
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }

    try {
      const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.openaiCache) || '{}');
      if (cache && typeof cache === 'object') {
        state.openai.cache = cache;
      }
    } catch (error) {
      console.error('Failed to load OpenAI cache', error);
    }
  }

  function persistChats() {
    try {
      localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(state.chats));
    } catch (error) {
      console.error('Failed to persist chats', error);
    }
  }

  function persistSettings() {
    const payload = {
      rememberKeys: state.rememberKeys,
      openaiSelectedModel: state.openai.selectedModel,
      geminiSelectedModel: state.gemini.selectedModel,
    };
    if (state.rememberKeys) {
      payload.openaiKey = state.openai.key;
      payload.geminiKey = state.gemini.key;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist settings', error);
    }
  }

  function renderAll() {
    elements.rememberKeysToggle.checked = state.rememberKeys;

    if (state.provider === 'openai') {
      elements.apiKeyInput.placeholder = 'sk-...';
      elements.apiKeyInput.value = state.openai.key;
    } else {
      elements.apiKeyInput.placeholder = 'AI...';
      elements.apiKeyInput.value = state.gemini.key;
    }

    renderProviderTabs();
    renderModelSelect();
    renderChatList();
    renderActiveChat();
    updateConnectionStatus();
  }

  function renderProviderTabs() {
    elements.providerTabs.forEach((tab) => {
      const isActive = tab.dataset.provider === state.provider;
      tab.setAttribute('aria-selected', String(isActive));
    });
    elements.main.dataset.provider = state.provider;
  }

  function renderModelSelect() {
    const models = state.provider === 'openai' ? state.openai.models : state.gemini.models;
    const selected = state.provider === 'openai' ? state.openai.selectedModel : state.gemini.selectedModel;
    const select = elements.modelSelect;
    select.innerHTML = '';

    Object.entries(models).forEach(([group, entries]) => {
      if (!entries || !entries.length) return;
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.charAt(0).toUpperCase() + group.slice(1);
      entries.forEach((model) => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        if (model === selected) {
          option.selected = true;
        }
        optgroup.append(option);
      });
      select.append(optgroup);
    });

    if (!select.children.length) {
      const option = document.createElement('option');
      option.textContent = 'No models available';
      option.disabled = true;
      option.selected = true;
      select.append(option);
    }
  }

  function renderChatList() {
    elements.conversationList.innerHTML = '';
    state.chats
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .forEach((chat) => {
        const item = document.createElement('button');
        item.className = 'sidebar__item' + (chat.id === state.activeChatId ? ' sidebar__item--active' : '');
        item.dataset.chatId = chat.id;
        item.type = 'button';

        const title = document.createElement('p');
        title.className = 'sidebar__item-title';
        title.textContent = chat.title || 'Untitled session';

        const meta = document.createElement('p');
        meta.className = 'sidebar__item-meta';
        const messageCount = chat.messages?.length || 0;
        meta.textContent = `${messageCount} message${messageCount === 1 ? '' : 's'} · ${formatTimestamp(chat.updatedAt || chat.createdAt)}`;

        item.append(title, meta);
        elements.conversationList.append(item);
      });
  }

  function renderActiveChat() {
    const chat = state.chats.find((entry) => entry.id === state.activeChatId);
    if (!chat) {
      elements.activeChatTitle.textContent = 'Untitled session';
      elements.chatMeta.textContent = '0 messages';
      elements.messageList.innerHTML = '';
      return;
    }

    elements.activeChatTitle.textContent = chat.title || 'Untitled session';
    const messageCount = chat.messages?.length || 0;
    elements.chatMeta.textContent = `${messageCount} message${messageCount === 1 ? '' : 's'}`;

    elements.messageList.innerHTML = '';
    chat.messages.forEach((message) => {
      const bubble = document.createElement('article');
      bubble.className = 'message' + (message.role === 'assistant' ? ' message--assistant' : '');

      const role = document.createElement('p');
      role.className = 'message__role';
      role.textContent = `${message.role.toUpperCase()} · ${message.model || state.provider}`;
      bubble.append(role);

      const body = document.createElement('p');
      body.className = 'message__body';
      body.textContent = message.content;
      bubble.append(body);

      if (message.attachments?.length) {
        const attachments = document.createElement('div');
        attachments.className = 'message__attachments';
        message.attachments.forEach((asset) => {
          const img = document.createElement('img');
          img.src = asset.data;
          img.alt = asset.name || 'attachment';
          attachments.append(img);
        });
        bubble.append(attachments);
      }

      elements.messageList.append(bubble);
    });

  }

  function switchProvider(provider) {
    if (state.provider === provider) return;
    state.provider = provider;
    renderProviderTabs();
    renderModelSelect();
    elements.apiKeyInput.value = provider === 'openai' ? state.openai.key : state.gemini.key;
    updateConnectionStatus();
  }

  function onAttachmentsSelected(event) {
    const files = Array.from(event.target.files || []);
    const readers = files.map((file) => readFileAsDataURL(file).then((data) => ({
      name: file.name,
      data,
    })));

    Promise.all(readers)
      .then((results) => {
        state.composerAttachments.push(...results);
        renderAttachments();
      })
      .catch((error) => console.error('Failed to read attachments', error));

    event.target.value = '';
  }

  function renderAttachments() {
    elements.attachmentPreview.innerHTML = '';
    state.composerAttachments.forEach((attachment, index) => {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = attachment.data;
      img.alt = attachment.name;
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'composer__remove-attachment';
      removeButton.innerHTML = '&times;';
      removeButton.addEventListener('click', () => {
        state.composerAttachments.splice(index, 1);
        renderAttachments();
      });
      figure.append(img, removeButton);
      elements.attachmentPreview.append(figure);
    });
  }

  function onSendMessage(event) {
    event.preventDefault();
    const text = elements.messageInput.value.trim();
    if (!text && !state.composerAttachments.length) {
      return;
    }
    const chat = state.chats.find((entry) => entry.id === state.activeChatId);
    if (!chat) return;

    const messageContent = text || (state.composerAttachments.length ? '[Image attachments]' : '');

    const userMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
      model: `${state.provider}:${getSelectedModel()}`,
      attachments: state.composerAttachments.slice(),
    };

    chat.messages.push(userMessage);
    chat.updatedAt = userMessage.createdAt;
    if (!chat.title || chat.title === 'New retro chat') {
      chat.title = createTitleFromMessage(text) || chat.title;
    }
    playChime('send');

    elements.messageInput.value = '';
    state.composerAttachments = [];
    renderAttachments();
    persistChats();
    renderActiveChat();
    updateChatMeta(chat);

    simulateAssistantResponse(chat, userMessage);
  }

  function simulateAssistantResponse(chat, userMessage) {
    const providerLabel = userMessage.model?.startsWith('gemini') ? 'Gemini' : 'OpenAI';
    elements.typingIndicator.textContent = `Synthesizing via ${providerLabel}…`;
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
    }

    const responseDelay = 800 + Math.random() * 1200;
    state.typingTimer = setTimeout(() => {
      const [providerKey, modelId] = (userMessage.model || `${state.provider}:${getSelectedModel()}`).split(':');
      const providerName = providerKey === 'openai' ? 'OpenAI' : 'Gemini';
      const model = modelId || getSelectedModel();
      const temperature = parseFloat(elements.temperatureInput.value) || 0.7;
      const reply = composeAssistantReply({ chat, providerName, model, userMessage, temperature });

      const assistantMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
        model: `${providerKey}:${model}`,
        attachments: [],
      };
      chat.messages.push(assistantMessage);
      chat.updatedAt = assistantMessage.createdAt;
      persistChats();
      if (state.activeChatId === chat.id) {
        renderActiveChat();
        elements.typingIndicator.textContent = '';
        if (elements.messageList.lastElementChild) {
          elements.messageList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
      updateChatMeta(chat);
      playChime('receive');
      state.typingTimer = null;
    }, responseDelay);
  }

  function composeAssistantReply({ chat, providerName, model, userMessage, temperature }) {
    const text = (userMessage.content || '').trim();
    const intro = `(${providerName} · ${model} · temp ${temperature.toFixed(1)})`;

    if (!text) {
      return `${intro} I'm tuned in and ready whenever you want to share something.`;
    }

    const lower = text.toLowerCase();
    const greetingPattern = /\b(hi|hello|hey|hola|howdy)\b/;

    if (greetingPattern.test(lower)) {
      return `${intro} Hey there! I'm feeling extra neon tonight—what would you like to dive into?`;
    }

    if (lower.includes('thank')) {
      return `${intro} Anytime! I'm glad the hub could help. What should we explore next?`;
    }

    if (lower.includes('how are you')) {
      return `${intro} Running smooth and full of synth energy! How are things on your side?`;
    }

    const acknowledgement = pickRandom([
      'Got it.',
      'Understood.',
      'I hear you.',
      'Sounds good.',
    ]);

    const topic = extractTopic(text);
    const summaryLine = topic
      ? `${acknowledgement} It sounds like you're focusing on ${topic}.`
      : `${acknowledgement} I’m following along with what you’re saying.`;

    const previousUser = chat.messages
      .filter((message) => message.role === 'user')
      .slice(-2, -1)[0];

    const contextLine = previousUser
      ? `Thanks for building on your earlier point about "${truncate(previousUser.content, 60)}".`
      : '';

    const questionLike = /\?|\b(what|how|why|where|when|who|which|could|would|should)\b/.test(lower);

    const guidanceLine = questionLike
      ? pickRandom([
          'One quick approach is to outline the goal, list the constraints, and tackle each piece step-by-step.',
          'You might compare a couple of options side-by-side, jot down pros and cons, and follow the path that fits best.',
          'Try sketching the outcome you want first—then work backward to the actions that get you there.',
        ])
      : pickRandom([
          'If you’d like ideas, examples, or a plan, just say the word and we can spin one up.',
          'Happy to brainstorm or break things down further whenever you’re ready.',
          'Let me know if you want resources, bullet points, or a quick summary to keep things moving.',
        ]);

    const closing = pickRandom([
      'What should we dig into next?',
      'How can I support you further?',
      'Ready when you are for the next detail.',
    ]);

    return [intro, summaryLine, contextLine, guidanceLine, closing]
      .filter(Boolean)
      .join(' ');
  }

  function extractTopic(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter((word) => word.length > 3 && !STOPWORDS.has(word))
      .slice(0, 3)
      .join(' ');
  }

  function truncate(text, maxLength = 80) {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  function pickRandom(list) {
    if (!Array.isArray(list) || list.length === 0) return '';
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  function updateChatMeta(chat) {
    if (state.activeChatId === chat.id) {
      elements.chatMeta.textContent = `${chat.messages.length} message${chat.messages.length === 1 ? '' : 's'}`;
      elements.activeChatTitle.textContent = chat.title || 'Untitled session';
    }
    renderChatList();
  }

  function selectChat(id) {
    state.activeChatId = id;
    renderChatList();
    renderActiveChat();
    elements.typingIndicator.textContent = '';
  }

  function createChat() {
    const now = new Date().toISOString();
    const chat = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: now,
      updatedAt: now,
      title: 'New retro chat',
      messages: [],
    };
    state.chats.push(chat);
    state.activeChatId = chat.id;
    persistChats();
    renderChatList();
    renderActiveChat();
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'just now';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'just now';
    return date.toLocaleString();
  }

  function getSelectedModel() {
    return state.provider === 'openai' ? state.openai.selectedModel : state.gemini.selectedModel;
  }

  function createTitleFromMessage(message) {
    if (!message) return '';
    return message.slice(0, 32) + (message.length > 32 ? '…' : '');
  }

  function clamp(value, min, max, fallback) {
    if (Number.isNaN(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  async function handleModelRefresh() {
    if (state.provider === 'openai') {
      await refreshOpenAIModels();
    } else {
      refreshGeminiModels();
    }
  }

  function refreshGeminiModels() {
    const models = Object.fromEntries(
      Object.entries(DEFAULT_GEMINI_MODELS).map(([key, list]) => [key, list.slice()])
    );
    if (state.gemini.key) {
      elements.modelStatus.textContent = 'Using quick Gemini presets (live fetch not supported in this build).';
    } else {
      elements.modelStatus.textContent = 'Provide an API key to sync from Gemini – using presets.';
    }
    state.gemini.models = models;
    if (!models.chat.includes(state.gemini.selectedModel)) {
      state.gemini.selectedModel = models.chat[0];
    }
    renderModelSelect();
    persistSettings();
    updateConnectionStatus();
  }

  async function refreshOpenAIModels() {
    const key = state.openai.key;
    if (!key) {
      elements.modelStatus.textContent = 'Add an OpenAI key to refresh models.';
      return;
    }

    elements.modelStatus.textContent = 'Loading models…';
    state.openai.status = 'loading';

    const cacheKey = hashKey(key);
    const cached = state.openai.cache[cacheKey];
    if (cached) {
      state.openai.models = cached.models;
      state.openai.selectedModel = cached.selectedModel || cached.models.chat?.[0] || state.openai.selectedModel;
      renderModelSelect();
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          elements.modelStatus.textContent = 'Unauthorized key. Showing last known model list.';
          updateConnectionStatus('unauthorized');
        } else {
          elements.modelStatus.textContent = `Failed to load models (${response.status}).`;
        }
        state.openai.status = 'error';
        updateConnectionStatus('error');
        return;
      }

      const payload = await response.json();
      if (!payload.data) {
        throw new Error('Unexpected response payload');
      }
      const categorized = categorizeOpenAIModels(payload.data);
      state.openai.models = categorized;
      if (!categorized.chat.includes(state.openai.selectedModel)) {
        state.openai.selectedModel = categorized.chat[0] || state.openai.selectedModel;
      }
      state.openai.cache[cacheKey] = {
        models: categorized,
        fetchedAt: Date.now(),
        selectedModel: state.openai.selectedModel,
      };
      persistOpenAICache();
      elements.modelStatus.textContent = `Loaded ${countTotalModels(categorized)} models.`;
      updateConnectionStatus('online');
      renderModelSelect();
      persistSettings();
    } catch (error) {
      console.error('Failed to fetch models', error);
      elements.modelStatus.textContent = 'Could not reach OpenAI – using cached list if available.';
      state.openai.status = 'error';
      updateConnectionStatus('error');
    }
  }

  function categorizeOpenAIModels(models) {
    const buckets = DEFAULT_OPTIONS();
    Object.keys(buckets).forEach((key) => (buckets[key] = []));

    models.forEach((model) => {
      const id = model.id || '';
      const target = inferBucket(id);
      buckets[target].push(id);
    });

    Object.keys(buckets).forEach((key) => {
      buckets[key] = Array.from(new Set(buckets[key])).sort();
    });
    return buckets;
  }

  function inferBucket(id) {
    if (/embedding/i.test(id)) return 'embeddings';
    if (/whisper|tts|audio/i.test(id)) return 'audio';
    if (/image-\d|dall-e|image-edit/i.test(id)) return 'images';
    if (/vision|omni-moderation|gpt-4o-mini-vision/i.test(id)) return 'vision';
    if (/gpt-|chat|o-mini|omni/i.test(id)) return 'chat';
    if (/edit/i.test(id)) return 'other';
    return 'other';
  }

  function countTotalModels(groups) {
    return Object.values(groups).reduce((total, list) => total + (list?.length || 0), 0);
  }

  function persistOpenAICache() {
    try {
      localStorage.setItem(STORAGE_KEYS.openaiCache, JSON.stringify(state.openai.cache));
    } catch (error) {
      console.error('Failed to persist OpenAI cache', error);
    }
  }

  function updateConnectionStatus(stateName) {
    if (state.provider === 'gemini') {
      elements.connectionStatus.textContent = state.gemini.key
        ? 'Gemini key loaded locally.'
        : 'Offline – add an API key to sync models.';
      return;
    }

    switch (stateName) {
      case 'online':
        elements.connectionStatus.textContent = 'Connected to OpenAI – models refreshed.';
        break;
      case 'unauthorized':
        elements.connectionStatus.textContent = 'OpenAI rejected the key. Check and try again.';
        break;
      case 'error':
        elements.connectionStatus.textContent = 'OpenAI unavailable – using cached models.';
        break;
      default:
        elements.connectionStatus.textContent = state.openai.key
          ? 'Key stored locally. Refresh to sync models.'
          : 'Offline – add an API key to sync models.';
    }
  }

  function hashKey(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.voiceButton.disabled = true;
      elements.voiceStatus.textContent = 'Voice capture is unavailable in this browser.';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      elements.messageInput.value = `${elements.messageInput.value} ${transcript}`.trim();
      elements.voiceStatus.textContent = 'Voice captured.';
    };
    recognition.onstart = () => {
      state.voice.listening = true;
      elements.voiceStatus.textContent = 'Listening…';
      elements.voiceButton.classList.add('pixel-button--primary');
      elements.voiceButton.classList.remove('pixel-button--ghost');
    };
    recognition.onend = () => {
      state.voice.listening = false;
      elements.voiceButton.classList.remove('pixel-button--primary');
      elements.voiceButton.classList.add('pixel-button--ghost');
      if (!elements.voiceStatus.textContent.includes('captured')) {
        elements.voiceStatus.textContent = 'Voice capture stopped.';
      }
    };
    recognition.onerror = (event) => {
      elements.voiceStatus.textContent = `Voice error: ${event.error}`;
    };

    state.voice.recognition = recognition;
  }

  function toggleVoiceInput() {
    if (!state.voice.recognition) return;
    if (state.voice.listening) {
      state.voice.recognition.stop();
    } else {
      try {
        state.voice.recognition.start();
      } catch (error) {
        elements.voiceStatus.textContent = 'Voice capture could not start.';
      }
    }
  }

  function playChime(type) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const context = playChime.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    playChime.audioContext = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = type === 'send' ? 660 : 440;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }
})();
