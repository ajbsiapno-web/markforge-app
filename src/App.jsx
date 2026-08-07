import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { UploadCloud } from 'lucide-react';
import Titlebar from './components/Titlebar';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AiModal from './components/AiModal';
import Statusbar from './components/Statusbar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ShareModal from './components/ShareModal';
import CommentsDrawer from './components/CommentsDrawer';
import ShortcutsModal from './components/ShortcutsModal';
import AiSettingsModal from './components/AiSettingsModal';
import AiAgentBar from './components/AiAgentBar';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { fetchUserDocuments, saveUserDocument, deleteUserDocument } from './lib/documents';
import { fetchDocumentComments } from './lib/commentsAndShares';
import { exportToPdf, exportToHtml, exportToMarkdown, copyRenderedHtmlToClipboard } from './lib/export';
import { AI_PROVIDERS, getSavedApiKey, executeAiPrompt, cleanAiMarkdown } from './lib/aiProviders';

const WELCOME_MD = `# Welcome to MarkForge ✨

> A beautiful WYSIWYG Markdown editor built with **Radix UI**, **Multi-Provider AI**, **LaTeX Math Formulas**, **Flowcharts**, and **Supabase Cloud Sync**.

## Getting Started

1. **AI Actions**: Choose your AI provider (**OpenAI**, **Anthropic Claude**, **Google Gemini**, or local **Ollama**).
2. Click **Ask Agent ✦** or press \`Ctrl+K\` to ask the AI Agent to generate flowcharts, diagrams, tables, or math formulas!

## Features

- 🖊️ **WYSIWYG Editing** — see your Markdown rendered cleanly as you write
- 🤖 **Multi-Provider AI & Agent** — support for OpenAI (GPT-4o), Claude 3.5, Gemini 1.5, & Local Ollama
- 🧮 **LaTeX Math Formulas** — render complex equations with KaTeX (\`$$\` display & \`$\` inline)
- 📊 **Flowchart & Diagrams** — write \`\`\`mermaid code blocks to render live SVG diagrams
- 🔀 **Split View** — side-by-side source editor & live preview
- 🔗 **Document Sharing** — invite collaborators via email or copy public sharing links
- 💬 **Live Document Comments** — discuss changes and post comments per document
- ☁️ **Cloud User Documents** — user files automatically saved and synced per account

## Markdown Showcase

### LaTeX Mathematical Formulas 🧮

$$\\text{Gross Input Target} = \\frac{\\text{Net Output Order Target}}{\\max\\left(0.01, \\frac{\\text{expected\\_yield\\_percentage}}{100}\\right)}$$

### Live Flowcharts & Diagrams 📊

\`\`\`mermaid
graph TD
    A[Start Writing Document] --> B{Need Flowchart?}
    B -->|Yes| C[Write Mermaid Syntax]
    C --> D[MarkForge Renders Live SVG Diagram ✨]
    B -->|No| E[Write Standard Text & Tables]
\`\`\`

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
| Multi-AI      | ❌       | ✅        |
| LaTeX Math    | ❌       | ✅        |
| Flowcharts    | ❌       | ✅        |
| Share & Chat  | ❌       | ✅        |

---

*Start typing right now — your document is ready.*
`;

export default function App() {
  const [markdown, setMarkdown] = useState(WELCOME_MD);
  const [lastSaved, setLastSaved] = useState(WELCOME_MD);
  const [filePath, setFilePath] = useState('Welcome.md');
  const [isModified, setIsModified] = useState(false);
  const [mode, setMode] = useState('wysiwyg'); // 'wysiwyg' | 'source' | 'split'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Native File Input & Drag & Drop Refs
  const fileInputRef = useRef(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  // Modal States
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAgentBarOpen, setIsAgentBarOpen] = useState(false);
  const [findReplaceState, setFindReplaceState] = useState({ isOpen: false, showReplace: false });

  // Parse shared URL parameters (e.g. ?title=Finished+Goods+3.0) on app load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedTitle = params.get('title');
      if (sharedTitle) {
        setFilePath(decodeURIComponent(sharedTitle));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Synchronize document title and Open Graph social sharing meta tags
  useEffect(() => {
    if (!filePath) return;
    const titleText = `${filePath.replace(/\.(md|txt|markdown)$/i, '')} — MarkForge`;
    document.title = titleText;

    const setMetaTag = (selector, content) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    setMetaTag('meta[property="og:title"]', filePath);
    setMetaTag('meta[property="og:description"]', `View and edit "${filePath}" on MarkForge AI Markdown Editor.`);
    setMetaTag('meta[name="twitter:title"]', filePath);
    setMetaTag('meta[name="twitter:description"]', `View and edit "${filePath}" on MarkForge AI Markdown Editor.`);
  }, [filePath]);

  // Global keybindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsAgentBarOpen((prev) => !prev);
        return;
      }

      if (e.key === '?') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isEditable = document.activeElement?.isContentEditable || activeTag === 'input' || activeTag === 'textarea';
        if (!isEditable) {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setFindReplaceState({ isOpen: true, showReplace: false, trigger: Date.now() });
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setFindReplaceState({ isOpen: true, showReplace: true, trigger: Date.now() });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // User Documents Cloud Storage State
  const [userDocs, setUserDocs] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);

  // Collaboration State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('markforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Multi-Provider AI State
  const [activeProvider, setActiveProvider] = useState(() => {
    try {
      return localStorage.getItem('markforge_provider') || 'ollama';
    } catch {
      return 'ollama';
    }
  });
  const [ollamaStatus, setOllamaStatus] = useState('loading');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiDiff, setAiDiff] = useState([]);
  const [aiPendingResult, setAiPendingResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Load User Documents whenever user changes
  const reloadUserDocs = useCallback(async (user) => {
    const docs = await fetchUserDocuments(user);
    setUserDocs(docs);
  }, []);

  useEffect(() => {
    reloadUserDocs(currentUser);
  }, [currentUser, reloadUserDocs]);

  // Load Comments count for active document
  useEffect(() => {
    if (activeDocId) {
      fetchDocumentComments(activeDocId).then((comments) => setCommentsCount(comments.length));
    } else {
      setCommentsCount(0);
    }
  }, [activeDocId, isCommentsOpen]);

  // Supabase Session Listener
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
          const words = fullName.split(' ').filter(Boolean);
          const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();

          const userObj = {
            id: session.user.id,
            name: fullName,
            email: session.user.email,
            avatar: initials,
            plan: 'Pro Plan',
            joined: new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          };
          setCurrentUser(userObj);
          localStorage.setItem('markforge_user', JSON.stringify(userObj));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
          const words = fullName.split(' ').filter(Boolean);
          const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();

          const userObj = {
            id: session.user.id,
            name: fullName,
            email: session.user.email,
            avatar: initials,
            plan: 'Pro Plan',
            joined: new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          };
          setCurrentUser(userObj);
          localStorage.setItem('markforge_user', JSON.stringify(userObj));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('markforge_user');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Update models based on selected AI Provider
  const updateProviderModels = useCallback(async () => {
    const providerObj = AI_PROVIDERS[activeProvider] || AI_PROVIDERS.ollama;

    if (activeProvider === 'ollama') {
      setOllamaStatus('loading');
      if (window.electronAPI?.ollamaModels) {
        try {
          const res = await window.electronAPI.ollamaModels();
          if (res.success && res.models?.length > 0) {
            setOllamaStatus('online');
            setAvailableModels(res.models);
            setSelectedModel((prev) => (res.models.includes(prev) ? prev : res.models[0]));
            return;
          }
        } catch (e) {
          /* ignore */
        }
      }

      const tryFetchModels = async (url) => {
        try {
          const res = await fetch(url, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            return (data.models || []).map((m) => m.name);
          }
        } catch (e) {
          return null;
        }
        return null;
      };

      let modelNames = await tryFetchModels('http://localhost:11434/api/tags');
      if (!modelNames) {
        modelNames = await tryFetchModels('http://127.0.0.1:11434/api/tags');
      }

      if (modelNames && modelNames.length > 0) {
        setOllamaStatus('online');
        setAvailableModels(modelNames);
        setSelectedModel((prev) => (modelNames.includes(prev) ? prev : modelNames[0]));
      } else if (modelNames !== null) {
        setOllamaStatus('online');
        setAvailableModels([]);
        setSelectedModel('');
      } else {
        setOllamaStatus('offline');
        setAvailableModels([]);
        setSelectedModel('');
      }
    } else {
      setOllamaStatus('online');
      const models = providerObj.defaultModels;
      setAvailableModels(models);
      setSelectedModel(models[0]);
    }
  }, [activeProvider]);

  useEffect(() => {
    updateProviderModels();
  }, [updateProviderModels]);

  const handleProviderChange = (newProvider) => {
    setActiveProvider(newProvider);
    localStorage.setItem('markforge_provider', newProvider);
  };

  // Auth Handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('markforge_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('markforge_user');
    setUserDocs([]);
    setActiveDocId(null);
  };

  // Handle Markdown content updates
  const handleMarkdownChange = (newMd) => {
    setMarkdown(newMd);
    setIsModified(newMd !== lastSaved);
  };

  // File Operations & Document Renaming
  const handleNewFile = () => {
    if (isModified && !confirm('Unsaved changes will be lost. Create new document?')) return;
    setMarkdown('');
    setLastSaved('');
    setFilePath('Untitled.md');
    setActiveDocId(null);
    setIsModified(false);
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleRenameDoc = async (docIdOrTitle, newTitle) => {
    let targetDocId = activeDocId;
    let targetTitle = '';

    if (typeof docIdOrTitle === 'string' && newTitle === undefined) {
      targetTitle = docIdOrTitle;
    } else {
      targetDocId = docIdOrTitle;
      targetTitle = newTitle;
    }

    if (!targetTitle) return;

    if (!targetTitle.endsWith('.md') && !targetTitle.endsWith('.txt') && !targetTitle.endsWith('.markdown')) {
      targetTitle = `${targetTitle}.md`;
    }

    if (targetDocId === activeDocId || !targetDocId) {
      setFilePath(targetTitle);
    }

    const targetDoc = userDocs.find((d) => d.id === targetDocId);
    const contentToSave = targetDoc ? targetDoc.content : markdown;

    const res = await saveUserDocument(currentUser, targetDocId, targetTitle, contentToSave);
    if (res.success && res.doc) {
      if (targetDocId === activeDocId || !targetDocId) {
        setActiveDocId(res.doc.id);
        setFilePath(res.doc.title);
      }
      await reloadUserDocs(currentUser);
    }
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    const filename = file.name || 'Imported.md';
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result || '';
      setMarkdown(content);
      setFilePath(filename);
      setIsModified(false);

      // Automatically save to Cloud Documents if user is logged in
      const res = await saveUserDocument(currentUser, null, filename, content);
      if (res.success && res.doc) {
        setActiveDocId(res.doc.id);
        setLastSaved(content);
        await reloadUserDocs(currentUser);
      }
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
      e.target.value = '';
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(false);
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImportFile(files[0]);
    }
  };

  const handleSelectDoc = (doc) => {
    if (isModified && !confirm('Unsaved changes will be lost. Switch document?')) return;
    setMarkdown(doc.content || '');
    setLastSaved(doc.content || '');
    setFilePath(doc.title || 'Untitled.md');
    setActiveDocId(doc.id);
    setIsModified(false);
  };

  const handleDeleteDoc = async (docId) => {
    await deleteUserDocument(currentUser, docId);
    if (activeDocId === docId) {
      handleNewFile();
    }
    await reloadUserDocs(currentUser);
  };

  const handleSaveFile = async () => {
    const title = filePath || 'Untitled.md';
    const res = await saveUserDocument(currentUser, activeDocId, title, markdown);
    if (res.success && res.doc) {
      setActiveDocId(res.doc.id);
      setFilePath(res.doc.title);
      setLastSaved(markdown);
      setIsModified(false);
      await reloadUserDocs(currentUser);
    }
  };

  // Export Document Handlers
  const handleExport = async (format) => {
    switch (format) {
      case 'pdf':
        exportToPdf(markdown, filePath);
        break;
      case 'html':
        exportToHtml(markdown, filePath);
        break;
      case 'md':
        exportToMarkdown(markdown, filePath);
        break;
      case 'copy-html': {
        const success = await copyRenderedHtmlToClipboard(markdown);
        if (success) {
          alert('Rendered HTML copied to clipboard!');
        } else {
          alert('Failed to copy HTML to clipboard.');
        }
        break;
      }
      default:
        break;
    }
  };

  // Formatting actions
  const handleFormatAction = (action) => {
    const formatMap = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      strikethrough: ['~~', '~~'],
      code: ['`', '`'],
      ul: ['\n- ', ''],
      ol: ['\n1. ', ''],
      blockquote: ['\n> ', ''],
      hr: ['\n\n---\n\n', ''],
      link: ['[Link text](', 'https://)'],
      table: ['\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n', ''],
    };

    if (formatMap[action]) {
      const [pre, post] = formatMap[action];
      setMarkdown((prev) => prev + pre + post);
      setIsModified(true);
    }
  };

  const handleHeadingAction = (level) => {
    if (!level || level === 'p') return;
    const prefixMap = { h1: '# ', h2: '## ', h3: '### ', h4: '#### ' };
    const prefix = prefixMap[level] || '';
    setMarkdown((prev) => prev + `\n${prefix}`);
    setIsModified(true);
  };

  // Multi-Provider AI Prompt Trigger
  const triggerAI = async (type, customInstruction = '') => {
    const providerObj = AI_PROVIDERS[activeProvider] || AI_PROVIDERS.ollama;
    const apiKey = getSavedApiKey(activeProvider);

    if (providerObj.requiresKey && !apiKey) {
      alert(`An API Key is required for ${providerObj.name}. Click the gear ⚙️ icon in AI Actions to set your key.`);
      setIsAiSettingsOpen(true);
      return;
    }

    if (activeProvider === 'ollama' && !selectedModel) {
      alert('No Ollama model selected. Make sure Ollama is running locally ("ollama serve") and you have pulled a model ("ollama pull llama3").');
      return;
    }

    const labels = {
      fix: 'Fixing Markdown Syntax...',
      grammar: 'Improving Grammar & Style...',
      structure: 'Restructuring Document...',
      expand: 'Generating Missing Content...',
      convert: 'Converting Text to Markdown...',
      agent: 'AI Agent Executing Task...',
    };

    const systemContext = `You are an expert AI Markdown Assistant. Follow the user instruction precisely.
- If asked to generate a flowchart or diagram, write valid \`\`\`mermaid code blocks.
- If asked to generate a table, use valid Markdown table syntax.
- If asked to generate math, use $$ formula $$ syntax.
- Return ONLY clean Markdown text without wrapping in \`\`\`markdown code block fences.`;

    const prompts = {
      fix: `${systemContext}\n\nFix all broken Markdown syntax in this document:\n\n${markdown}`,
      grammar: `${systemContext}\n\nImprove the grammar, clarity, and phrasing of this Markdown document:\n\n${markdown}`,
      structure: `${systemContext}\n\nImprove section hierarchy and organization of this Markdown document:\n\n${markdown}`,
      expand: `${systemContext}\n\nComplete any gaps or TODOs in this document:\n\n${markdown}`,
      convert: `${systemContext}\n\nConvert this text into clean Markdown with headings and lists:\n\n${markdown}`,
      agent: `${systemContext}\n\nUser Request: ${customInstruction}\n\nCurrent Document Context:\n${markdown}`,
    };

    const targetType = type || 'agent';
    setAiTitle(`${labels[targetType] || 'AI Processing...'} (${providerObj.name})`);
    setAiLoading(true);
    setAiError(null);
    setAiModalOpen(true);

    try {
      const rawResult = await executeAiPrompt({
        provider: activeProvider,
        model: selectedModel,
        apiKey,
        prompt: prompts[targetType] || customInstruction || markdown,
      });

      const cleanResult = cleanAiMarkdown(rawResult);
      setAiLoading(false);
      if (cleanResult) {
        setAiPendingResult(cleanResult);
        setAiDiff(computeDiff(markdown, cleanResult));
      } else {
        setAiError('Empty response received from AI provider');
      }
    } catch (err) {
      setAiLoading(false);
      setAiError(err.message || 'AI request failed');
    }
  };

  const applyAIResult = () => {
    if (aiPendingResult) {
      const cleaned = cleanAiMarkdown(aiPendingResult);
      setMarkdown(cleaned);
      setIsModified(true);
    }
    setAiModalOpen(false);
    setAiPendingResult('');
  };

  return (
    <div
      className="app-container"
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      style={{ position: 'relative' }}
    >
      {/* Hidden Native File Input for Open File Button */}
      <input
        type="file"
        id="markforge-file-input"
        ref={fileInputRef}
        accept=".md,.markdown,.txt"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Global Canvas Drag & Drop Overlay */}
      {isGlobalDragging && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 13, 20, 0.94)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            border: '3px dashed #a78bfa',
            margin: 16,
            borderRadius: 16,
            pointerEvents: 'none',
          }}
        >
          <UploadCloud size={64} style={{ color: '#c084fc', marginBottom: 16 }} />
          <Text size="5" weight="bold" style={{ color: '#f8fafc' }}>
            Drop Markdown File Here
          </Text>
          <Text size="3" style={{ color: '#94a3b8', marginTop: 8 }}>
            Open and import directly into MarkForge Workspace & Cloud Documents
          </Text>
        </Flex>
      )}

      {/* Titlebar with User Avatar & Auth & Shortcuts & Rename */}
      <Titlebar
        filePath={filePath}
        isModified={isModified}
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onRenameDoc={handleRenameDoc}
      />

      {/* Toolbar */}
      <Toolbar
        currentMode={mode}
        onViewChange={setMode}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onExport={handleExport}
        onFormatAction={handleFormatAction}
        onHeadingAction={handleHeadingAction}
        onAIFix={triggerAI}
        onOpenAgentBar={() => setIsAgentBarOpen(true)}
        activeProvider={activeProvider}
        availableModels={availableModels}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        onRefreshModels={updateProviderModels}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenComments={() => setIsCommentsOpen(!isCommentsOpen)}
        commentsCount={commentsCount}
      />

      {/* Main Workspace Pane */}
      <Flex style={{ flex: 1, overflow: 'hidden' }}>
        <Sidebar
          markdown={markdown}
          isOpen={sidebarOpen}
          user={currentUser}
          userDocs={userDocs}
          activeDocId={activeDocId}
          onSelectDoc={handleSelectDoc}
          onNewDoc={handleNewFile}
          onDeleteDoc={handleDeleteDoc}
          onImportFile={handleImportFile}
          onRenameDoc={handleRenameDoc}
        />

        <Editor
          markdown={markdown}
          onChange={handleMarkdownChange}
          mode={mode}
          findReplaceState={findReplaceState}
          onCloseFindReplace={() => setFindReplaceState({ isOpen: false, showReplace: false })}
        />

        <CommentsDrawer
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          docId={activeDocId}
          docTitle={filePath}
          user={currentUser}
        />
      </Flex>

      {/* Status bar */}
      <Statusbar
        markdown={markdown}
        ollamaStatus={ollamaStatus}
        modelCount={availableModels.length}
        onRefresh={updateProviderModels}
      />

      {/* Agentic AI Prompt Overlay (Ctrl+K) */}
      <AiAgentBar
        isOpen={isAgentBarOpen}
        onClose={() => setIsAgentBarOpen(false)}
        onSubmitPrompt={(promptText) => triggerAI('agent', promptText)}
        activeProvider={activeProvider}
        selectedModel={selectedModel}
      />

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        currentProvider={activeProvider}
        onProviderChange={handleProviderChange}
        onKeysUpdated={updateProviderModels}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        docId={activeDocId}
        docTitle={filePath}
      />

      {/* AI Diff Modal */}
      <AiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiTitle}
        diff={aiDiff}
        isLoading={aiLoading}
        error={aiError}
        onApply={applyAIResult}
      />

      {/* Auth Sign In / Register Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />

      {/* Profile & Change Password Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

// LCS Diff Generator
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result = [];

  const m = oldLines.length, n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'context', text: oldLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i + 1][j] <= dp[i][j + 1])) {
      result.push({ type: 'added', text: newLines[j] });
      j++;
    } else {
      result.push({ type: 'removed', text: oldLines[i] });
      i++;
    }
  }
  return result;
}
