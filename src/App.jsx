import React, { useState, useEffect, useCallback } from 'react';
import { Box, Flex } from '@radix-ui/themes';
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
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { fetchUserDocuments, saveUserDocument, deleteUserDocument } from './lib/documents';
import { fetchDocumentComments } from './lib/commentsAndShares';
import { exportToPdf, exportToHtml, exportToMarkdown, copyRenderedHtmlToClipboard } from './lib/export';
import { AI_PROVIDERS, getSavedApiKey, executeAiPrompt } from './lib/aiProviders';

const WELCOME_MD = `# Welcome to MarkForge ✨

> A beautiful WYSIWYG Markdown editor built with **Radix UI**, **Multi-Provider AI**, **LaTeX Math Formulas**, **Flowcharts**, and **Supabase Cloud Sync**.

## Getting Started

1. **AI Actions**: Choose your AI provider (**OpenAI**, **Anthropic Claude**, **Google Gemini**, or local **Ollama**).
2. Click the **AI Actions ✦** button in the toolbar to improve, expand, or format your document!

## Features

- 🖊️ **WYSIWYG Editing** — see your Markdown rendered cleanly as you write
- 🤖 **Multi-Provider AI** — support for OpenAI (GPT-4o), Claude 3.5, Gemini 1.5, & Local Ollama
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

  // Modal States
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [findReplaceState, setFindReplaceState] = useState({ isOpen: false, showReplace: false });

  // Global keybindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '?') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isEditable = document.activeElement?.isContentEditable || activeTag === 'input' || activeTag === 'textarea';
        if (!isEditable) {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
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
        } catch {}
      }

      try {
        const response = await fetch('http://localhost:11434/api/tags', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          const modelNames = (data.models || []).map((m) => m.name);
          if (modelNames.length > 0) {
            setOllamaStatus('online');
            setAvailableModels(modelNames);
            setSelectedModel((prev) => (modelNames.includes(prev) ? prev : modelNames[0]));
            return;
          }
        }
        setOllamaStatus('online');
        setAvailableModels([]);
        setSelectedModel('');
      } catch (err) {
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

  // File Operations
  const handleNewFile = () => {
    if (isModified && !confirm('Unsaved changes will be lost. Create new document?')) return;
    setMarkdown('');
    setLastSaved('');
    setFilePath('Untitled.md');
    setActiveDocId(null);
    setIsModified(false);
  };

  const handleOpenFile = () => {
    const title = prompt('Enter document title to open or create:', filePath || 'Untitled.md');
    if (!title) return;
    setFilePath(title);
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

  const handleSaveFileAs = async () => {
    const customTitle = prompt('Enter document title:', filePath || 'Untitled.md');
    if (!customTitle) return;
    setFilePath(customTitle);
    const res = await saveUserDocument(currentUser, null, customTitle, markdown);
    if (res.success && res.doc) {
      setActiveDocId(res.doc.id);
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
  const triggerAI = async (type) => {
    if (!markdown.trim()) return;

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
    };

    const prompts = {
      fix: `You are a Markdown expert. Fix all broken Markdown syntax (tables, lists, code fences, headers) in this document. Return ONLY the fixed Markdown:\n\n${markdown}`,
      grammar: `Improve the grammar, clarity, and phrasing of this Markdown document while preserving structure. Return ONLY the improved Markdown:\n\n${markdown}`,
      structure: `Improve the section hierarchy and organization of this Markdown document. Return ONLY the restructured Markdown:\n\n${markdown}`,
      expand: `Complete any gaps, TODOs, or placeholder text in this document. Return ONLY the completed Markdown:\n\n${markdown}`,
      convert: `Convert this raw text into clean, well-formatted Markdown with headings, code blocks, and lists. Return ONLY the Markdown:\n\n${markdown}`,
    };

    setAiTitle(`${labels[type] || 'AI Processing...'} (${providerObj.name})`);
    setAiLoading(true);
    setAiError(null);
    setAiModalOpen(true);

    try {
      const result = await executeAiPrompt({
        provider: activeProvider,
        model: selectedModel,
        apiKey,
        prompt: prompts[type] || markdown,
      });

      setAiLoading(false);
      if (result) {
        setAiPendingResult(result);
        setAiDiff(computeDiff(markdown, result));
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
      setMarkdown(aiPendingResult);
      setIsModified(true);
    }
    setAiModalOpen(false);
    setAiPendingResult('');
  };

  return (
    <div className="app-container">
      {/* Titlebar with User Avatar & Auth & Shortcuts */}
      <Titlebar
        filePath={filePath}
        isModified={isModified}
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
