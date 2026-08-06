import React, { useState } from 'react';
import { Dialog, Flex, Button, Text, Box, TextField, Badge, Card } from '@radix-ui/themes';
import { Keyboard, Search, X, FilePlus, Wand2, Sparkles, Command, HelpCircle } from 'lucide-react';

const SHORTCUT_CATEGORIES = [
  {
    category: 'File Operations',
    icon: FilePlus,
    shortcuts: [
      { keys: ['Ctrl', 'N'], description: 'Create new document', detail: 'Clears editor for new Markdown file' },
      { keys: ['Ctrl', 'O'], description: 'Open existing file', detail: 'Browse local computer or Cloud storage' },
      { keys: ['Ctrl', 'S'], description: 'Save current document', detail: 'Saves file locally or syncs to Supabase Cloud' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Save document as...', detail: 'Save with custom title or target path' },
    ],
  },
  {
    category: 'Formatting & Editing',
    icon: Sparkles,
    shortcuts: [
      { keys: ['Ctrl', 'B'], description: 'Bold text', detail: 'Wraps selection in **bold**' },
      { keys: ['Ctrl', 'I'], description: 'Italic text', detail: 'Wraps selection in *italic*' },
      { keys: ['Ctrl', 'F'], description: 'Find / Search text', detail: 'Search document for matching keywords' },
      { keys: ['Ctrl', 'H'], description: 'Replace text', detail: 'Find and replace matching text' },
      { keys: ['Ctrl', 'Shift', 'X'], description: 'Strikethrough text', detail: 'Wraps selection in ~~strikethrough~~' },
      { keys: ['Ctrl', 'Shift', 'C'], description: 'Inline code block', detail: 'Wraps selection in `code`' },
    ],
  },
  {
    category: 'Ollama AI Tools',
    icon: Wand2,
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'F'], description: 'AI Fix Markdown Syntax', detail: 'Auto-corrects broken tables, links, and code fences' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'AI Improve Grammar & Style', detail: 'Enhances phrasing, clarity, and tone with Ollama' },
      { keys: ['Ctrl', 'Shift', 'H'], description: 'AI Restructure Document', detail: 'Optimizes section headers and outline hierarchy' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'AI Generate Missing Content', detail: 'Expands document outlines and completes TODOs' },
    ],
  },
  {
    category: 'Navigation & View',
    icon: Command,
    shortcuts: [
      { keys: ['?'], description: 'Toggle Shortcuts Reference', detail: 'Show or hide this keyboard shortcuts modal' },
      { keys: ['Ctrl', '\\'], description: 'Toggle Outline & Sidebar', detail: 'Show or hide document outline sidebar' },
      { keys: ['F12'], description: 'Toggle Developer Tools', detail: 'Open Chromium DevTools inspector' },
      { keys: ['Esc'], description: 'Close Modal / Drawer', detail: 'Dismiss active dialogs or side drawers' },
    ],
  },
];

function KeyBadge({ keys }) {
  return (
    <Flex align="center" gap="1">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text size="1" style={{ color: '#64748b', fontWeight: 600 }}>+</Text>}
          <kbd
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'inline-block',
              lineHeight: 1.2,
            }}
          >
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </Flex>
  );
}

export default function ShortcutsModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCategories = SHORTCUT_CATEGORIES.map((cat) => {
    const matches = cat.shortcuts.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.description.toLowerCase().includes(q) ||
        s.detail.toLowerCase().includes(q) ||
        s.keys.join('+').toLowerCase().includes(q) ||
        cat.category.toLowerCase().includes(q)
      );
    });
    return { ...cat, shortcuts: matches };
  }).filter((cat) => cat.shortcuts.length > 0);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 680,
          maxHeight: '85vh',
          background: 'rgba(18, 22, 34, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(168, 85, 247, 0.2)',
          borderRadius: 20,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px="5"
          py="4"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(168, 85, 247, 0.12))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                color: 'white',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Keyboard size={20} />
            </Flex>
            <Flex direction="column">
              <Text weight="bold" size="4" style={{ color: '#f8fafc', letterSpacing: '0.3px' }}>
                Keyboard Shortcuts Reference
              </Text>
              <Text size="1" style={{ color: '#94a3b8' }}>
                Boost your productivity with MarkForge quick keybindings
              </Text>
            </Flex>
          </Flex>

          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 8, cursor: 'pointer' }}>
              <X size={18} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Search Bar */}
        <Box px="5" pt="4" pb="2">
          <TextField.Root
            placeholder="Search shortcuts (e.g. Save, AI Fix, Ctrl+B)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <TextField.Slot>
              <Search size={16} color="#94a3b8" />
            </TextField.Slot>
            {searchQuery && (
              <TextField.Slot>
                <Button size="1" variant="ghost" color="gray" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </Button>
              </TextField.Slot>
            )}
          </TextField.Root>
        </Box>

        {/* Shortcuts List Content */}
        <Box style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
          {filteredCategories.length === 0 ? (
            <Flex direction="column" align="center" justify="center" gap="2" py="8" style={{ color: '#94a3b8' }}>
              <HelpCircle size={32} opacity={0.5} />
              <Text size="2">No shortcuts found matching "{searchQuery}"</Text>
            </Flex>
          ) : (
            filteredCategories.map((cat, catIdx) => {
              const CategoryIcon = cat.icon;
              return (
                <Box key={catIdx} mb="5">
                  <Flex align="center" gap="2" mb="3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 6 }}>
                    <CategoryIcon size={16} color="#c084fc" />
                    <Text size="2" weight="bold" style={{ color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 12 }}>
                      {cat.category}
                    </Text>
                    <Badge color="violet" variant="soft" size="1" style={{ marginLeft: 'auto', borderRadius: 8 }}>
                      {cat.shortcuts.length} shortcuts
                    </Badge>
                  </Flex>

                  <Flex direction="column" gap="2">
                    {cat.shortcuts.map((sc, scIdx) => (
                      <Card
                        key={scIdx}
                        variant="surface"
                        style={{
                          background: 'rgba(30, 41, 59, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '10px 14px',
                          borderRadius: 12,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Flex align="center" justify="space-between" gap="3">
                          <Flex direction="column" gap="1" style={{ flex: 1 }}>
                            <Text size="2" weight="medium" style={{ color: '#f1f5f9' }}>
                              {sc.description}
                            </Text>
                            <Text size="1" style={{ color: '#94a3b8', fontSize: 11 }}>
                              {sc.detail}
                            </Text>
                          </Flex>
                          <KeyBadge keys={sc.keys} />
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </Box>
              );
            })
          )}
        </Box>

        {/* Footer */}
        <Flex
          align="center"
          justify="space-between"
          px="5"
          py="3"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 18, 28, 0.8)',
          }}
        >
          <Flex align="center" gap="2">
            <Text size="1" style={{ color: '#94a3b8' }}>
              Tip: Press <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>?</kbd> anywhere to quickly toggle this menu
            </Text>
          </Flex>
          <Button variant="soft" color="gray" size="2" onClick={onClose} style={{ borderRadius: 10, cursor: 'pointer' }}>
            Close
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
