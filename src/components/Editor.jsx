import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Flex, Text, Button } from '@radix-ui/themes';
import { Lock, Copy, LogIn } from 'lucide-react';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import FindReplaceBar from './FindReplaceBar';

marked.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  })
);

marked.use({ gfm: true, breaks: true });

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

export default function Editor({
  markdown,
  onChange,
  mode,
  findReplaceState,
  onCloseFindReplace,
  isReadOnly = false,
  currentUser = null,
  onDuplicateDoc,
  onOpenAuth,
}) {
  const wysiwygRef = useRef(null);
  const sourceRef = useRef(null);
  const previewRef = useRef(null);
  const [splitRatio, setSplitRatio] = useState(50);
  const isDragging = useRef(false);

  // Find & Replace state
  const [findOpen, setFindOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  const findInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Synchronize findReplaceState prop from parent App component
  useEffect(() => {
    if (findReplaceState?.isOpen) {
      setFindOpen(true);
      if (findReplaceState.showReplace !== undefined) {
        setShowReplace(findReplaceState.showReplace);
      }
      setTimeout(() => {
        if (findReplaceState.showReplace) {
          replaceInputRef.current?.focus();
          replaceInputRef.current?.select();
        } else {
          findInputRef.current?.focus();
          findInputRef.current?.select();
        }
      }, 50);
    }
  }, [findReplaceState]);

  // Global keybindings Ctrl+F and Ctrl+H listener inside Editor
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setFindOpen(true);
        setShowReplace(false);
        setTimeout(() => {
          findInputRef.current?.focus();
          findInputRef.current?.select();
        }, 50);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setFindOpen(true);
        setShowReplace(true);
        setTimeout(() => {
          replaceInputRef.current?.focus();
          replaceInputRef.current?.select();
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute matches
  const computeMatches = useCallback((text, query, caseSensitive) => {
    if (!query || !text) return [];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    const matches = [];
    try {
      const regex = new RegExp(escaped, flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
        });
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } catch (e) {
      console.error('Find regex error:', e);
    }
    return matches;
  }, []);

  const matches = useMemo(() => {
    return computeMatches(markdown, findText, isCaseSensitive);
  }, [markdown, findText, isCaseSensitive, computeMatches]);

  // Clamp match index if matches length decreases
  useEffect(() => {
    if (matchIndex >= matches.length) {
      setMatchIndex(matches.length > 0 ? 0 : 0);
    }
  }, [matches.length, matchIndex]);

  // Highlight and scroll to current match
  useEffect(() => {
    if (!findOpen || !findText.trim() || matches.length === 0) return;

    const currentMatch = matches[matchIndex];
    if (!currentMatch) return;

    if (mode === 'wysiwyg' && wysiwygRef.current) {
      highlightWysiwygMatch(wysiwygRef.current, findText, isCaseSensitive, matchIndex);
    } else if ((mode === 'source' || mode === 'split') && sourceRef.current) {
      const ta = sourceRef.current;
      ta.focus();
      ta.setSelectionRange(currentMatch.start, currentMatch.end);
    }
  }, [findOpen, findText, isCaseSensitive, matchIndex, matches, mode]);

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    setMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    setMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  // Replace handlers
  const handleReplace = () => {
    if (!findText || matches.length === 0 || matchIndex < 0 || matchIndex >= matches.length) return;
    const m = matches[matchIndex];
    const newMd = markdown.substring(0, m.start) + replaceText + markdown.substring(m.end);
    onChange(newMd);
  };

  const handleReplaceAll = () => {
    if (!findText || matches.length === 0) return;
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = isCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escaped, flags);
    const newMd = markdown.replace(regex, replaceText);
    onChange(newMd);
    setMatchIndex(0);
  };

  const handleCloseBar = () => {
    setFindOpen(false);
    if (onCloseFindReplace) onCloseFindReplace();
  };

  // Synchronize WYSIWYG HTML when mode changes or external markdown changes
  useEffect(() => {
    if (mode === 'wysiwyg' && wysiwygRef.current) {
      const html = marked.parse(markdown || '');
      wysiwygRef.current.innerHTML = html;
      highlightCodeAndMermaid(wysiwygRef.current);
    } else if (mode === 'split' && previewRef.current) {
      previewRef.current.innerHTML = marked.parse(markdown || '');
      highlightCodeAndMermaid(previewRef.current);
    }
  }, [mode, markdown]);

  const addCopyButtons = (container) => {
    if (!container) return;
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      if (pre.dataset.hasCopyButton || pre.classList.contains('mermaid-diagram-container')) return;
      pre.dataset.hasCopyButton = 'true';
      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Copy code snippet');
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy</span>`;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const codeEl = pre.querySelector('code');
        const codeText = codeEl ? codeEl.textContent : pre.textContent;
        try {
          await navigator.clipboard.writeText(codeText);
          btn.classList.add('copied');
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied!</span>`;
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy</span>`;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code: ', err);
        }
      });

      pre.appendChild(btn);
    });
  };

  const highlightCodeAndMermaid = async (container) => {
    if (!container) return;

    // 1. Highlight standard syntax code blocks (skipping mermaid)
    container.querySelectorAll('pre code').forEach((block) => {
      if (!block.classList.contains('language-mermaid') && !block.classList.contains('language-flowchart')) {
        hljs.highlightElement(block);
      }
    });

    // 2. Add hover copy buttons to code blocks
    addCopyButtons(container);

    // 3. Render Mermaid Flowcharts & Diagrams into SVGs
    const mermaidBlocks = container.querySelectorAll(
      'pre code.language-mermaid, pre code.language-flowchart, pre.language-mermaid, code.language-mermaid, pre.language-flowchart'
    );

    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const pre = block.tagName?.toLowerCase() === 'pre' ? block : block.parentElement;
      if (!pre || pre.dataset.renderedMermaid) continue;

      let code = block.textContent || '';
      code = code.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').trim();

      if (!code) continue;

      const uniqueId = `mermaid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      try {
        pre.dataset.renderedMermaid = 'true';
        const { svg } = await mermaid.render(uniqueId, code);

        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram-container';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        wrapper.style.padding = '24px';
        wrapper.style.margin = '1.8em 0';
        wrapper.style.background = '#090b11';
        wrapper.style.border = '1px solid rgba(139, 92, 246, 0.3)';
        wrapper.style.borderRadius = '12px';
        wrapper.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        wrapper.innerHTML = svg;

        pre.replaceWith(wrapper);
      } catch (e) {
        console.warn('Mermaid render error:', e);
      }
    }
  };

  // Handle WYSIWYG innerHTML input -> convert to markdown
  const handleWysiwygInput = () => {
    if (!wysiwygRef.current) return;
    const md = htmlToMarkdown(wysiwygRef.current.innerHTML);
    onChange(md);
  };

  // Handle Source Textarea input
  const handleSourceChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (mode === 'split' && previewRef.current) {
      previewRef.current.innerHTML = marked.parse(val || '');
      highlightCodeAndMermaid(previewRef.current);
    }
  };

  // Tab key handling in source editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = sourceRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      ta.value = newValue;
      ta.selectionStart = ta.selectionEnd = start + 2;
      onChange(newValue);
    }
  };

  // Dragging for split pane
  const handleMouseDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const containerWidth = window.innerWidth;
      const newRatio = Math.max(20, Math.min(80, (e.clientX / containerWidth) * 100));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <Box style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Read-Only Shared Document Notice Banner */}
      {isReadOnly && (
        <Flex
          align="center"
          justify="space-between"
          px="4"
          py="2"
          style={{
            background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.25), rgba(30, 41, 59, 0.9))',
            borderBottom: '1px solid rgba(139, 92, 246, 0.35)',
            color: '#e2e8f0',
            fontSize: 13,
            zIndex: 20,
          }}
        >
          <Flex align="center" gap="2">
            <Lock size={15} color="#c084fc" />
            <Text weight="medium" style={{ color: '#f1f5f9', fontSize: 13 }}>
              Read-Only Shared Document — You can view, export, or copy this document.
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Button
              size="1"
              variant="solid"
              color="violet"
              onClick={onDuplicateDoc}
              style={{ cursor: 'pointer', borderRadius: 8 }}
            >
              <Copy size={13} /> Make an Editable Copy
            </Button>
            {!currentUser && onOpenAuth && (
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={onOpenAuth}
                style={{ cursor: 'pointer', borderRadius: 8 }}
              >
                <LogIn size={13} /> Sign In
              </Button>
            )}
          </Flex>
        </Flex>
      )}

      {/* Floating Find & Replace Bar */}
      <FindReplaceBar
        isOpen={findOpen}
        onClose={handleCloseBar}
        findText={findText}
        setFindText={setFindText}
        replaceText={replaceText}
        setReplaceText={setReplaceText}
        isCaseSensitive={isCaseSensitive}
        setIsCaseSensitive={setIsCaseSensitive}
        matchCount={matches.length}
        matchIndex={matchIndex}
        onNext={handleNextMatch}
        onPrev={handlePrevMatch}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        showReplace={showReplace}
        setShowReplace={setShowReplace}
        findInputRef={findInputRef}
        replaceInputRef={replaceInputRef}
      />

      {/* WYSIWYG Mode */}
      {mode === 'wysiwyg' && (
        <Box style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '40px 60px' }}>
          <div
            ref={wysiwygRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            className={`wysiwyg-editor ${isReadOnly ? 'read-only' : ''}`}
            onInput={handleWysiwygInput}
            style={{
              minHeight: '100%',
              outline: 'none',
              fontSize: 16,
              lineHeight: 1.7,
              color: '#e2e8f0',
              maxWidth: 900,
              margin: '0 auto',
              cursor: isReadOnly ? 'default' : 'text',
            }}
          />
        </Box>
      )}

      {/* Source Code Mode */}
      {mode === 'source' && (
        <textarea
          ref={sourceRef}
          value={markdown}
          readOnly={isReadOnly}
          onChange={handleSourceChange}
          onKeyDown={handleKeyDown}
          className={`source-editor ${isReadOnly ? 'read-only' : ''}`}
          placeholder={isReadOnly ? 'This shared document is read-only...' : 'Type Markdown source here...'}
          style={{
            width: '100%',
            height: '100%',
            background: '#090b11',
            color: '#f8fafc',
            border: 'none',
            outline: 'none',
            padding: 32,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            boxSizing: 'border-box',
            cursor: isReadOnly ? 'default' : 'text',
          }}
        />
      )}

      {/* Split Mode */}
      {mode === 'split' && (
        <Flex style={{ width: '100%', flex: 1, height: '100%', position: 'relative' }}>
          <Box style={{ width: `${splitRatio}%`, height: '100%' }}>
            <textarea
              ref={sourceRef}
              value={markdown}
              readOnly={isReadOnly}
              onChange={handleSourceChange}
              onKeyDown={handleKeyDown}
              className={`source-editor ${isReadOnly ? 'read-only' : ''}`}
              placeholder={isReadOnly ? 'This shared document is read-only...' : 'Type Markdown source here...'}
              style={{
                width: '100%',
                height: '100%',
                background: '#090b11',
                color: '#f8fafc',
                border: 'none',
                outline: 'none',
                padding: 24,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 14,
                lineHeight: 1.6,
                resize: 'none',
                boxSizing: 'border-box',
                cursor: isReadOnly ? 'default' : 'text',
              }}
            />
          </Box>

          {/* Split Drag Divider */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: 6,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              cursor: 'col-resize',
              zIndex: 10,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#8b5cf6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          />

          <Box style={{ flex: 1, height: '100%', overflowY: 'auto', padding: 24, background: '#0d1117' }}>
            <div
              ref={previewRef}
              className="markdown-preview"
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#e2e8f0',
              }}
            />
          </Box>
        </Flex>
      )}
    </Box>
  );
}

// Convert HTML innerHTML back to Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;

  // Convert rendered Mermaid wrappers back to ```mermaid blocks
  md = md.replace(/<div class="mermaid-diagram-container"[^>]*>[\s\S]*?<\/div>/gi, '');

  md = md
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');

  return md.trim();
}

// Helper to highlight search matches inside WYSIWYG innerHTML
function highlightWysiwygMatch(container, query, caseSensitive, targetIndex) {
  if (!container || !query) return;
  const nodes = [];
  const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  let n;
  while ((n = walk.nextNode())) {
    nodes.push(n);
  }

  let count = 0;
  nodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escaped, flags);
    if (regex.test(text)) {
      const span = document.createElement('span');
      span.innerHTML = text.replace(regex, (match) => {
        const isCurrent = count === targetIndex;
        count++;
        const bg = isCurrent ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)';
        const color = isCurrent ? '#000' : '#fff';
        return `<mark style="background:${bg}; color:${color}; padding: 0 2px; border-radius: 3px;">${match}</mark>`;
      });
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    }
  });
}
