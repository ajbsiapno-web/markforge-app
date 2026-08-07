import React, { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Text, Box, TextField, Select, Badge, Card, Tooltip, IconButton } from '@radix-ui/themes';
import { Share2, Copy, Check, UserPlus, Trash2, Globe, X, Mail, ExternalLink } from 'lucide-react';
import { fetchDocumentShares, shareDocumentWithUser, removeDocumentShare } from '../lib/commentsAndShares';

export default function ShareModal({ isOpen, onClose, docId, docTitle }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view'); // 'view' | 'edit'
  const [shares, setShares] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load current shares
  useEffect(() => {
    if (isOpen && docId) {
      fetchDocumentShares(docId).then(setShares);
    }
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const titleParam = encodeURIComponent(docTitle || 'Untitled.md');
  const shareUrl = `${window.location.origin}/?doc=${docId || 'draft'}&title=${titleParam}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(`📝 Check out "${docTitle || 'Untitled.md'}" on MarkForge:`);

    let url = '';
    if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;
    } else if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    }
  };

  const handleAddShare = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const newShare = await shareDocumentWithUser(docId || `doc_${Date.now()}`, email, permission);
      if (newShare) {
        setShares((prev) => [...prev, newShare]);
        setEmail('');
      }
    } catch (err) {
      setError(err.message || 'Failed to share document.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId) => {
    await removeDocumentShare(docId, shareId);
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 520,
          background: 'rgba(20, 24, 36, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 92, 246, 0.25)',
          borderRadius: 20,
          padding: 0,
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
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(192, 132, 252, 0.12))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                color: 'white',
              }}
            >
              <Share2 size={18} />
            </Flex>
            <Flex direction="column">
              <Text weight="bold" size="3" style={{ color: '#f8fafc' }}>
                Share Document
              </Text>
              <Text size="1" color="gray">
                "{docTitle || 'Untitled.md'}"
              </Text>
            </Flex>
          </Flex>

          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 8 }}>
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>

        <Box p="5">
          <Flex direction="column" gap="4">
            {/* Copy Link Section */}
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                Shareable Document URL (Includes Title)
              </Text>
              <Flex gap="2" align="center">
                <TextField.Root
                  readOnly
                  value={shareUrl}
                  style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(30, 41, 59, 0.5)' }}
                >
                  <TextField.Slot>
                    <Globe size={16} color="#94a3b8" />
                  </TextField.Slot>
                </TextField.Root>
                <Button
                  className="ai-glow-button"
                  size="2"
                  onClick={handleCopyLink}
                  style={{ height: 40, borderRadius: 10, padding: '0 16px', cursor: 'pointer' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </Flex>
            </Flex>

            {/* Direct Social Media Sharing Buttons */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                Share Directly to Social Media
              </Text>
              <Flex gap="2" wrap="wrap">
                <Button
                  size="2"
                  variant="soft"
                  onClick={() => handleSocialShare('facebook')}
                  style={{ background: 'rgba(24, 119, 242, 0.2)', color: '#60a5fa', border: '1px solid rgba(24, 119, 242, 0.4)', borderRadius: 10, cursor: 'pointer' }}
                >
                  📘 Facebook
                </Button>

                <Button
                  size="2"
                  variant="soft"
                  onClick={() => handleSocialShare('twitter')}
                  style={{ background: 'rgba(29, 155, 240, 0.2)', color: '#38bdf8', border: '1px solid rgba(29, 155, 240, 0.4)', borderRadius: 10, cursor: 'pointer' }}
                >
                  🐦 Twitter / X
                </Button>

                <Button
                  size="2"
                  variant="soft"
                  onClick={() => handleSocialShare('linkedin')}
                  style={{ background: 'rgba(10, 102, 194, 0.2)', color: '#818cf8', border: '1px solid rgba(10, 102, 194, 0.4)', borderRadius: 10, cursor: 'pointer' }}
                >
                  💼 LinkedIn
                </Button>

                <Button
                  size="2"
                  variant="soft"
                  onClick={() => handleSocialShare('whatsapp')}
                  style={{ background: 'rgba(37, 211, 102, 0.2)', color: '#4ade80', border: '1px solid rgba(37, 211, 102, 0.4)', borderRadius: 10, cursor: 'pointer' }}
                >
                  💬 WhatsApp
                </Button>
              </Flex>
            </Flex>

            {/* Invite Collaborator Form */}
            <form onSubmit={handleAddShare}>
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                  Invite Collaborator by Email
                </Text>

                {error && (
                  <Box p="2" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 8 }}>
                    <Text color="red" size="1">
                      {error}
                    </Text>
                  </Box>
                )}

                <Flex gap="2">
                  <TextField.Root
                    placeholder="colleague@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: 1, height: 38, borderRadius: 10 }}
                  >
                    <TextField.Slot>
                      <Mail size={15} color="#94a3b8" />
                    </TextField.Slot>
                  </TextField.Root>

                  <Select.Root value={permission} onValueChange={setPermission}>
                    <Select.Trigger style={{ width: 100, height: 38, borderRadius: 10 }} />
                    <Select.Content>
                      <Select.Item value="view">Can View</Select.Item>
                      <Select.Item value="edit">Can Edit</Select.Item>
                    </Select.Content>
                  </Select.Root>

                  <Button variant="solid" color="violet" size="2" type="submit" disabled={loading} style={{ height: 38, borderRadius: 10 }}>
                    <UserPlus size={15} /> Invite
                  </Button>
                </Flex>
              </Flex>
            </form>

            {/* Collaborators List */}
            <Flex direction="column" gap="2" pt="2">
              <Text size="2" weight="bold" style={{ color: '#f1f5f9' }}>
                People with Access ({shares.length})
              </Text>

              {shares.length === 0 ? (
                <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                  Only you currently have access to this document.
                </Text>
              ) : (
                <Flex direction="column" gap="2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {shares.map((s) => (
                    <Card key={s.id} variant="surface" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: 10 }}>
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap="2">
                          <Text size="2" style={{ color: '#e2e8f0' }}>
                            {s.shared_with_email}
                          </Text>
                          <Badge color={s.permission === 'edit' ? 'violet' : 'gray'} variant="soft" size="1">
                            {s.permission === 'edit' ? 'Can Edit' : 'Can View'}
                          </Badge>
                        </Flex>

                        <Tooltip content="Remove Access">
                          <Button size="1" variant="ghost" color="red" onClick={() => handleRemoveShare(s.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </Tooltip>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              )}
            </Flex>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}
