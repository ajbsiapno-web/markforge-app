/* ===================================================================
   MarkForge — app.js  (renderer process)
   =================================================================== */

'use strict';

// ── Marked + highlight.js setup ──────────────────────────────────────
// marked UMD sets window.marked; hljs browser build sets window.hljs
const _marked = window.marked;
const _hljs   = window.hljs;

_marked.use({
  gfm: true,
  breaks: true,
});

// Helper: highlight code blocks in an element after rendering
function highlightCodeBlocks(container) {
  if (!_hljs) return;
  container.querySelectorAll('pre code').forEach(el => {
    if (!el.dataset.highlighted) _hljs.highlightElement(el);
  });
}


// ── DOM refs ──────────────────────────────────────────────────────────
const titlebarFile   = document.getElementById('titlebar-file');
const modifiedDot    = document.getElementById('modified-dot');
const wysiwyg        = document.getElementById('wysiwyg-editor');
const sourceEditor   = document.getElementById('source-editor');
const previewContent = document.getElementById('preview-content');
const wysiwygPane    = document.getElementById('wysiwyg-pane');
const sourcePane     = document.getElementById('source-pane');
const splitDivider   = document.getElementById('split-divider');
const previewPane    = document.getElementById('preview-pane');

const btnWysiwyg  = document.getElementById('btn-wysiwyg');
const btnSource   = document.getElementById('btn-source');
const btnSplit    = document.getElementById('btn-split');

const statusWords = document.getElementById('status-words');
const statusChars = document.getElementById('status-chars');
const statusLines = document.getElementById('status-lines');
const statusDot   = document.getElementById('status-dot');
const statusText  = document.getElementById('status-text');

const btnAI       = document.getElementById('btn-ai');
const aiDropdown  = document.getElementById('ai-dropdown');
const modelSelect = document.getElementById('model-select');

const aiOverlay   = document.getElementById('ai-overlay');
const aiModal     = document.getElementById('ai-modal');
const aiModalLabel= document.getElementById('ai-modal-label');
const aiDiffArea  = document.getElementById('ai-diff-area');
const aiSpinner   = document.getElementById('ai-spinner');
const btnApply    = document.getElementById('btn-ai-apply');
const btnCancel   = document.getElementById('btn-ai-cancel');
const btnModalClose = document.getElementById('ai-modal-close');

const toastContainer = document.getElementById('toast-container');

// ── State ─────────────────────────────────────────────────────────────
let currentMode       = 'wysiwyg'; // 'wysiwyg' | 'source' | 'split'
let currentFilePath   = null;
let isModified        = false;
let lastSavedContent  = '';
let pendingAIResult   = '';
let ollamaOnline      = false;
let availableModels   = [];

// ── Utility: get/set markdown content ────────────────────────────────
function getMarkdown() {
  if (currentMode === 'wysiwyg') {
    // Convert innerHTML back to markdown (simple approach: keep raw md in data attr)
    return sourceEditor.value;
  } else {
    return sourceEditor.value;
  }
}

function setMarkdown(md) {
  sourceEditor.value = md;
  renderWysiwyg(md);
  if (currentMode === 'split') renderPreview(md);
  updateStats(md);
}

function renderWysiwyg(md) {
  const html = _marked.parse(md || '');
  wysiwyg.innerHTML = html;
  // syntax highlight code blocks
  highlightCodeBlocks(wysiwyg);
  // add task list checkboxes
  wysiwyg.querySelectorAll('li input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', onCheckboxChange);
  });
}

function renderPreview(md) {
  previewContent.innerHTML = _marked.parse(md || '');
  highlightCodeBlocks(previewContent);
}

// ── Modified state ────────────────────────────────────────────────────
function markModified(val) {
  isModified = val;
  modifiedDot.classList.toggle('visible', val);
}

function updateTitle(filePath) {
  const name = filePath ? filePath.split(/[\\/]/).pop() : 'Untitled.md';
  titlebarFile.textContent = name;
  document.title = `${name} — MarkForge`;
}

// ── Stats ─────────────────────────────────────────────────────────────
function updateStats(md) {
  const text = md || '';
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const lines = text.split('\n').length;
  statusWords.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  statusChars.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;
  statusLines.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
}

// ── Toasts ────────────────────────────────────────────────────────────
function toast(message, type = 'info', duration = 3000) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-dot"></div><span>${message}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

// ── Ollama status ─────────────────────────────────────────────────────
async function checkOllama() {
  statusDot.className = 'status-dot loading';
  statusText.textContent = 'Checking...';
  const result = await window.electronAPI.ollamaModels();
  if (result.success && result.models.length > 0) {
    ollamaOnline = true;
    availableModels = result.models;
    statusDot.className = 'status-dot online';
    statusText.textContent = `Ollama · ${result.models.length} model${result.models.length !== 1 ? 's' : ''}`;
    populateModelSelect(result.models);
  } else if (result.success && result.models.length === 0) {
    ollamaOnline = true;
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Ollama · no models';
    populateModelSelect([]);
  } else {
    ollamaOnline = false;
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Ollama offline';
    populateModelSelect([]);
  }
}

function populateModelSelect(models) {
  modelSelect.innerHTML = '';
  if (models.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '— no models —';
    modelSelect.appendChild(opt);
    return;
  }
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });
}

// ── View switching ────────────────────────────────────────────────────
function setView(mode) {
  currentMode = mode;
  btnWysiwyg.classList.toggle('active', mode === 'wysiwyg');
  btnSource.classList.toggle('active', mode === 'source');
  btnSplit.classList.toggle('active', mode === 'split');

  wysiwygPane.classList.toggle('hidden', mode !== 'wysiwyg');
  sourcePane.classList.toggle('hidden', mode === 'wysiwyg');
  splitDivider.classList.toggle('hidden', mode !== 'split');
  previewPane.classList.toggle('hidden', mode !== 'split');

  if (mode === 'split') {
    wysiwygPane.classList.add('hidden');
    sourcePane.classList.remove('hidden');
    previewPane.classList.remove('hidden');
    renderPreview(sourceEditor.value);
  } else if (mode === 'wysiwyg') {
    renderWysiwyg(sourceEditor.value);
  }
}

btnWysiwyg.addEventListener('click', () => setView('wysiwyg'));
btnSource.addEventListener('click',  () => setView('source'));
btnSplit.addEventListener('click',   () => setView('split'));

// ── Source editor input ───────────────────────────────────────────────
sourceEditor.addEventListener('input', () => {
  const md = sourceEditor.value;
  if (currentMode === 'split') renderPreview(md);
  updateStats(md);
  markModified(md !== lastSavedContent);
});

// Tab support in source editor
sourceEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = sourceEditor.selectionStart;
    const v = sourceEditor.value;
    sourceEditor.value = v.slice(0, s) + '  ' + v.slice(sourceEditor.selectionEnd);
    sourceEditor.selectionStart = sourceEditor.selectionEnd = s + 2;
    sourceEditor.dispatchEvent(new Event('input'));
  }
});

// ── WYSIWYG editing → sync back to sourceEditor ───────────────────────
wysiwyg.addEventListener('input', () => {
  // For a true WYSIWYG we use Turndown-like conversion; here we use a lightweight approach
  const md = htmlToMarkdown(wysiwyg.innerHTML);
  sourceEditor.value = md;
  updateStats(md);
  markModified(md !== lastSavedContent);
});

// ── Checkbox toggle in WYSIWYG ────────────────────────────────────────
function onCheckboxChange(e) {
  const md = sourceEditor.value;
  const checked = e.target.checked;
  const newMd = checked
    ? md.replace(/- \[ \]/, '- [x]')
    : md.replace(/- \[x\]/i, '- [ ]');
  setMarkdown(newMd);
}

// ── Simple HTML → Markdown converter ─────────────────────────────────
function htmlToMarkdown(html) {
  // Use a lightweight DOM-based conversion
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return nodeToMarkdown(tmp).trim();
}

function nodeToMarkdown(node, depth = 0) {
  let result = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      const inner = nodeToMarkdown(child, depth);
      switch (tag) {
        case 'h1': result += `\n# ${inner}\n\n`; break;
        case 'h2': result += `\n## ${inner}\n\n`; break;
        case 'h3': result += `\n### ${inner}\n\n`; break;
        case 'h4': result += `\n#### ${inner}\n\n`; break;
        case 'h5': result += `\n##### ${inner}\n\n`; break;
        case 'h6': result += `\n###### ${inner}\n\n`; break;
        case 'p':  result += `${inner}\n\n`; break;
        case 'strong': case 'b': result += `**${inner}**`; break;
        case 'em': case 'i':    result += `*${inner}*`; break;
        case 's':  case 'del':  result += `~~${inner}~~`; break;
        case 'code':
          if (child.parentElement?.tagName === 'PRE') {
            result += inner;
          } else {
            result += '`' + inner + '`';
          }
          break;
        case 'pre': {
          const lang = child.querySelector('code')?.className?.replace(/.*language-/, '') || '';
          result += `\n\`\`\`${lang}\n${inner}\n\`\`\`\n\n`;
          break;
        }
        case 'blockquote': result += inner.split('\n').map(l => `> ${l}`).join('\n') + '\n\n'; break;
        case 'ul': result += nodeToMarkdown(child, depth).split('\n').filter(Boolean).map(l => `- ${l}`).join('\n') + '\n\n'; break;
        case 'ol': {
          let i = 1;
          for (const li of child.children) {
            result += `${i}. ${nodeToMarkdown(li, depth)}\n`;
            i++;
          }
          result += '\n';
          break;
        }
        case 'li': result += inner + '\n'; break;
        case 'a':  result += `[${inner}](${child.getAttribute('href') || ''})`; break;
        case 'img': result += `![${child.getAttribute('alt') || ''}](${child.getAttribute('src') || ''})`; break;
        case 'hr': result += '\n---\n\n'; break;
        case 'br': result += '\n'; break;
        case 'table': result += convertTable(child) + '\n'; break;
        default:   result += inner;
      }
    }
  }
  return result;
}

function convertTable(table) {
  const rows = [];
  table.querySelectorAll('tr').forEach(tr => {
    const cells = [...tr.querySelectorAll('th,td')].map(c => c.textContent.trim());
    rows.push('| ' + cells.join(' | ') + ' |');
  });
  if (rows.length >= 1) {
    const cols = rows[0].split('|').filter(Boolean).length;
    const sep  = '| ' + Array(cols).fill('---').join(' | ') + ' |';
    rows.splice(1, 0, sep);
  }
  return rows.join('\n');
}

// ── Toolbar format actions ────────────────────────────────────────────
document.querySelectorAll('.format-btn').forEach(btn => {
  btn.addEventListener('click', () => applyFormat(btn.dataset.action));
});

document.getElementById('heading-select').addEventListener('change', (e) => {
  const val = e.target.value;
  if (!val) return;
  applyHeading(val);
  e.target.value = '';
});

function applyFormat(action) {
  if (currentMode === 'wysiwyg') {
    applyWysiwygFormat(action);
  } else {
    applySourceFormat(action);
  }
}

function applyWysiwygFormat(action) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const selectedText = sel.toString();

  const map = {
    bold:          ['**', '**'],
    italic:        ['*', '*'],
    strikethrough: ['~~', '~~'],
    code:          ['`', '`'],
  };

  if (map[action]) {
    const [pre, post] = map[action];
    document.execCommand('insertText', false, `${pre}${selectedText}${post}`);
    wysiwyg.dispatchEvent(new Event('input'));
    return;
  }

  if (action === 'ul') { document.execCommand('insertText', false, `\n- ${selectedText}`); }
  if (action === 'ol') { document.execCommand('insertText', false, `\n1. ${selectedText}`); }
  if (action === 'blockquote') { document.execCommand('insertText', false, `\n> ${selectedText}`); }
  if (action === 'hr') { document.execCommand('insertText', false, '\n\n---\n\n'); }
  if (action === 'link') {
    const url = prompt('Enter URL:', 'https://');
    if (url) document.execCommand('insertText', false, `[${selectedText || 'Link text'}](${url})`);
  }
  if (action === 'table') {
    document.execCommand('insertText', false,
      '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n');
  }
  wysiwyg.dispatchEvent(new Event('input'));
}

function applySourceFormat(action) {
  const ta = sourceEditor;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const selected = ta.value.slice(s, e);

  const map = {
    bold:          ['**', '**'],
    italic:        ['*', '*'],
    strikethrough: ['~~', '~~'],
    code:          ['`', '`'],
  };

  let replacement = '';
  if (map[action]) {
    const [pre, post] = map[action];
    replacement = `${pre}${selected}${post}`;
  } else if (action === 'ul')         replacement = `\n- ${selected}`;
  else if (action === 'ol')           replacement = `\n1. ${selected}`;
  else if (action === 'blockquote')   replacement = `\n> ${selected}`;
  else if (action === 'hr')           replacement = '\n\n---\n\n';
  else if (action === 'link')  {
    const url = prompt('Enter URL:', 'https://');
    replacement = url ? `[${selected || 'Link text'}](${url})` : selected;
  } else if (action === 'table') {
    replacement = '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n';
  }

  ta.value = ta.value.slice(0, s) + replacement + ta.value.slice(e);
  ta.selectionStart = s;
  ta.selectionEnd   = s + replacement.length;
  ta.dispatchEvent(new Event('input'));
}

function applyHeading(level) {
  const prefixMap = { h1: '# ', h2: '## ', h3: '### ', h4: '#### ' };
  const prefix = prefixMap[level];
  if (currentMode === 'wysiwyg') {
    document.execCommand('insertText', false, `\n${prefix}`);
    wysiwyg.dispatchEvent(new Event('input'));
  } else {
    const ta = sourceEditor;
    const s = ta.selectionStart;
    ta.value = ta.value.slice(0, s) + `\n${prefix}` + ta.value.slice(s);
    ta.selectionStart = ta.selectionEnd = s + prefix.length + 1;
    ta.dispatchEvent(new Event('input'));
  }
}

// ── Keyboard shortcuts ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); applyFormat('bold'); }
    if (e.key === 'i') { e.preventDefault(); applyFormat('italic'); }
    if (e.key === 's' && !e.shiftKey) { e.preventDefault(); saveFile(); }
    if (e.key === 's' && e.shiftKey)  { e.preventDefault(); saveFileAs(); }
    if (e.key === 'n') { e.preventDefault(); newFile(); }
  }
});

// ── File ops ──────────────────────────────────────────────────────────
function newFile() {
  if (isModified) {
    if (!confirm('Unsaved changes will be lost. Continue?')) return;
  }
  currentFilePath = null;
  lastSavedContent = '';
  setMarkdown('');
  updateTitle(null);
  markModified(false);
}

async function saveFile() {
  const md = getMarkdown();
  const res = await window.electronAPI.saveFile({ content: md, filePath: currentFilePath });
  if (res.success) {
    currentFilePath = res.filePath;
    lastSavedContent = md;
    updateTitle(res.filePath);
    markModified(false);
    toast('File saved', 'success');
  } else {
    await saveFileAs();
  }
}

async function saveFileAs() {
  const md = getMarkdown();
  const res = await window.electronAPI.saveFileAs({ content: md });
  if (res.success) {
    currentFilePath = res.filePath;
    lastSavedContent = md;
    updateTitle(res.filePath);
    markModified(false);
    toast('Saved as ' + res.filePath.split(/[\\/]/).pop(), 'success');
  }
}

// ── Toolbar buttons ───────────────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', newFile);
document.getElementById('btn-open').addEventListener('click', () => {
  // Trigger via menu (IPC). But also handle directly:
  window.electronAPI.saveFile({ content: '', filePath: null }).then(() => {});
  // Note: open is handled by menu → IPC. We just stub it here.
  toast('Use File → Open (Ctrl+O)', 'info', 2000);
});
document.getElementById('btn-save').addEventListener('click', saveFile);

// ── Menu events ───────────────────────────────────────────────────────
window.electronAPI.onMenuNew(() => newFile());
window.electronAPI.onMenuSave(() => saveFile());
window.electronAPI.onMenuSaveAs(() => saveFileAs());
window.electronAPI.onFileOpened(({ content, filePath }) => {
  currentFilePath = filePath;
  lastSavedContent = content;
  setMarkdown(content);
  updateTitle(filePath);
  markModified(false);
  toast('Opened ' + filePath.split(/[\\/]/).pop(), 'info');
});

// ── AI Dropdown ───────────────────────────────────────────────────────
btnAI.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = aiDropdown.classList.toggle('open');
  btnAI.classList.toggle('open', open);
});

document.addEventListener('click', () => {
  aiDropdown.classList.remove('open');
  btnAI.classList.remove('open');
});

aiDropdown.addEventListener('click', (e) => e.stopPropagation());

document.getElementById('btn-refresh-models').addEventListener('click', async () => {
  await checkOllama();
  toast('Model list refreshed', 'info', 2000);
});

// dropdown items
document.querySelectorAll('.ai-dropdown-item').forEach(item => {
  item.addEventListener('click', () => {
    const type = item.dataset.type;
    aiDropdown.classList.remove('open');
    btnAI.classList.remove('open');
    triggerAI(type);
  });
});

// menu events
window.electronAPI.onAIFix((type) => triggerAI(type));

// ── AI prompts ────────────────────────────────────────────────────────
const AI_PROMPTS = {
  fix: (md) => `You are a Markdown expert. The user has a Markdown document with potential syntax errors or formatting issues. Fix ALL Markdown syntax problems including:
- Broken tables (misaligned columns, missing separators)
- Unclosed or malformed code fences
- Missing blank lines before/after headings, lists, code blocks
- Incorrect heading hierarchy
- Malformed links and images
- Inconsistent list markers
- Any other Markdown syntax issues

Return ONLY the fixed Markdown content, no explanations, no code fences around the entire output.

DOCUMENT:
${md}`,

  grammar: (md) => `You are a professional editor. Improve the grammar, style, and clarity of the following Markdown document. Preserve all Markdown formatting and structure. Fix grammar errors, awkward phrasing, passive voice where active is better, and improve overall readability. Keep the same tone and meaning.

Return ONLY the improved Markdown content, no explanations, no code fences around the entire output.

DOCUMENT:
${md}`,

  structure: (md) => `You are a technical writing expert. Improve the structure and organization of the following Markdown document. This includes:
- Better heading hierarchy (H1 → H2 → H3 flow)
- Logical section ordering
- Adding a table of contents if the document is long
- Breaking up long paragraphs
- Adding introductory or summary sections if missing
- Consistent heading capitalization

Return ONLY the restructured Markdown content, no explanations.

DOCUMENT:
${md}`,

  expand: (md) => `You are a helpful writing assistant. Look at the following Markdown document and generate content to fill in any obvious gaps, TODOs, placeholder text like "[add content here]", or sections that seem incomplete. Keep your additions consistent with the existing style and topic.

Return ONLY the completed Markdown content, no explanations.

DOCUMENT:
${md}`,

  convert: (md) => `You are a Markdown converter. The following text may be poorly formatted plain text, HTML, or garbled Markdown. Convert it into clean, well-structured Markdown with proper headings, lists, code blocks, bold/italic emphasis, and tables where appropriate.

Return ONLY the converted Markdown content, no explanations, no code fences around the entire output.

TEXT:
${md}`,
};

const AI_LABELS = {
  fix:       'Fixing Markdown syntax…',
  grammar:   'Improving grammar & style…',
  structure: 'Restructuring document…',
  expand:    'Generating missing content…',
  convert:   'Converting to Markdown…',
};

// ── Diff helper ───────────────────────────────────────────────────────
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result = [];

  // Simple LCS-based diff
  const m = oldLines.length, n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) dp[i][j] = dp[i+1][j+1] + 1;
      else dp[i][j] = Math.max(dp[i+1][j], dp[i][j+1]);
    }
  }

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'context', text: oldLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i+1][j] <= dp[i][j+1])) {
      result.push({ type: 'added', text: newLines[j] });
      j++;
    } else {
      result.push({ type: 'removed', text: oldLines[i] });
      i++;
    }
  }
  return result;
}

function renderDiff(diff) {
  const contextRadius = 3;
  const changed = new Set();
  diff.forEach((l, i) => { if (l.type !== 'context') changed.add(i); });

  const visible = new Set();
  changed.forEach(idx => {
    for (let k = Math.max(0, idx - contextRadius); k <= Math.min(diff.length - 1, idx + contextRadius); k++) {
      visible.add(k);
    }
  });

  let html = '';
  let lastVisible = -2;
  diff.forEach((line, i) => {
    if (!visible.has(i)) return;
    if (i > lastVisible + 1) html += `<span class="diff-context">  …</span>`;
    lastVisible = i;

    const escaped = line.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (line.type === 'added')   html += `<span class="diff-added">+ ${escaped}</span>`;
    else if (line.type === 'removed') html += `<span class="diff-removed">- ${escaped}</span>`;
    else html += `<span class="diff-context">  ${escaped}</span>`;
  });

  if (!html) html = '<span class="diff-context">  No changes detected.</span>';
  return html;
}

// ── AI trigger ────────────────────────────────────────────────────────
async function triggerAI(type) {
  const md = getMarkdown();
  if (!md.trim()) { toast('Document is empty', 'error'); return; }

  const model = modelSelect.value;
  if (!model) {
    toast('No Ollama model selected. Is Ollama running?', 'error', 4000);
    return;
  }

  // Show modal (loading state)
  aiModalLabel.textContent = AI_LABELS[type] || 'AI is working…';
  aiSpinner.classList.remove('done');
  aiSpinner.querySelector('.spinner-ring').style.animation = 'spin 0.8s linear infinite';
  aiDiffArea.innerHTML = '<span class="diff-context">  Waiting for Ollama response…</span>';
  btnApply.disabled = true;
  aiOverlay.classList.remove('hidden');

  const prompt = AI_PROMPTS[type](md);

  const res = await window.electronAPI.ollamaCall({ prompt, model });

  if (!res.success) {
    aiDiffArea.innerHTML = `<div class="ai-error-msg">
      <strong>❌ Error</strong>
      <span>${res.error}</span>
      <span style="color:var(--text-muted);font-size:12px;margin-top:4px">
        Make sure Ollama is running: <code style="font-size:12px">ollama serve</code>
      </span>
    </div>`;
    aiSpinner.classList.add('done');
    aiSpinner.querySelector('.spinner-ring').style.borderColor = 'var(--red)';
    aiSpinner.querySelector('.spinner-ring').style.animation = 'none';
    aiModalLabel.textContent = 'AI Error';
    return;
  }

  pendingAIResult = res.response.trim();
  const diff = computeDiff(md, pendingAIResult);
  aiDiffArea.innerHTML = renderDiff(diff);

  aiSpinner.classList.add('done');
  aiSpinner.querySelector('.spinner-ring').style.animation = 'none';
  aiSpinner.querySelector('.spinner-ring').style.borderColor = 'var(--green)';
  aiModalLabel.textContent = 'Review Changes';
  btnApply.disabled = false;
}

// ── Apply AI result ───────────────────────────────────────────────────
btnApply.addEventListener('click', () => {
  if (pendingAIResult) {
    setMarkdown(pendingAIResult);
    markModified(true);
    toast('AI changes applied', 'success');
  }
  aiOverlay.classList.add('hidden');
  pendingAIResult = '';
});

btnCancel.addEventListener('click', () => {
  aiOverlay.classList.add('hidden');
  pendingAIResult = '';
});

btnModalClose.addEventListener('click', () => {
  aiOverlay.classList.add('hidden');
  pendingAIResult = '';
});

// Close on overlay click
aiOverlay.addEventListener('click', (e) => {
  if (e.target === aiOverlay) {
    aiOverlay.classList.add('hidden');
    pendingAIResult = '';
  }
});

// ── Escape to close ───────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !aiOverlay.classList.contains('hidden')) {
    aiOverlay.classList.add('hidden');
    pendingAIResult = '';
  }
});

// ── Split pane drag ───────────────────────────────────────────────────
let dragging = false;
splitDivider.addEventListener('mousedown', () => { dragging = true; });
document.addEventListener('mouseup', () => { dragging = false; });
document.addEventListener('mousemove', (e) => {
  if (!dragging || currentMode !== 'split') return;
  const container = document.getElementById('editor-container');
  const rect = container.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  const pct = Math.max(20, Math.min(80, ratio * 100));
  sourcePane.style.flex = `0 0 ${pct}%`;
  previewPane.style.flex = `0 0 ${100 - pct}%`;
});

// ── Default content ───────────────────────────────────────────────────
const WELCOME_MD = `# Welcome to MarkForge ✨

> A beautiful WYSIWYG Markdown editor with **AI-powered** fixes, powered by Ollama.

## Getting Started

1. Start **Ollama** locally: \`ollama serve\`
2. Pull a model: \`ollama pull llama3\`
3. Click the **AI Fix** button in the toolbar to improve your document

## Features

- 🖊️ **WYSIWYG editing** — see your Markdown rendered as you type
- 🔀 **Split view** — edit source on the left, preview on the right
- 🤖 **AI Fix** — powered by your local Ollama models
  - Fix broken Markdown syntax
  - Improve grammar & style
  - Restructure documents
  - Generate missing content
  - Convert plain text → Markdown
- 💾 **File management** — open and save \`.md\` files

## Markdown Showcase

### Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! Welcome to MarkForge.\`;
}
\`\`\`

### Tables

| Feature       | MarkText | MarkForge |
| ------------- | -------- | --------- |
| WYSIWYG       | ✅       | ✅        |
| AI Fix        | ❌       | ✅        |
| Local AI      | ❌       | ✅        |
| Open Source   | ✅       | ✅        |

### Task List

- [x] Create beautiful editor
- [x] Integrate Ollama AI
- [ ] Write your next great document

---

*Start writing now — your cursor is waiting.*
`;

// ── Init ──────────────────────────────────────────────────────────────
setMarkdown(WELCOME_MD);
lastSavedContent = '';
updateStats(WELCOME_MD);
checkOllama();

// Periodically re-check Ollama every 30s
setInterval(checkOllama, 30000);

