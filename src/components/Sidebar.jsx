import React, { useMemo, useState } from 'react';
import { Flex, Text, Box, Card, Badge, Separator, Button, IconButton, Tooltip } from '@radix-ui/themes';
import { List, Clock, FileText, FolderPlus, Trash2, Cloud, Check } from 'lucide-react';

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
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'outline'

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

  return (
    <Box
      className="glass-pane"
      style={{
        width: 280,
        height: '100%',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 20,
      }}
    >
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
              <Tooltip content="New File">
                <IconButton size="1" variant="ghost" color="violet" onClick={onNewDoc}>
                  <FolderPlus size={15} />
                </IconButton>
              </Tooltip>
            </Flex>

            {userDocs?.length === 0 ? (
              <Box p="4" style={{ textAlign: 'center', color: '#64748b' }}>
                <FileText size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text size="2" color="gray">
                  No saved cloud files yet.
                  <br /> Save your document (Ctrl+S) to view it here!
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

                        <Flex align="center" gap="2">
                          <Text size="1" style={{ color: '#64748b', fontSize: 11 }}>
                            {formattedDate}
                          </Text>
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
                        </Flex>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            )}
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
