import { Dialog, Flex, Button, Text, Box, Spinner } from '@radix-ui/themes';
import { Wand2, X, Check } from 'lucide-react';

export default function AiModal({ isOpen, onClose, title, diff, isLoading, error, onApply }) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 800,
          maxHeight: '82vh',
          background: 'rgba(22, 27, 39, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
        }}
      >
        {/* Modal Header */}
        <Flex
          align="center"
          justify="space-between"
          px="4"
          py="3"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(168, 85, 247, 0.1))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Flex align="center" gap="2">
            <Wand2 color="#c084fc" size={18} />
            <Text weight="bold" size="3" style={{ color: '#f1f5f9' }}>
              {title || 'AI Assistance'}
            </Text>
            {isLoading && <Spinner size="2" color="violet" />}
          </Flex>

          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1">
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Modal Body / Diff Area */}
        <Box style={{ flex: 1, overflowY: 'auto', padding: 20, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {isLoading ? (
            <Flex align="center" justify="center" direction="column" gap="3" style={{ padding: '60px 0', color: '#94a3b8' }}>
              <Spinner size="3" color="violet" />
              <Text size="2" color="gray">
                Ollama AI model is thinking and generating content...
              </Text>
            </Flex>
          ) : error ? (
            <Box p="3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 8 }}>
              <Text color="red" weight="bold" size="2">
                Ollama Request Error
              </Text>
              <Text color="red" size="1" style={{ display: 'block', marginTop: 4 }}>
                {error}
              </Text>
              <Text size="1" color="gray" style={{ display: 'block', marginTop: 8 }}>
                Ensure Ollama service is running locally: <code>ollama serve</code>
              </Text>
            </Box>
          ) : diff && diff.length > 0 ? (
            <Box style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
              {diff.map((line, idx) => {
                if (line.type === 'added') {
                  return (
                    <span key={idx} className="diff-added">
                      + {line.text}
                    </span>
                  );
                } else if (line.type === 'removed') {
                  return (
                    <span key={idx} className="diff-removed">
                      - {line.text}
                    </span>
                  );
                } else {
                  return (
                    <span key={idx} className="diff-context">
                      {'  '}
                      {line.text}
                    </span>
                  );
                }
              })}
            </Box>
          ) : (
            <Text color="gray" size="2">
              No changes detected.
            </Text>
          )}
        </Box>

        {/* Modal Footer */}
        <Flex align="center" justify="end" gap="3" px="4" py="3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button variant="soft" color="gray" onClick={onClose}>
            <X size={14} /> Discard
          </Button>
          <Button
            className="ai-glow-button"
            disabled={isLoading || !!error}
            onClick={onApply}
          >
            <Check size={16} /> Apply Changes
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
