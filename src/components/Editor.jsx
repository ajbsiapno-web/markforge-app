import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Flex } from '@radix-ui/themes';
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
      ta.setSelectionRange(currentMatch.start, currentMatch.end);
      const textBefore = markdown.substring(0, currentMatch.start);
      const lineNum = textBefore.split('\n').length;
      const approxLineHeight = 25;
      ta.scrollTop = Math.max(0, (lineNum - 4) * approxLineHeight);
    }
  }, [matchIndex, matches, findOpen, findText, isCaseSensitive, mode, markdown]);

  // Navigation handlers
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

    // 2. Render Mermaid Flowcharts & Diagrams into SVGs
    const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid, pre code.language-flowchart');
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i];
      const pre = block.parentElement;
      if (!pre || pre.dataset.renderedMermaid) continue;

      const code = block.textContent;
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
        wrapper.style.border = '1px solid rgba(139, 92, 246, 0.2)';
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
    <Box style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Floating Find & Replace Bar */}
      <FindReplaceBar
        isOpen={findOpen}
        showReplace={showReplace}
        findText={findText}
        replaceText={replaceText}
        onFindChange={(val) => {
          setFindText(val);
          setMatchIndex(0);
        }}
        onReplaceChange={setReplaceText}
        matchIndex={matchIndex}
        totalMatches={matches.length}
        onNext={handleNextMatch}
        onPrev={handlePrevMatch}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        onClose={handleCloseBar}
        onToggleReplace={() => setShowReplace((prev) => !prev)}
        isCaseSensitive={isCaseSensitive}
        onToggleCaseSensitive={() => {
          setIsCaseSensitive((prev) => !prev);
          setMatchIndex(0);
        }}
        findInputRef={findInputRef}
        replaceInputRef={replaceInputRef}
      />

      {/* WYSIWYG View */}
      {mode === 'wysiwyg' && (
        <Box style={{ height: '100%', overflowY: 'auto' }}>
          <div
            ref={wysiwygRef}
            className="prose-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleWysiwygInput}
            data-placeholder="Start typing in Markdown..."
          />
        </Box>
      )}

      {/* Source View */}
      {mode === 'source' && (
        <Box style={{ height: '100%', overflowY: 'auto', background: '#0b0d14' }}>
          <div className="source-wrapper">
            <textarea
              ref={sourceRef}
              className="source-editor"
              value={markdown}
              onChange={handleSourceChange}
              onKeyDown={handleKeyDown}
              placeholder="# Type your Markdown here..."
              spellCheck={false}
            />
          </div>
        </Box>
      )}

      {/* Split View */}
      {mode === 'split' && (
        <Flex style={{ height: '100%', width: '100%' }}>
          <Box style={{ width: `${splitRatio}%`, height: '100%', overflowY: 'auto', background: '#0b0d14' }}>
            <textarea
              ref={sourceRef}
              className="source-editor-split"
              value={markdown}
              onChange={handleSourceChange}
              onKeyDown={handleKeyDown}
              placeholder="# Type Markdown here..."
              spellCheck={false}
            />
          </Box>

          {/* Resizable Divider */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: 6,
              cursor: 'col-resize',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transition: 'background-color 0.15s',
              zIndex: 10,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#7c3aed')}
            onMouseLeave={(e) => {
              if (!isDragging.current) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
          />

          <Box style={{ width: `${100 - splitRatio}%`, height: '100%', overflowY: 'auto', background: '#07090e' }}>
            <div ref={previewRef} className="prose-preview-split" />
          </Box>
        </Flex>
      )}
    </Box>
  );
}

// Helper: Highlight match in WYSIWYG contentEditable node
function highlightWysiwygMatch(container, query, caseSensitive, targetIndex) {
  if (!container || !query) return;

  const textNodes = [];
  const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walk.nextNode())) {
    textNodes.push(node);
  }

  let matchCounter = 0;
  const lowerQuery = caseSensitive ? query : query.toLowerCase();

  for (const tNode of textNodes) {
    const nodeText = caseSensitive ? tNode.nodeValue : tNode.nodeValue.toLowerCase();
    let idx = nodeText.indexOf(lowerQuery);
    while (idx !== -1) {
      if (matchCounter === targetIndex) {
        try {
          const range = document.createRange();
          range.setStart(tNode, idx);
          range.setEnd(tNode, idx + query.length);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          tNode.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
          console.warn('Wysiwyg selection error:', err);
        }
        return;
      }
      matchCounter++;
      idx = nodeText.indexOf(lowerQuery, idx + 1);
    }
  }
}

// Lightweight HTML -> Markdown parser
function htmlToMarkdown(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return nodeToMarkdown(tmp).trim();
}

function nodeToMarkdown(node) {
  let result = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      if (child.classList?.contains('code-copy-btn') || child.tagName?.toLowerCase() === 'button') {
        continue;
      }
      const tag = child.tagName.toLowerCase();
      const inner = nodeToMarkdown(child);
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
        case 'ul': result += inner.split('\n').filter(Boolean).map(l => `- ${l}`).join('\n') + '\n\n'; break;
        case 'ol': {
          let i = 1;
          for (const li of child.children) {
            result += `${i}. ${nodeToMarkdown(li)}\n`;
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
        default:   result += inner;
      }
    }
  }
  return result;
}
