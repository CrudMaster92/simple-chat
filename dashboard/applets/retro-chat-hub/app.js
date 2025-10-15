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

  const DEFAULT_ASSISTANT_PROMPT =
    'You are a calm, capable AI assistant. Provide clear, factual, and friendly answers without referencing retro themes unless the user explicitly asks.';

  const state = {
    provider: 'openai',
    chats: [],
    activeChatId: null,
    rememberKeys: false,
    composerAttachments: [],
    pendingReply: false,
    isSummarizing: false,
    systemPrompts: {
      openai: DEFAULT_ASSISTANT_PROMPT,
      gemini: DEFAULT_ASSISTANT_PROMPT,
    },
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

  let summaryStatusTimer = 0;

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
    elements.systemPromptInput = document.getElementById('systemPromptInput');
    elements.connectionStatus = document.getElementById('connectionStatus');
    elements.activeChatTitle = document.getElementById('activeChatTitle');
    elements.chatMeta = document.getElementById('chatMeta');
    elements.typingIndicator = document.getElementById('typingIndicator');
    elements.summaryStatus = document.getElementById('summaryStatus');
    elements.messageList = document.getElementById('messageList');
    elements.composer = document.getElementById('composer');
    elements.messageInput = document.getElementById('messageInput');
    elements.sendButton = document.getElementById('sendButton');
    elements.imageInput = document.getElementById('imageInput');
    elements.attachmentPreview = document.getElementById('attachmentPreview');
    elements.voiceButton = document.getElementById('voiceButton');
    elements.voiceStatus = document.getElementById('voiceStatus');
    elements.summarizeButton = document.getElementById('summarizeChatButton');
    elements.copyTranscriptButton = document.getElementById('copyTranscriptButton');
    elements.resetContextButton = document.getElementById('resetContextButton');
    elements.renameChatButton = document.getElementById('renameChatButton');
    elements.insightStats = document.getElementById('insightStats');
    elements.insightSummary = document.getElementById('insightSummary');
    elements.insightFooter = document.getElementById('insightFooter');
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

    if (elements.systemPromptInput) {
      elements.systemPromptInput.addEventListener('input', (event) => {
        const value = event.target.value;
        state.systemPrompts[state.provider] = value;
      });
      elements.systemPromptInput.addEventListener('blur', () => {
        persistSettings();
      });
    }

    elements.composer.addEventListener('submit', onSendMessage);
    elements.imageInput.addEventListener('change', onAttachmentsSelected);

    elements.voiceButton.addEventListener('click', toggleVoiceInput);
    elements.messageList.addEventListener('click', handleMessageListClick);

    if (elements.summarizeButton) {
      elements.summarizeButton.addEventListener('click', summarizeChat);
    }
    if (elements.copyTranscriptButton) {
      elements.copyTranscriptButton.addEventListener('click', copyTranscript);
    }
    if (elements.resetContextButton) {
      elements.resetContextButton.addEventListener('click', resetContext);
    }
    if (elements.renameChatButton) {
      elements.renameChatButton.addEventListener('click', renameActiveChat);
    }
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
        if (typeof savedSettings.openaiSystemPrompt === 'string') {
          state.systemPrompts.openai = savedSettings.openaiSystemPrompt || '';
        }
        if (typeof savedSettings.geminiSystemPrompt === 'string') {
          state.systemPrompts.gemini = savedSettings.geminiSystemPrompt || '';
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
      openaiSystemPrompt: state.systemPrompts.openai,
      geminiSystemPrompt: state.systemPrompts.gemini,
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

    updateSystemPromptField();
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

  function updateSystemPromptField() {
    if (!elements.systemPromptInput) return;
    const stored = state.systemPrompts[state.provider];
    elements.systemPromptInput.value = stored || '';
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
      renderSessionInsights(null);
      return;
    }

    elements.activeChatTitle.textContent = chat.title || 'Untitled session';
    const messageCount = chat.messages?.length || 0;
    elements.chatMeta.textContent = `${messageCount} message${messageCount === 1 ? '' : 's'}`;

    elements.messageList.innerHTML = '';
    chat.messages.forEach((message) => {
      const bubble = document.createElement('article');
      bubble.className = 'message' + (message.role === 'assistant' ? ' message--assistant' : '');
      bubble.dataset.messageId = message.id;
      bubble.dataset.role = message.role;

      const role = document.createElement('p');
      role.className = 'message__role';
      role.textContent = `${message.role.toUpperCase()} · ${message.model || state.provider}`;
      bubble.append(role);

      const body = document.createElement('div');
      body.className = 'message__body';
      renderMessageBody(body, message.content || '');
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

      const actions = document.createElement('div');
      actions.className = 'message__actions';
      actions.append(createMessageAction('Copy', 'copy'));
      actions.append(createMessageAction('Quote', 'quote'));
      actions.append(createMessageAction('Delete', 'delete'));
      bubble.append(actions);

      elements.messageList.append(bubble);
    });

    renderSessionInsights(chat);

  }

  function switchProvider(provider) {
    if (state.provider === provider) return;
    state.provider = provider;
    renderProviderTabs();
    renderModelSelect();
    elements.apiKeyInput.value = provider === 'openai' ? state.openai.key : state.gemini.key;
    updateSystemPromptField();
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

  async function onSendMessage(event) {
    event.preventDefault();
    const text = elements.messageInput.value.trim();
    if (!text && !state.composerAttachments.length) {
      return;
    }
    if (state.pendingReply) {
      setTypingIndicator('Hold on—finishing the previous response.');
      return;
    }

    const providerForSend = state.provider;
    if (!requireProviderKey(providerForSend)) {
      return;
    }

    const chat = getActiveChat();
    if (!chat) return;

    const messageContent = text || (state.composerAttachments.length ? '[Image attachments]' : '');

    const userMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
      model: `${providerForSend}:${getSelectedModel()}`,
      attachments: state.composerAttachments.slice(),
    };

    chat.messages.push(userMessage);
    chat.updatedAt = userMessage.createdAt;
    if (!chat.title || chat.title === 'New conversation') {
      chat.title = createTitleFromMessage(text) || chat.title;
    }
    playChime('send');

    elements.messageInput.value = '';
    state.composerAttachments = [];
    renderAttachments();
    persistChats();
    renderActiveChat();
    scrollMessagesToEnd();
    updateChatMeta(chat);

    try {
      setComposerBusy(true);
      await requestAssistantResponse(chat, userMessage);
    } finally {
      setComposerBusy(false);
    }
  }

  function getActiveChat() {
    return state.chats.find((entry) => entry.id === state.activeChatId) || null;
  }

  function requireProviderKey(provider) {
    const key = getKeyForProvider(provider);
    if (key) return true;
    const label = provider === 'gemini' ? 'Gemini' : 'OpenAI';
    alert(`Add your ${label} API key in the provider panel to continue.`);
    if (elements.apiKeyInput) {
      elements.apiKeyInput.focus();
    }
    return false;
  }

  function setComposerBusy(isBusy) {
    state.pendingReply = isBusy;
    if (elements.sendButton) {
      elements.sendButton.disabled = isBusy;
      elements.sendButton.textContent = isBusy ? 'Sending…' : 'Send';
    }
  }

  function setTypingIndicator(message) {
    if (elements.typingIndicator) {
      elements.typingIndicator.textContent = message || '';
    }
  }

  function setSummaryStatus(message) {
    if (!elements.summaryStatus) return;
    elements.summaryStatus.textContent = message || '';
    if (summaryStatusTimer) {
      clearTimeout(summaryStatusTimer);
      summaryStatusTimer = 0;
    }
    if (message) {
      summaryStatusTimer = window.setTimeout(() => {
        if (elements.summaryStatus.textContent === message) {
          elements.summaryStatus.textContent = '';
        }
      }, 4000);
    }
  }

  async function requestAssistantResponse(chat, userMessage) {
    const [providerKey, modelId] = (userMessage.model || `${state.provider}:${getSelectedModel()}`).split(':');
    const provider = providerKey === 'gemini' ? 'gemini' : 'openai';
    const key = getKeyForProvider(provider);
    if (!key) {
      setTypingIndicator(`Add a ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} key to continue.`);
      return;
    }

    const activeModel = modelId || (provider === 'gemini' ? state.gemini.selectedModel : state.openai.selectedModel);
    const temperature = clamp(parseFloat(elements.temperatureInput.value), 0, 2, 0.7);
    const systemPrompt = getSystemPrompt(provider);

    setTypingIndicator(`Contacting ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}…`);

    try {
      let content = '';
      if (provider === 'openai') {
        const messages = prepareOpenAIMessages(chat, systemPrompt);
        content = await callOpenAIChat({ key, model: activeModel, messages, temperature });
      } else {
        const payload = prepareGeminiPayload(chat, systemPrompt);
        content = await callGeminiChat({ key, model: activeModel, payload, temperature });
      }

      const finalContent = (content || '').trim() || 'I’m ready for the next step whenever you are.';
      const assistantMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
        role: 'assistant',
        content: finalContent,
        createdAt: new Date().toISOString(),
        model: `${provider}:${activeModel}`,
        attachments: [],
      };
      chat.messages.push(assistantMessage);
      chat.updatedAt = assistantMessage.createdAt;
      persistChats();
      if (state.activeChatId === chat.id) {
        renderActiveChat();
        scrollMessagesToEnd();
      }
      updateChatMeta(chat);
      playChime('receive');
      setTypingIndicator('');
    } catch (error) {
      console.error('Assistant response failed', error);
      const message = error.message || 'Unable to reach the model.';
      const assistantMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 2),
        role: 'assistant',
        content: `⚠️ ${message}`,
        createdAt: new Date().toISOString(),
        model: `${provider}:${modelId || activeModel}`,
        attachments: [],
        isError: true,
      };
      chat.messages.push(assistantMessage);
      chat.updatedAt = assistantMessage.createdAt;
      persistChats();
      if (state.activeChatId === chat.id) {
        renderActiveChat();
      }
      updateChatMeta(chat);
      setTypingIndicator(message);
    }
  }

  const RESPONSES_MODEL_PATTERNS = [/^gpt-4\.1/i, /^gpt-5/i, /^o[0-9]/i, /^o-mini/i];

  function shouldUseOpenAIResponses(modelId) {
    if (!modelId) return false;
    return RESPONSES_MODEL_PATTERNS.some((pattern) => pattern.test(String(modelId).trim()));
  }

  function extractTextParts(parts) {
    if (!parts) return '';
    const list = Array.isArray(parts) ? parts : [parts];
    let buffer = '';
    list.forEach((part) => {
      if (!part) return;
      if (typeof part === 'string') {
        buffer += part;
        return;
      }
      if (typeof part.text === 'string') {
        buffer += part.text;
        return;
      }
      if (typeof part.value === 'string') {
        buffer += part.value;
        return;
      }
      if (typeof part.content === 'string') {
        buffer += part.content;
        return;
      }
      if (Array.isArray(part.content)) {
        buffer += extractTextParts(part.content);
      }
    });
    return buffer.trim();
  }

  function extractChatCompletionText(payload) {
    if (!payload) return '';
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    for (const choice of choices) {
      const message = choice && choice.message;
      if (!message) continue;
      if (typeof message.content === 'string' && message.content.trim()) {
        return message.content.trim();
      }
      if (Array.isArray(message.content)) {
        const text = extractTextParts(message.content);
        if (text) return text;
      }
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
    return '';
  }

  function extractResponsesText(payload) {
    if (!payload) return '';
    if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
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
      const text = extractTextParts(parts);
      if (text) return text;
    }
    if (Array.isArray(payload.messages)) {
      for (const message of payload.messages) {
        if (message?.role === 'assistant') {
          const text =
            typeof message.content === 'string'
              ? message.content.trim()
              : extractTextParts(message.content);
          if (text) return text;
        }
      }
    }
    return '';
  }

  function buildResponsesInput(messages) {
    return messages.map((message) => {
      const role = message.role || 'user';
      const text = typeof message.content === 'string' ? message.content : '';
      const type = role === 'assistant' ? 'output_text' : 'input_text';
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

  function shouldRetryWithResponses(error) {
    if (!error) return false;
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    if (!message) return false;
    if (message.includes('responses api') || message.includes('responses endpoint')) return true;
    if (message.includes('unrecognized request argument') && message.includes('messages')) return true;
    return false;
  }

  async function callOpenAIChatCompletions({ key, model, messages, temperature }) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(extractErrorMessage(text, response.statusText || 'Request failed.'));
      error.status = response.status;
      error.responseText = text;
      throw error;
    }
    const payload = safeJsonParse(text);
    if (!payload) {
      throw new Error('Invalid JSON returned from OpenAI.');
    }
    const content = extractChatCompletionText(payload);
    if (!content) {
      throw new Error('OpenAI response did not include any message text.');
    }
    return content;
  }

  async function callOpenAIResponses({ key, model, messages, temperature }) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        input: buildResponsesInput(messages),
      }),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(extractErrorMessage(text, response.statusText || 'Request failed.'));
      error.status = response.status;
      error.responseText = text;
      throw error;
    }
    const payload = safeJsonParse(text);
    if (!payload) {
      throw new Error('Invalid JSON returned from OpenAI.');
    }
    const content = extractResponsesText(payload) || extractChatCompletionText(payload);
    if (!content) {
      throw new Error('OpenAI response did not include any message text.');
    }
    return content;
  }

  async function callOpenAIChat({ key, model, messages, temperature }) {
    if (shouldUseOpenAIResponses(model)) {
      return callOpenAIResponses({ key, model, messages, temperature });
    }
    try {
      return await callOpenAIChatCompletions({ key, model, messages, temperature });
    } catch (error) {
      if (shouldRetryWithResponses(error)) {
        return callOpenAIResponses({ key, model, messages, temperature });
      }
      throw error;
    }
  }

  async function callGeminiChat({ key, model, payload, temperature }) {
    const body = {
      ...payload,
      generationConfig: Object.assign({ temperature }, payload.generationConfig || {}),
    };
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(extractErrorMessage(text, response.statusText || 'Request failed.'));
    }
    const data = safeJsonParse(text);
    if (data?.error?.message) {
      throw new Error(data.error.message);
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const content = parts
      .map((part) => part.text || '')
      .join('');
    return content.trim();
  }

  function prepareOpenAIMessages(chat, systemPrompt, extraPrompt) {
    const messages = [];
    const trimmedPrompt = (systemPrompt || '').trim();
    if (trimmedPrompt) {
      messages.push({ role: 'system', content: trimmedPrompt });
    }
    chat.messages
      .filter((message) => message.role === 'assistant' || message.role === 'user')
      .forEach((message) => {
        messages.push({ role: message.role, content: message.content || '' });
      });
    if (extraPrompt) {
      messages.push({ role: 'user', content: extraPrompt });
    }
    return messages;
  }

  function prepareGeminiPayload(chat, systemPrompt, extraPrompt) {
    const contents = chat.messages
      .filter((message) => message.role === 'assistant' || message.role === 'user')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content || '' }],
      }));
    if (extraPrompt) {
      contents.push({ role: 'user', parts: [{ text: extraPrompt }] });
    }
    const trimmedPrompt = (systemPrompt || '').trim();
    const payload = { contents };
    if (trimmedPrompt) {
      payload.systemInstruction = { parts: [{ text: trimmedPrompt }] };
    }
    return payload;
  }

  function getSystemPrompt(provider) {
    const stored = state.systemPrompts[provider] || '';
    const trimmed = stored.trim();
    return trimmed || DEFAULT_ASSISTANT_PROMPT;
  }

  function renderMessageBody(container, text) {
    container.innerHTML = '';
    const normalized = (text || '').replace(/\r\n/g, '\n');
    const segments = normalized.split(/\n{2,}/).filter((segment) => segment.trim().length);
    if (!segments.length) {
      const paragraph = document.createElement('p');
      paragraph.className = 'message__paragraph';
      paragraph.textContent = normalized.trim();
      container.append(paragraph);
      return;
    }
    segments.forEach((segment) => {
      const paragraph = document.createElement('p');
      paragraph.className = 'message__paragraph';
      paragraph.textContent = segment.trim();
      container.append(paragraph);
    });
  }

  function createMessageAction(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'message__action';
    button.dataset.action = action;
    button.textContent = label;
    return button;
  }

  function handleMessageListClick(event) {
    const button = event.target.closest('.message__action');
    if (!button) return;
    const bubble = button.closest('[data-message-id]');
    if (!bubble) return;
    const chat = getActiveChat();
    if (!chat) return;
    const message = chat.messages.find((entry) => entry.id === bubble.dataset.messageId);
    if (!message) return;

    switch (button.dataset.action) {
      case 'copy':
        copyToClipboard(message.content || '')
          .then(() => setSummaryStatus('Message copied.'))
          .catch(() => setSummaryStatus('Clipboard copy blocked.'));
        break;
      case 'quote':
        quoteMessage(message);
        break;
      case 'delete':
        deleteMessageFromChat(chat, message.id);
        break;
      default:
        break;
    }
  }

  async function copyTranscript() {
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) {
      setSummaryStatus('Start the conversation before copying a transcript.');
      return;
    }
    const transcript = chat.messages
      .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'You'}: ${message.content || ''}`)
      .join('\n\n');
    try {
      await copyToClipboard(transcript);
      setSummaryStatus('Transcript copied to clipboard.');
    } catch (error) {
      console.error('Copy transcript failed', error);
      setSummaryStatus('Clipboard copy blocked.');
    }
  }

  async function summarizeChat() {
    if (state.isSummarizing) return;
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) {
      setSummaryStatus('Add a few messages before summarizing.');
      return;
    }
    const provider = state.provider;
    if (!requireProviderKey(provider)) {
      return;
    }
    state.isSummarizing = true;
    setSummaryStatus('Summarizing…');
    const summaryPrompt =
      'Summarize this conversation in three concise bullet points and include one suggested next step.';
    try {
      let summaryText = '';
      if (provider === 'openai') {
        const messages = prepareOpenAIMessages(chat, getSystemPrompt(provider), summaryPrompt);
        summaryText = await callOpenAIChat({
          key: state.openai.key,
          model: state.openai.selectedModel,
          messages,
          temperature: 0.4,
        });
      } else {
        const payload = prepareGeminiPayload(chat, getSystemPrompt(provider), summaryPrompt);
        summaryText = await callGeminiChat({
          key: state.gemini.key,
          model: state.gemini.selectedModel,
          payload,
          temperature: 0.4,
        });
      }
      chat.summary = summaryText.trim();
      chat.updatedAt = new Date().toISOString();
      persistChats();
      renderSessionInsights(chat);
      setSummaryStatus('Summary updated.');
    } catch (error) {
      console.error('Summarize failed', error);
      setSummaryStatus(`Summary failed: ${error.message || 'Unknown error'}`);
    } finally {
      state.isSummarizing = false;
    }
  }

  function resetContext() {
    const chat = getActiveChat();
    if (!chat) return;
    if (!chat.messages.length) {
      setSummaryStatus('Conversation is already empty.');
      return;
    }
    if (!window.confirm('Clear all messages from this conversation?')) return;
    chat.messages = [];
    chat.summary = '';
    chat.updatedAt = new Date().toISOString();
    persistChats();
    renderActiveChat();
    updateChatMeta(chat);
    setTypingIndicator('');
    setSummaryStatus('Conversation cleared.');
  }

  function renameActiveChat() {
    const chat = getActiveChat();
    if (!chat) return;
    const proposed = window.prompt('Name this chat', chat.title || 'Untitled session');
    if (proposed === null) return;
    const trimmed = proposed.trim();
    if (!trimmed) return;
    chat.title = trimmed;
    chat.updatedAt = new Date().toISOString();
    persistChats();
    renderChatList();
    renderActiveChat();
  }

  function quoteMessage(message) {
    if (!elements.messageInput) return;
    const snippet = (message.content || '').split('\n').map((line) => `> ${line}`).join('\n');
    const existing = elements.messageInput.value;
    const combined = existing ? `${snippet}\n\n${existing}` : `${snippet}\n\n`;
    elements.messageInput.value = combined;
    elements.messageInput.focus();
    const length = elements.messageInput.value.length;
    elements.messageInput.setSelectionRange(length, length);
  }

  function deleteMessageFromChat(chat, messageId) {
    const index = chat.messages.findIndex((entry) => entry.id === messageId);
    if (index === -1) return;
    if (!window.confirm('Remove this message from the conversation?')) return;
    chat.messages.splice(index, 1);
    chat.updatedAt = new Date().toISOString();
    persistChats();
    renderActiveChat();
    updateChatMeta(chat);
  }

  function renderSessionInsights(chat) {
    if (!elements.insightStats || !elements.insightSummary) return;
    if (!chat) {
      elements.insightStats.innerHTML = '';
      elements.insightSummary.textContent = 'Start chatting to see highlights and recaps.';
      if (elements.insightFooter) {
        elements.insightFooter.textContent = '';
      }
      return;
    }

    const total = chat.messages.length;
    const assistantCount = chat.messages.filter((message) => message.role === 'assistant').length;
    const userCount = chat.messages.filter((message) => message.role === 'user').length;
    const lastModel =
      chat.messages
        .slice()
        .reverse()
        .find((message) => message.model)?.model || `${state.provider}:${getSelectedModel()}`;
    const [providerKey, modelId] = lastModel.split(':');
    const providerLabel = providerKey === 'gemini' ? 'Gemini' : 'OpenAI';

    elements.insightStats.innerHTML = '';
    [
      { label: 'Messages', value: String(total) },
      { label: 'You vs. assistant', value: `${userCount} : ${assistantCount}` },
      { label: 'Latest model', value: `${providerLabel} · ${modelId || 'n/a'}` },
    ].forEach(({ label, value }) => {
      const item = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = value;
      item.append(span, strong);
      elements.insightStats.append(item);
    });

    if (chat.summary && chat.summary.trim()) {
      elements.insightSummary.textContent = chat.summary.trim();
    } else {
      elements.insightSummary.textContent = 'Use Summarize to capture the conversation so far.';
    }

    if (elements.insightFooter) {
      const created = formatTimestamp(chat.createdAt);
      const updated = formatTimestamp(chat.updatedAt || chat.createdAt);
      elements.insightFooter.textContent = `Updated ${updated} • Started ${created}`;
    }
  }

  function scrollMessagesToEnd() {
    if (elements.messageList && elements.messageList.lastElementChild) {
      elements.messageList.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  function safeJsonParse(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function extractErrorMessage(text, fallback) {
    const parsed = safeJsonParse(text);
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
    if (typeof text === 'string' && text.trim()) {
      return text.trim().slice(0, 280);
    }
    return fallback;
  }

  function getKeyForProvider(provider) {
    return provider === 'gemini' ? state.gemini.key : state.openai.key;
  }

  function updateChatMeta(chat) {
    if (state.activeChatId === chat.id) {
      elements.chatMeta.textContent = `${chat.messages.length} message${chat.messages.length === 1 ? '' : 's'}`;
      elements.activeChatTitle.textContent = chat.title || 'Untitled session';
      renderSessionInsights(chat);
    }
    renderChatList();
  }

  function selectChat(id) {
    state.activeChatId = id;
    renderChatList();
    renderActiveChat();
    elements.typingIndicator.textContent = '';
    setSummaryStatus('');
  }

  function createChat() {
    const now = new Date().toISOString();
    const chat = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: now,
      updatedAt: now,
      title: 'New conversation',
      messages: [],
    };
    state.chats.push(chat);
    state.activeChatId = chat.id;
    persistChats();
    renderChatList();
    renderActiveChat();
    setSummaryStatus('');
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
