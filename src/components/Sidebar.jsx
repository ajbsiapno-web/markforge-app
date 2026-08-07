import React, { useMemo, useState } from 'react';
import { Flex, Text, Box, Card, Badge, Button, IconButton, Tooltip } from '@radix-ui/themes';
import { List, Clock, FileText, FolderPlus, Trash2, Cloud, UploadCloud, Pencil } from 'lucide-react';

export default function Sidebar({
  markdown,
  isOpen,
  user,
  userDocs,
  activeDocId,
  onSelectDoc,
  onNewDoc,
  onDeleteDoc,
  onSelectHeading,
  onImportFile,
  onRenameDoc,
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'outline'
  const [isDragOverSidebar, setIsDragOverSidebar] = useState(false);

  // Extract outline (headings) from markdown text
  const headings = useMemo(() => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const items = [];
    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        items.push({
          level: match[1].length,
          text: match[2].replace(/[*_~`]/g, ''),
          line: idx,
        });
      }
    });
    return items;
  }, [markdown]);

  const stats = useMemo(() => {
    const text = markdown || '';
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

    return { words, readingTime, paragraphs };
  }, [markdown]);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverSidebar(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverSidebar(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverSidebar(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onImportFile(files[0]);
    }
  };

  return (
    <Box
      className="glass-pane"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 280,
        height: '100%',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 20,
        position: 'relative',
        background: isDragOverSidebar ? 'rgba(124, 58, 237, 0.15)' : undefined,
        transition: 'background 0.2s ease',
      }}
    >
      {/* Drag & Drop Visual Overlay on Sidebar */}
      {isDragOverSidebar && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 30,
            border: '2px dashed #a78bfa',
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        >
          <UploadCloud size={40} style={{ color: '#c084fc', marginBottom: 10 }} />
          <Text size="2" weight="bold" style={{ color: '#f8fafc' }}>
            Drop File Here
          </Text>
          <Text size="1" style={{ color: '#94a3b8', marginTop: 4 }}>
            Import into Cloud Documents
          </Text>
        </Flex>
      )}

      {/* Tab Switcher Header */}
      <Flex p="2" gap="1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button
          size="2"
          variant={activeTab === 'files' ? 'solid' : 'ghost'}
          color={activeTab === 'files' ? 'violet' : 'gray'}
          onClick={() => setActiveTab('files')}
          style={{ flex: 1, borderRadius: 8, cursor: 'pointer' }}
        >
          <Cloud size={15} /> My Files
        </Button>

        <Button
          size="2"
          variant={activeTab === 'outline' ? 'solid' : 'ghost'}
          color={activeTab === 'outline' ? 'violet' : 'gray'}
          onClick={() => setActiveTab('outline')}
          style={{ flex: 1, borderRadius: 8, cursor: 'pointer' }}
        >
          <List size={15} /> Outline
        </Button>
      </Flex>

      {/* Main Tab Content */}
      <Box style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* FILES TAB */}
        {activeTab === 'files' && (
          <Flex direction="column" gap="3">
            <Flex align="center" justify="space-between" px="1">
              <Text size="1" weight="bold" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>
                CLOUD DOCUMENTS ({userDocs?.length || 0})
              </Text>
              <Flex gap="1">
                <Tooltip content="Import File (.md)">
                  <IconButton size="1" variant="ghost" color="violet" onClick={() => document.getElementById('markforge-file-input')?.click()}>
                    <UploadCloud size={15} />
                  </IconButton>
                </Tooltip>
                <Tooltip content="New File">
                  <IconButton size="1" variant="ghost" color="violet" onClick={onNewDoc}>
                    <FolderPlus size={15} />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Flex>

            {userDocs?.length === 0 ? (
              <Box p="4" style={{ textAlign: 'center', color: '#64748b' }}>
                <FileText size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text size="2" color="gray">
                  No saved cloud files yet.
                  <br /> Save your document (Ctrl+S) or drag & drop a file here!
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap="2">
                {userDocs.map((doc) => {
                  const isActive = activeDocId === doc.id;
                  const formattedDate = new Date(doc.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <Card
                      key={doc.id}
                      variant="surface"
                      onClick={() => onSelectDoc(doc)}
                      style={{
                        background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                        border: isActive ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        padding: '10px 12px',
                        borderRadius: 10,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap="2" style={{ overflow: 'hidden' }}>
                          <FileText size={16} color={isActive ? '#c084fc' : '#94a3b8'} />
                          <Text
                            size="2"
                            weight={isActive ? 'bold' : 'medium'}
                            style={{ color: isActive ? '#f8fafc' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {doc.title}
                          </Text>
                        </Flex>

                        <Flex align="center" gap="1">
                          <Tooltip content="Rename">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Rename document:', doc.title);
                                if (newTitle && newTitle.trim() && newTitle.trim() !== doc.title) {
                                  onRenameDoc(doc.id, newTitle.trim());
                                }
                              }}
                            >
                              <Pencil size={13} color="#94a3b8" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip content="Delete">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${doc.title}"?`)) {
                                  onDeleteDoc(doc.id);
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </IconButton>
                          </Tooltip>
                        </Flex>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            )}

            {/* Drag & Drop Hint */}
            <Box
              style={{
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '10px 12px',
                textAlign: 'center',
                marginTop: 8,
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Text size="1" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <UploadCloud size={14} color="#8b5cf6" /> Drag & drop .md files to import
              </Text>
            </Box>
          </Flex>
        )}

        {/* OUTLINE TAB */}
        {activeTab === 'outline' && (
          <Flex direction="column" gap="2">
            <Text size="1" weight="bold" px="1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>
              DOCUMENT HEADINGS ({headings.length})
            </Text>

            {headings.length === 0 ? (
              <Box p="4" style={{ textAlign: 'center', color: '#64748b' }}>
                <List size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text size="2" color="gray">
                  No headings found.
                  <br /> Add # Headings to generate an outline!
                </Text>
              </Box>
            ) : (
              headings.map((h, i) => (
                <Box
                  key={i}
                  onClick={() => onSelectHeading && onSelectHeading(h.line)}
                  style={{
                    paddingLeft: (h.level - 1) * 12 + 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingRight: 8,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: h.level === 1 ? '#c084fc' : '#cbd5e1',
                    fontWeight: h.level === 1 ? 600 : 400,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Text size="2" truncate>
                    {h.text}
                  </Text>
                </Box>
              ))
            )}
          </Flex>
        )}
      </Box>

      {/* Footer Document Stats */}
      <Box p="3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(10, 14, 23, 0.5)' }}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap="1">
            <Clock size={13} color="#94a3b8" />
            <Text size="1" color="gray">
              {stats.readingTime} min read
            </Text>
          </Flex>
          <Badge size="1" color="violet" variant="soft">
            {stats.words} Words
          </Badge>
        </Flex>
      </Box>
    </Box>
  );
}
