import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, Card, TextArea, Avatar, IconButton, Tooltip } from '@radix-ui/themes';
import { MessageSquare, Send, Trash2, X, Sparkles } from 'lucide-react';
import { fetchDocumentComments, addDocumentComment, deleteDocumentComment } from '../lib/commentsAndShares';

export default function CommentsDrawer({ isOpen, onClose, docId, docTitle, user }) {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && docId) {
      fetchDocumentComments(docId).then(setComments);
    }
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setLoading(true);
    try {
      const added = await addDocumentComment(docId || `doc_${Date.now()}`, user, newCommentText);
      if (added) {
        setComments((prev) => [...prev, added]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteDocumentComment(docId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <Box
      className="glass-pane"
      style={{
        width: 320,
        height: '100%',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 20,
      }}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" p="3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Flex align="center" gap="2">
          <MessageSquare size={18} color="#c084fc" />
          <Text weight="bold" size="2" style={{ color: '#f8fafc' }}>
            Comments ({comments.length})
          </Text>
        </Flex>

        <IconButton size="1" variant="ghost" color="gray" onClick={onClose} style={{ borderRadius: 6 }}>
          <X size={16} />
        </IconButton>
      </Flex>

      {/* Comments List */}
      <Box style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {comments.length === 0 ? (
          <Flex align="center" justify="center" direction="column" gap="2" style={{ padding: '60px 0', color: '#64748b' }}>
            <MessageSquare size={28} style={{ opacity: 0.4 }} />
            <Text size="2" color="gray" style={{ textAlign: 'center' }}>
              No comments yet.
              <br /> Start the discussion below!
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap="3">
            {comments.map((c) => {
              const formattedDate = new Date(c.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={c.id} variant="surface" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 12, padding: 12 }}>
                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap="2">
                        <Flex
                          align="center"
                          justify="center"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {c.author_avatar || 'U'}
                        </Flex>
                        <Text size="2" weight="bold" style={{ color: '#f1f5f9' }}>
                          {c.author_name}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <Text size="1" style={{ color: '#64748b', fontSize: 10 }}>
                          {formattedDate}
                        </Text>
                        <Tooltip content="Delete Comment">
                          <IconButton size="1" variant="ghost" color="red" onClick={() => handleDeleteComment(c.id)}>
                            <Trash2 size={12} />
                          </IconButton>
                        </Tooltip>
                      </Flex>
                    </Flex>

                    <Text size="2" style={{ color: '#cbd5e1', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {c.content}
                    </Text>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        )}
      </Box>

      {/* New Comment Input Form */}
      <form onSubmit={handlePostComment} style={{ padding: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Flex direction="column" gap="2">
          <TextArea
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ borderRadius: 10, minHeight: 60, fontSize: 13 }}
          />

          <Button className="ai-glow-button" size="2" type="submit" disabled={loading || !newCommentText.trim()} style={{ borderRadius: 8, cursor: 'pointer' }}>
            <Send size={14} /> Post Comment
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
