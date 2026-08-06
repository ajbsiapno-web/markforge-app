/* ===================================================================
   MULTI-PROVIDER AI ENGINE FOR MARKFORGE
   Supports: Ollama (Local), OpenAI, Anthropic Claude, and Google Gemini
   =================================================================== */

export const AI_PROVIDERS = {
  ollama: {
    id: 'ollama',
    name: 'Local Ollama',
    icon: '💻',
    requiresKey: false,
    defaultModels: ['llama3:latest', 'mistral', 'codellama', 'gemma'],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '⚡',
    requiresKey: true,
    keyPlaceholder: 'sk-proj-...',
    defaultModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🧠',
    requiresKey: true,
    keyPlaceholder: 'sk-ant-api...',
    defaultModels: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307'],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    requiresKey: true,
    keyPlaceholder: 'AIzaSy...',
    defaultModels: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  },
};

// Key Management helpers
export function getSavedApiKey(providerId) {
  try {
    return localStorage.getItem(`markforge_apikey_${providerId}`) || '';
  } catch {
    return '';
  }
}

export function saveApiKey(providerId, apiKey) {
  try {
    localStorage.setItem(`markforge_apikey_${providerId}`, apiKey.trim());
  } catch (e) {
    console.error(e);
  }
}

// Unified Multi-Provider AI Call Handler
export async function executeAiPrompt({ provider, model, apiKey, prompt }) {
  if (provider === 'openai') {
    return callOpenAI(apiKey, model, prompt);
  } else if (provider === 'anthropic') {
    return callAnthropic(apiKey, model, prompt);
  } else if (provider === 'gemini') {
    return callGemini(apiKey, model, prompt);
  } else {
    return callOllama(model, prompt);
  }
}

// 1. Ollama (Local) Call
async function callOllama(model, prompt) {
  if (window.electronAPI?.ollamaCall) {
    const res = await window.electronAPI.ollamaCall({ prompt, model });
    if (res.success && res.response) return res.response.trim();
    throw new Error(res.error || 'Ollama Electron call failed');
  }

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!response.ok) throw new Error(`Ollama HTTP Error: ${response.statusText}`);
  const data = await response.json();
  return (data.response || '').trim();
}

// 2. OpenAI Call
async function callOpenAI(apiKey, model, prompt) {
  if (!apiKey) throw new Error('OpenAI API Key is required. Please set your key in AI Settings.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `OpenAI Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// 3. Anthropic Claude Call
async function callAnthropic(apiKey, model, prompt) {
  if (!apiKey) throw new Error('Anthropic API Key is required. Please set your key in AI Settings.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Anthropic Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || '';
}

// 4. Google Gemini Call
async function callGemini(apiKey, model, prompt) {
  if (!apiKey) throw new Error('Google Gemini API Key is required. Please set your key in AI Settings.');

  const selectedModel = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Gemini Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}
