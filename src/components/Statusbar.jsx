import { Flex, Text, Tooltip } from '@radix-ui/themes';

export default function Statusbar({ markdown, ollamaStatus, modelCount, onRefresh }) {
  const text = markdown || '';
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const lines = text.split('\n').length;

  return (
    <Flex
      align="center"
      justify="space-between"
      px="4"
      style={{
        height: 32,
        background: '#080a0f',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: 13,
        color: '#64748b',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left stats */}
      <Flex align="center" gap="4">
        <Text size="2" style={{ color: '#94a3b8', fontSize: 12 }}>
          {words} {words === 1 ? 'word' : 'words'}
        </Text>
        <span style={{ color: '#334155' }}>·</span>
        <Text size="2" style={{ color: '#94a3b8', fontSize: 12 }}>
          {chars} {chars === 1 ? 'char' : 'chars'}
        </Text>
        <span style={{ color: '#334155' }}>·</span>
        <Text size="2" style={{ color: '#94a3b8', fontSize: 12 }}>
          {lines} {lines === 1 ? 'line' : 'lines'}
        </Text>
      </Flex>

      {/* Right Ollama Status */}
      <Tooltip content="Click to check Ollama status">
        <Flex
          align="center"
          gap="2"
          onClick={onRefresh}
          style={{
            cursor: 'pointer',
            padding: '3px 10px',
            borderRadius: 14,
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                ollamaStatus === 'online'
                  ? '#22c55e'
                  : ollamaStatus === 'loading'
                  ? '#eab308'
                  : '#64748b',
              boxShadow: ollamaStatus === 'online' ? '0 0 8px #22c55e' : 'none',
            }}
          />
          <Text size="1" weight="medium" style={{ color: ollamaStatus === 'online' ? '#e2e8f0' : '#64748b', fontSize: 12 }}>
            {ollamaStatus === 'online'
              ? `Ollama · ${modelCount} ${modelCount === 1 ? 'model' : 'models'}`
              : ollamaStatus === 'loading'
              ? 'Checking Ollama...'
              : 'Ollama offline'}
          </Text>
        </Flex>
      </Tooltip>
    </Flex>
  );
}
