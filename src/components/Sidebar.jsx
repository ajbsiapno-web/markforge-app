import React, { useMemo, useState } from 'react';
import { Flex, Text, Box, Card, Badge, Separator, Button, IconButton, Tooltip } from '@radix-ui/themes';
import { List, Bookmark, Clock, FileText, FolderPlus, Trash2, Cloud, FileCode, Check } from 'lucide-react';

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

  if (!isOpen) return null;

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
      }}
    >
      {/* Sidebar Top Tab Switcher */}
      <Flex px="3" pt="3" gap="1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button
          variant={activeTab === 'files' ? 'soft' : 'ghost'}
          color={activeTab === 'files' ? 'violet' : 'gray'}
          size="2"
          onClick={() => setActiveTab('files')}
          style={{ flex: 1, borderRadius: '8px 8px 0 0', height: 34 }}
        >
          <Cloud size={15} /> My Files
          {userDocs && userDocs.length > 0 && (
            <Badge color="violet" variant="surface" size="1" style={{ marginLeft: 4 }}>
              {userDocs.length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === 'outline' ? 'soft' : 'ghost'}
          color={activeTab === 'outline' ? 'violet' : 'gray'}
          size="2"
          onClick={() => setActiveTab('outline')}
          style={{ flex: 1, borderRadius: '8px 8px 0 0', height: 34 }}
        >
          <List size={15} /> Outline
        </Button>
      </Flex>

      {/* Files Tab Body */}
      {activeTab === 'files' && (
        <Box style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <Flex align="center" justify="space-between" mb="3">
            <Text size="1" weight="medium" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user ? `${user.name.split(' ')[0]}'s Cloud Files` : 'Local Files'}
            </Text>
            <Tooltip content="New File">
              <IconButton size="1" variant="soft" color="violet" onClick={onNewDoc} style={{ borderRadius: 6 }}>
                <FolderPlus size={14} />
              </IconButton>
            </Tooltip>
          </Flex>

          {(!userDocs || userDocs.length === 0) ? (
            <Flex align="center" justify="center" direction="column" gap="3" style={{ padding: '40px 0', color: '#64748b' }}>
              <FileCode size={24} style={{ opacity: 0.5 }} />
              <Text size="2" color="gray" style={{ textAlign: 'center', lineHeight: 1.5 }}>
                No saved documents yet.
                <br /> Click <strong>Save (Ctrl+S)</strong> to store your first document!
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="2">
              {userDocs.map((doc) => {
                const isActive = doc.id === activeDocId;
                const formattedDate = new Date(doc.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Card
                    key={doc.id}
                    variant={isActive ? 'classic' : 'surface'}
                    style={{
                      background: isActive ? 'rgba(139, 92, 246, 0.18)' : 'rgba(30, 41, 59, 0.4)',
                      border: isActive ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => onSelectDoc(doc)}
                  >
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap="2" style={{ overflow: 'hidden' }}>
                        <FileText size={15} color={isActive ? '#c084fc' : '#94a3b8'} style={{ flexShrink: 0 }} />
                        <Flex direction="column" style={{ overflow: 'hidden' }}>
                          <Text
                            size="2"
                            weight={isActive ? 'bold' : 'medium'}
                            style={{
                              color: isActive ? '#f8fafc' : '#cbd5e1',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.title || 'Untitled.md'}
                          </Text>
                          <Text size="1" style={{ color: '#64748b', fontSize: 11 }}>
                            {formattedDate}
                          </Text>
                        </Flex>
                      </Flex>

                      <Tooltip content="Delete File">
                        <IconButton
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${doc.title}"?`)) onDeleteDoc(doc.id);
                          }}
                          style={{ borderRadius: 6, opacity: 0.7 }}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </Tooltip>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          )}
        </Box>
      )}

      {/* Outline Tab Body */}
      {activeTab === 'outline' && (
        <Box style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {headings.length === 0 ? (
            <Flex align="center" justify="center" direction="column" gap="3" style={{ padding: '40px 0', color: '#64748b' }}>
              <Bookmark size={24} style={{ opacity: 0.5 }} />
              <Text size="2" color="gray" style={{ textAlign: 'center', lineHeight: 1.5 }}>
                No headings found.
                <br /> Add # Headings to see outline.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="2">
              {headings.map((h, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => onSelectHeading && onSelectHeading(h.text)}
                  style={{
                    justifyContent: 'flex-start',
                    paddingLeft: (h.level - 1) * 16 + 10,
                    fontWeight: h.level === 1 ? 600 : 400,
                    color: h.level === 1 ? '#c084fc' : h.level === 2 ? '#e2e8f0' : '#94a3b8',
                    fontSize: 13,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    height: 32,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ opacity: 0.5, marginRight: 8, fontSize: 11 }}>{'#'.repeat(h.level)}</span>
                  {h.text}
                </Button>
              ))}
            </Flex>
          )}
        </Box>
      )}

      <Separator size="4" color="gray" style={{ opacity: 0.15 }} />

      {/* Document Stats Card */}
      <Box p="3">
        <Card variant="surface" style={{ background: 'rgba(22, 27, 39, 0.7)', borderRadius: 12, padding: 14 }}>
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <FileText size={14} color="#c084fc" />
              <Text size="2" weight="bold" style={{ color: '#f1f5f9' }}>
                Summary
              </Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Text size="1" color="gray">
                Words:
              </Text>
              <Text size="1" weight="bold" style={{ color: '#e2e8f0' }}>
                {stats.words}
              </Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Text size="1" color="gray">
                Paragraphs:
              </Text>
              <Text size="1" weight="bold" style={{ color: '#e2e8f0' }}>
                {stats.paragraphs}
              </Text>
            </Flex>

            <Flex justify="space-between" align="center">
              <Flex align="center" gap="1">
                <Clock size={12} color="#c084fc" />
                <Text size="1" color="gray">
                  Est. Read:
                </Text>
              </Flex>
              <Text size="1" weight="bold" style={{ color: '#c084fc' }}>
                ~{stats.readingTime} min
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
