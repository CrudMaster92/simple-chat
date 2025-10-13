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
    memoryEnabled: true,
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
    elements.memoryToggle = document.getElementById('memoryToggle');
    elements.rememberKeysToggle = document.getElementById('rememberKeysToggle');
    elements.providerTabs = [...document.querySelectorAll('.provider-tab')];
    elements.apiKeyInput = document.getElementById('apiKeyInput');
    elements.loadModelsButton = document.getElementById('loadModelsButton');
    elements.modelStatus = document.getElementById('modelStatus');
    elements.modelSelect = document.getElementById('modelSelect');
    elements.temperatureInput = document.getElementById('temperatureInput');
    elements.memoryEditor = document.getElementById('memoryEditor');
    elements.memorySummary = document.getElementById('memorySummary');
    elements.editMemoryButton = document.getElementById('editMemoryButton');
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

    elements.memoryToggle.addEventListener('change', () => {
      state.memoryEnabled = elements.memoryToggle.checked;
      persistSettings();
      updateMemoryVisibility();
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

    elements.editMemoryButton.addEventListener('click', toggleMemoryEditor);

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
        state.chats = savedChats;
      }
    } catch (error) {
      console.error('Failed to load saved chats', error);
    }

    try {
      const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
      if (savedSettings) {
        state.rememberKeys = Boolean(savedSettings.rememberKeys);
        state.memoryEnabled = savedSettings.memoryEnabled !== false;
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
      memoryEnabled: state.memoryEnabled,
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
    elements.memoryToggle.checked = state.memoryEnabled;
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
    updateMemoryVisibility();
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
      elements.memorySummary.textContent = 'No memories captured yet.';
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

    elements.memorySummary.textContent = chat.memory?.trim() ? chat.memory : 'No memories captured yet.';
    elements.memoryEditor.value = chat.memory || '';
  }

  function updateMemoryVisibility() {
    const disabled = !state.memoryEnabled;
    elements.memorySummary.style.opacity = disabled ? '0.5' : '1';
    elements.editMemoryButton.disabled = disabled;
    if (disabled) {
      elements.memorySummary.dataset.pausedText = elements.memorySummary.textContent;
      elements.memorySummary.textContent = 'Memory is paused for this workspace.';
    } else {
      const chat = state.chats.find((entry) => entry.id === state.activeChatId);
      elements.memorySummary.textContent = chat?.memory?.trim() ? chat.memory : 'No memories captured yet.';
    }
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

    if (state.memoryEnabled) {
      autoUpdateMemory(chat, userMessage.content);
    }

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
      const summary = buildMemorySummary(chat);
      const [providerKey, modelId] = (userMessage.model || `${state.provider}:${getSelectedModel()}`).split(':');
      const providerName = providerKey === 'openai' ? 'OpenAI' : 'Gemini';
      const model = modelId || getSelectedModel();
      const temperature = parseFloat(elements.temperatureInput.value) || 0.7;
      const reply = composeAssistantReply({ providerName, model, userMessage, summary, temperature });

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
      if (state.memoryEnabled) {
        autoUpdateMemory(chat, assistantMessage.content);
      }
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

  function buildMemorySummary(chat) {
    const memory = (chat.memory || '').trim();
    if (memory) return memory;
    const recentUserMessages = chat.messages.filter((msg) => msg.role === 'user').slice(-3);
    if (!recentUserMessages.length) return '';
    return recentUserMessages
      .map((msg, index) => `${index + 1}. ${msg.content.slice(0, 140)}`)
      .join('\n');
  }

  function composeAssistantReply({ providerName, model, userMessage, summary, temperature }) {
    const flavor = providerName === 'OpenAI' ? 'circuit-bright' : 'starlight';
    const intro = `(${providerName} · ${model} · temp ${temperature.toFixed(1)})`;
    const memoryLine = summary ? `I remember: ${summary.split('\n').slice(-2).join(' | ')}` : 'Nothing stored yet — starting fresh!';
    const reflection = userMessage.content
      ? `You said: "${userMessage.content.slice(0, 160)}"` + (userMessage.content.length > 160 ? '…' : '')
      : 'You sent an attachment without text.';
    const nextSteps = 'Here is a thoughtful reply crafted with retro flair.';

    return [intro, memoryLine, reflection, nextSteps, `Signature: ${flavor} assistant ready to continue.`].join('\n\n');
  }

  function updateChatMeta(chat) {
    if (state.activeChatId === chat.id) {
      elements.chatMeta.textContent = `${chat.messages.length} message${chat.messages.length === 1 ? '' : 's'}`;
      elements.activeChatTitle.textContent = chat.title || 'Untitled session';
    }
    renderChatList();
  }

  function autoUpdateMemory(chat, newMessage) {
    const tokens = newMessage
      .split(/[,.;!?:\n]/)
      .map((piece) => piece.trim())
      .filter(Boolean)
      .slice(0, 4);
    const memory = new Set((chat.memory || '').split('\n').filter(Boolean));
    tokens.forEach((token) => {
      if (token.length > 12) {
        memory.add(token);
      }
    });
    chat.memory = Array.from(memory).slice(0, 6).join('\n');
    elements.memorySummary.textContent = chat.memory || 'No memories captured yet.';
    persistChats();
  }

  function toggleMemoryEditor() {
    const editing = elements.memoryEditor.style.display === 'block';
    if (!editing) {
      const chat = state.chats.find((entry) => entry.id === state.activeChatId);
      if (!chat) return;
      elements.memoryEditor.value = chat.memory || '';
      elements.memoryEditor.style.display = 'block';
      elements.memorySummary.style.display = 'none';
      elements.editMemoryButton.textContent = 'Save';
      elements.memoryEditor.focus();
      return;
    }

    const chat = state.chats.find((entry) => entry.id === state.activeChatId);
    if (!chat) return;
    chat.memory = elements.memoryEditor.value.trim();
    elements.memorySummary.textContent = chat.memory || 'No memories captured yet.';
    elements.memoryEditor.style.display = 'none';
    elements.memorySummary.style.display = 'block';
    elements.editMemoryButton.textContent = 'Edit';
    persistChats();
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
      memory: '',
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
