import React from 'react';
import { Flex, Text, Button, IconButton, Select, Tooltip, DropdownMenu, Separator, Badge } from '@radix-ui/themes';
import {
  FilePlus,
  FolderOpen,
  Save,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link,
  Table,
  Wand2,
  ChevronDown,
  RotateCw,
  LayoutGrid,
  BookOpen,
  Pencil,
  Share2,
  MessageSquare,
  Download,
  Printer,
  FileCode,
  FileText,
  Copy,
  Settings,
  Bot,
  Sparkles,
} from 'lucide-react';
import { AI_PROVIDERS } from '../lib/aiProviders';

export default function Toolbar({
  currentMode,
  onViewChange,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onExport,
  onFormatAction,
  onHeadingAction,
  onAIFix,
  onOpenAgentBar,
  activeProvider,
  availableModels,
  selectedModel,
  onModelSelect,
  onRefreshModels,
  onOpenAiSettings,
  toggleSidebar,
  sidebarOpen,
  onOpenShare,
  onOpenComments,
  commentsCount,
  isReadOnly = false,
  onDuplicateDoc,
}) {
  const providerInfo = AI_PROVIDERS[activeProvider] || AI_PROVIDERS.ollama;

  return (
    <div className="app-toolbar">
      {/* File & Formatting Group */}
      <Flex align="center" gap="2">
        {/* Toggle Sidebar Button */}
        <Tooltip content={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}>
          <IconButton variant="ghost" color="gray" size="2" onClick={toggleSidebar} style={{ width: 34, height: 34 }}>
            <LayoutGrid size={16} />
          </IconButton>
        </Tooltip>

        <Separator orientation="vertical" size="2" style={{ height: 20, opacity: 0.15 }} />

        {/* File Actions */}
        <Flex gap="1">
          {isReadOnly ? (
            <Tooltip content="Duplicate document to make edits">
              <Button variant="solid" color="violet" size="2" onClick={onDuplicateDoc} style={{ height: 34, borderRadius: 8, cursor: 'pointer' }}>
                <Copy size={15} /> Make a Copy
              </Button>
            </Tooltip>
          ) : (
            <>
              <Tooltip content="New File (Ctrl+N)">
                <IconButton variant="ghost" color="gray" size="2" onClick={onNewFile} style={{ width: 34, height: 34 }}>
                  <FilePlus size={16} />
                </IconButton>
              </Tooltip>

              <Tooltip content="Open File (Ctrl+O)">
                <IconButton variant="ghost" color="gray" size="2" onClick={onOpenFile} style={{ width: 34, height: 34 }}>
                  <FolderOpen size={16} />
                </IconButton>
              </Tooltip>

              <Tooltip content="Save Document (Ctrl+S)">
                <IconButton variant="ghost" color="gray" size="2" onClick={onSaveFile} style={{ width: 34, height: 34 }}>
                  <Save size={16} />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Export Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" color="gray" size="2" style={{ height: 34, padding: '0 8px', borderRadius: 8 }}>
                <Download size={15} />
                Export
                <ChevronDown size={13} />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content variant="soft" color="violet" style={{ minWidth: 220, padding: 6, borderRadius: 12 }}>
              <DropdownMenu.Item onClick={() => onExport('pdf')} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <Printer size={15} />
                Export to PDF Document
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => onExport('html')} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <FileCode size={15} />
                Export HTML Webpage (.html)
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => onExport('md')} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <FileText size={15} />
                Download Markdown File (.md)
              </DropdownMenu.Item>

              <DropdownMenu.Separator style={{ margin: '4px 0' }} />

              <DropdownMenu.Item onClick={() => onExport('copy-html')} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <Copy size={15} />
                Copy Rendered HTML to Clipboard
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>

        <Separator orientation="vertical" size="2" style={{ height: 20, opacity: 0.15 }} />

        {/* Heading Dropdown */}
        <Select.Root defaultValue="p" onValueChange={onHeadingAction}>
          <Select.Trigger placeholder="Paragraph" variant="ghost" size="2" style={{ width: 110, height: 34, borderRadius: 8 }} />
          <Select.Content size="2">
            <Select.Item value="p">Paragraph</Select.Item>
            <Select.Item value="h1">Heading 1</Select.Item>
            <Select.Item value="h2">Heading 2</Select.Item>
            <Select.Item value="h3">Heading 3</Select.Item>
            <Select.Item value="h4">Heading 4</Select.Item>
          </Select.Content>
        </Select.Root>

        <Separator orientation="vertical" size="2" style={{ height: 20, opacity: 0.15 }} />

        {/* Text Formatting Actions */}
        <Flex gap="1">
          <Tooltip content="Bold (Ctrl+B)">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('bold')} style={{ width: 32, height: 32 }}>
              <Bold size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Italic (Ctrl+I)">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('italic')} style={{ width: 32, height: 32 }}>
              <Italic size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Strikethrough">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('strikethrough')} style={{ width: 32, height: 32 }}>
              <Strikethrough size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Inline Code">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('code')} style={{ width: 32, height: 32 }}>
              <Code size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Unordered List">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('ul')} style={{ width: 32, height: 32 }}>
              <List size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Numbered List">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('ol')} style={{ width: 32, height: 32 }}>
              <ListOrdered size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Blockquote">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('blockquote')} style={{ width: 32, height: 32 }}>
              <Quote size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Horizontal Divider">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('hr')} style={{ width: 32, height: 32 }}>
              <Minus size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Link">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('link')} style={{ width: 32, height: 32 }}>
              <Link size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Table">
            <IconButton variant="ghost" color="gray" size="2" onClick={() => onFormatAction('table')} style={{ width: 32, height: 32 }}>
              <Table size={15} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      <Separator orientation="vertical" size="2" style={{ height: 24, opacity: 0.15 }} />

      {/* Collaboration, View Switcher & AI Agent Actions */}
      <Flex align="center" gap="3">
        {/* Share Button */}
        <Tooltip content="Share Document">
          <Button variant="soft" color="violet" size="2" onClick={onOpenShare} style={{ height: 38, borderRadius: 10 }}>
            <Share2 size={16} /> Share
          </Button>
        </Tooltip>

        {/* Comments Drawer Button */}
        <Tooltip content="Toggle Discussion Comments">
          <Button variant="soft" color="gray" size="2" onClick={onOpenComments} style={{ height: 38, borderRadius: 10, position: 'relative' }}>
            <MessageSquare size={16} />
            {commentsCount > 0 && (
              <Badge color="violet" variant="solid" size="1" style={{ borderRadius: 10, marginLeft: 2 }}>
                {commentsCount}
              </Badge>
            )}
          </Button>
        </Tooltip>

        {/* Segmented View Switcher */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '2px',
            height: '38px',
          }}
        >
          <button
            type="button"
            onClick={() => onViewChange('wysiwyg')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 14px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              lineHeight: 1,
              transition: 'all 0.15s ease',
              background: currentMode === 'wysiwyg' ? '#7c3aed' : 'transparent',
              color: currentMode === 'wysiwyg' ? '#ffffff' : '#94a3b8',
              boxShadow: currentMode === 'wysiwyg' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            <Pencil size={14} /> WYSIWYG
          </button>

          <button
            type="button"
            onClick={() => onViewChange('source')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 14px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              lineHeight: 1,
              transition: 'all 0.15s ease',
              background: currentMode === 'source' ? '#7c3aed' : 'transparent',
              color: currentMode === 'source' ? '#ffffff' : '#94a3b8',
              boxShadow: currentMode === 'source' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            <Code size={14} /> Source
          </button>

          <button
            type="button"
            onClick={() => onViewChange('split')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 14px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              lineHeight: 1,
              transition: 'all 0.15s ease',
              background: currentMode === 'split' ? '#7c3aed' : 'transparent',
              color: currentMode === 'split' ? '#ffffff' : '#94a3b8',
              boxShadow: currentMode === 'split' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            <BookOpen size={14} /> Split
          </button>
        </div>

        {/* Dedicated Ask AI Agent Button */}
        <Tooltip content="Ask AI Agent (Ctrl+K)">
          <Button variant="soft" color="violet" size="2" onClick={onOpenAgentBar} style={{ height: 38, borderRadius: 10, cursor: 'pointer' }}>
            <Bot size={16} /> Ask Agent ✦
          </Button>
        </Tooltip>

        {/* AI Actions Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button className="ai-glow-button" size="2" style={{ height: 38, padding: '0 16px', borderRadius: 10 }}>
              <Wand2 size={16} />
              AI Actions
              <ChevronDown size={14} />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content variant="soft" color="violet" style={{ minWidth: 290, padding: 8, borderRadius: 12 }}>
            <DropdownMenu.Item
              onClick={onOpenAgentBar}
              style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontWeight: 'bold' }}
            >
              <Bot size={15} />
              Ask AI Agent (Custom Prompt)
              <Badge color="violet" variant="solid" size="1" style={{ marginLeft: 'auto' }}>
                Ctrl+K
              </Badge>
            </DropdownMenu.Item>

            <DropdownMenu.Separator style={{ margin: '6px 0' }} />

            <DropdownMenu.Item onClick={() => onAIFix('fix')} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <Wand2 size={15} />
              Fix Markdown Syntax
              <Badge color="gray" variant="surface" size="1" style={{ marginLeft: 'auto' }}>
                Ctrl+Shift+F
              </Badge>
            </DropdownMenu.Item>

            <DropdownMenu.Item onClick={() => onAIFix('grammar')} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <Pencil size={15} />
              Improve Grammar & Style
              <Badge color="gray" variant="surface" size="1" style={{ marginLeft: 'auto' }}>
                Ctrl+Shift+G
              </Badge>
            </DropdownMenu.Item>

            <DropdownMenu.Item onClick={() => onAIFix('structure')} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <List size={15} />
              Improve Structure
              <Badge color="gray" variant="surface" size="1" style={{ marginLeft: 'auto' }}>
                Ctrl+Shift+H
              </Badge>
            </DropdownMenu.Item>

            <DropdownMenu.Item onClick={() => onAIFix('expand')} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <FilePlus size={15} />
              Generate Missing Content
              <Badge color="gray" variant="surface" size="1" style={{ marginLeft: 'auto' }}>
                Ctrl+Shift+E
              </Badge>
            </DropdownMenu.Item>

            <DropdownMenu.Item onClick={() => onAIFix('convert')} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <BookOpen size={15} />
              Convert Text → Markdown
            </DropdownMenu.Item>

            <DropdownMenu.Separator style={{ margin: '6px 0' }} />

            {/* Provider & Model Selector */}
            <Flex direction="column" gap="2" px="2" py="1">
              <Flex align="center" justify="space-between">
                <Text size="1" weight="bold" style={{ color: '#cbd5e1' }}>
                  {providerInfo.icon} {providerInfo.name}
                </Text>
                <IconButton size="1" variant="ghost" color="violet" onClick={onOpenAiSettings} style={{ width: 24, height: 24 }}>
                  <Settings size={13} />
                </IconButton>
              </Flex>

              <Flex align="center" gap="2">
                <Select.Root value={selectedModel || ''} onValueChange={onModelSelect}>
                  <Select.Trigger placeholder="Select model" variant="soft" size="1" style={{ flex: 1, height: 28 }} />
                  <Select.Content size="1">
                    {availableModels.length === 0 ? (
                      <Select.Item value="" disabled>
                        No models found
                      </Select.Item>
                    ) : (
                      availableModels.map((m) => (
                        <Select.Item key={m} value={m}>
                          {m}
                        </Select.Item>
                      ))
                    )}
                  </Select.Content>
                </Select.Root>

                <Tooltip content="Refresh model list">
                  <IconButton size="1" variant="ghost" color="gray" onClick={onRefreshModels} style={{ width: 24, height: 24 }}>
                    <RotateCw size={13} />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Flex>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
    </div>
  );
}
