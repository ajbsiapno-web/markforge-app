import React, { useMemo, useState } from 'react';
import { Flex, Text, Box, Card, Badge, Button, IconButton, Tooltip } from '@radix-ui/themes';
import { List, Clock, FileText, FolderPlus, Trash2, Cloud, UploadCloud, Pencil } from 'lucide-react';

export default function Sidebar({
  markdown,
  isOpen,
  onCloseSidebar,
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
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.ceil(words / 200);
    return { words, chars, readTime };
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
    <>
      {/* Mobile Backdrop Overlay */}
      <div className="mobile-sidebar-backdrop" onClick={onCloseSidebar} />

      <Box
        className="glass-pane app-sidebar"
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

        {/* Tab Content 1: Files */}
        {activeTab === 'files' && (
          <Box p="3" style={{ flex: 1, overflowY: 'auto' }}>
            <Flex align="center" justify="space-between" mb="3">
              <Text size="1" weight="bold" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Cloud Documents
              </Text>
              <Tooltip content="Create New Cloud File">
                <IconButton size="1" variant="soft" color="violet" onClick={onNewDoc} style={{ width: 26, height: 26, borderRadius: 6 }}>
                  <FolderPlus size={14} />
                </IconButton>
              </Tooltip>
            </Flex>

            {userDocs.length === 0 ? (
              <Box p="4" style={{ textAlign: 'center', background: 'rgba(30, 41, 59, 0.3)', borderRadius: 10 }}>
                <Cloud size={32} style={{ color: '#64748b', marginBottom: 8 }} />
                <Text size="2" weight="medium" style={{ color: '#cbd5e1', display: 'block' }}>
                  No Cloud Files Yet
                </Text>
                <Text size="1" color="gray" style={{ display: 'block', marginTop: 4 }}>
                  Files saved while logged in will automatically sync here.
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap="2">
                {userDocs.map((doc) => {
                  const isActive = doc.id === activeDocId;

                  return (
                    <Card
                      key={doc.id}
                      onClick={() => onSelectDoc(doc)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(192, 132, 252, 0.15))' : 'rgba(30, 41, 59, 0.4)',
                        border: isActive ? '1px solid rgba(167, 139, 250, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                          <FileText size={16} color={isActive ? '#c084fc' : '#94a3b8'} />
                          <Text
                            size="2"
                            weight={isActive ? 'bold' : 'regular'}
                            style={{
                              color: isActive ? '#ffffff' : '#cbd5e1',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.title || 'Untitled.md'}
                          </Text>
                        </Flex>

                        <Flex align="center" gap="1">
                          <Tooltip content="Rename Document">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="gray"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt('Enter new document name:', doc.title || 'Untitled.md');
                                if (newTitle && newTitle.trim()) {
                                  onRenameDoc(doc.id, newTitle.trim());
                                }
                              }}
                              style={{ width: 22, height: 22, opacity: 0.7 }}
                            >
                              <Pencil size={12} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip content="Delete File">
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${doc.title}"?`)) onDeleteDoc(doc.id);
                              }}
                              style={{ width: 22, height: 22, opacity: 0.7 }}
                            >
                              <Trash2 size={12} />
                            </IconButton>
                          </Tooltip>
                        </Flex>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            )}
          </Box>
        )}

        {/* Tab Content 2: Document Outline */}
        {activeTab === 'outline' && (
          <Box p="3" style={{ flex: 1, overflowY: 'auto' }}>
            <Text size="1" weight="bold" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 12 }}>
              Table of Contents
            </Text>

            {headings.length === 0 ? (
              <Text size="2" color="gray">
                No headings found in document. Use # or ## to create headings.
              </Text>
            ) : (
              <Flex direction="column" gap="1">
                {headings.map((h, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={() => onSelectHeading && onSelectHeading(h.line)}
                    style={{
                      justifyContent: 'flex-start',
                      paddingLeft: (h.level - 1) * 14 + 8,
                      fontSize: 12,
                      color: h.level === 1 ? '#c084fc' : h.level === 2 ? '#e2e8f0' : '#94a3b8',
                      fontWeight: h.level === 1 ? 600 : 400,
                      borderRadius: 6,
                    }}
                  >
                    {h.text}
                  </Button>
                ))}
              </Flex>
            )}
          </Box>
        )}

        {/* Document Stats Footer */}
        <Box p="3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(10, 14, 23, 0.4)' }}>
          <Flex direction="column" gap="1">
            <Flex justify="space-between">
              <Text size="1" color="gray">
                Words:
              </Text>
              <Badge variant="soft" color="violet" size="1">
                {stats.words.toLocaleString()}
              </Badge>
            </Flex>
            <Flex justify="space-between">
              <Text size="1" color="gray">
                Characters:
              </Text>
              <Badge variant="soft" color="gray" size="1">
                {stats.chars.toLocaleString()}
              </Badge>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text size="1" color="gray" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Read time:
              </Text>
              <Text size="1" style={{ color: '#c084fc', fontWeight: 600 }}>
                ~{stats.readTime} min
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </>
  );
}
