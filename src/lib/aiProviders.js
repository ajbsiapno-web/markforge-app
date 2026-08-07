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
    defaultModels: ['qwen2.5:0.5b', 'llama3:latest', 'mistral', 'codellama'],
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

// Clean raw markdown output and ensure Mermaid diagram blocks are properly wrapped
export function cleanAiMarkdown(text) {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Strip outer ```markdown ... ``` or ```md ... ``` wrapper if present
  if (/^```(?:markdown|md)\s*\n/i.test(cleaned) && /\n\s*```$/i.test(cleaned)) {
    cleaned = cleaned.replace(/^```(?:markdown|md)\s*\n/i, '').replace(/\n\s*```$/i, '');
  }

  cleaned = cleaned.trim();

  // 2. If text starts with Mermaid diagram syntax but is missing ```mermaid fences, auto-wrap it!
  const isMermaidSyntax = /^(flowchart|graph|sequenceDiagram|classDiagram|gantt|erDiagram|journey|pie|stateDiagram|architecture)\b/i.test(cleaned);
  if (isMermaidSyntax && !cleaned.startsWith('```')) {
    cleaned = `\`\`\`mermaid\n${cleaned}\n\`\`\``;
  }

  return cleaned;
}

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
  let rawResult = '';
  if (provider === 'openai') {
    rawResult = await callOpenAI(apiKey, model, prompt);
  } else if (provider === 'anthropic') {
    rawResult = await callAnthropic(apiKey, model, prompt);
  } else if (provider === 'gemini') {
    rawResult = await callGemini(apiKey, model, prompt);
  } else {
    rawResult = await callOllama(model, prompt);
  }

  return cleanAiMarkdown(rawResult);
}

// 1. Ollama (Local) Call with Timeout & Thread Optimization
async function callOllama(model, prompt) {
  if (window.electronAPI?.ollamaCall) {
    const res = await window.electronAPI.ollamaCall({ prompt, model });
    if (res.success && res.response) return res.response.trim();
    throw new Error(res.error || 'Ollama Electron call failed');
  }

  const selectedModel = model || 'qwen2.5:0.5b';
  const payload = {
    model: selectedModel,
    prompt: `${prompt}\n\nIMPORTANT: If generating a flowchart or diagram, output valid Mermaid syntax (e.g. \`\`\`mermaid\\nflowchart TD\\n ...\\n\`\`\`). Do NOT wrap in \`\`\`markdown.`,
    stream: false,
    options: {
      temperature: 0.2,
      num_thread: 8,
    },
  };

  const tryGenerate = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return (data.response || '').trim();
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        throw new Error(`Ollama (${selectedModel}) request timed out after 25s. Switch model to "qwen2.5:0.5b" or "Google Gemini" for instant generation.`);
      }
      return null;
    }
    return null;
  };

  let result = await tryGenerate('http://localhost:11434/api/generate');
  if (!result) {
    result = await tryGenerate('http://127.0.0.1:11434/api/generate');
  }

  if (result) return result;
  throw new Error(`Ollama generation failed for model "${selectedModel}". Make sure Ollama server is running locally ("ollama serve").`);
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
      messages: [
        { role: 'system', content: 'You are a Markdown editor assistant. If generating a flowchart or diagram, write valid ```mermaid syntax. Do NOT wrap output in ```markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `OpenAI Error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content || '').trim();
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
      messages: [
        { role: 'user', content: `${prompt}\n\nIf generating a flowchart or diagram, write valid \`\`\`mermaid syntax. Do NOT wrap output in \`\`\`markdown.` }
      ],
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Anthropic Error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.content?.[0]?.text || '').trim();
}

// 4. Google Gemini Call
async function callGemini(apiKey, model, prompt) {
  if (!apiKey) throw new Error('Google Gemini API Key is required. Please set your key in AI Settings.');

  const targetModel = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}\n\nIf generating a flowchart or diagram, write valid \`\`\`mermaid syntax. Do NOT wrap output in \`\`\`markdown.` }] }],
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Gemini Error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}
