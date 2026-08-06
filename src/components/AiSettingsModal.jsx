import React, { useState, useEffect } from 'react';
import { Dialog, Flex, Button, Text, Box, TextField, Select, Badge, Card, IconButton, Tabs } from '@radix-ui/themes';
import { Wand2, Key, Check, X, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { AI_PROVIDERS, getSavedApiKey, saveApiKey } from '../lib/aiProviders';

export default function AiSettingsModal({ isOpen, onClose, currentProvider, onProviderChange, onKeysUpdated }) {
  const [provider, setProvider] = useState(currentProvider || 'ollama');
  const [keys, setKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
  });
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeys({
        openai: getSavedApiKey('openai'),
        anthropic: getSavedApiKey('anthropic'),
        gemini: getSavedApiKey('gemini'),
      });
      setProvider(currentProvider || 'ollama');
    }
  }, [isOpen, currentProvider]);

  if (!isOpen) return null;

  const handleKeyChange = (providerId, val) => {
    setKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey('openai', keys.openai);
    saveApiKey('anthropic', keys.anthropic);
    saveApiKey('gemini', keys.gemini);

    onProviderChange(provider);
    if (onKeysUpdated) onKeysUpdated();

    setSavedStatus('Settings & API Keys Saved!');
    setTimeout(() => {
      setSavedStatus('');
      onClose();
    }, 1200);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 520,
          background: 'rgba(15, 18, 28, 0.96)',
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
              <Wand2 size={18} />
            </Flex>
            <Flex direction="column">
              <Text weight="bold" size="3" style={{ color: '#f8fafc' }}>
                AI Provider Settings
              </Text>
              <Text size="1" color="gray">
                Configure Local Ollama or Cloud AI APIs (OpenAI, Claude, Gemini)
              </Text>
            </Flex>
          </Flex>

          <Dialog.Close>
            <IconButton variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 8 }}>
              <X size={16} />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <form onSubmit={handleSave}>
          <Box p="5">
            <Flex direction="column" gap="4">
              {/* Active Provider Selector */}
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold" style={{ color: '#f1f5f9' }}>
                  Active AI Engine Provider
                </Text>

                <Select.Root value={provider} onValueChange={setProvider}>
                  <Select.Trigger style={{ height: 40, borderRadius: 10 }} />
                  <Select.Content>
                    {Object.values(AI_PROVIDERS).map((p) => (
                      <Select.Item key={p.id} value={p.id}>
                        {p.icon} {p.name} {!p.requiresKey ? '(Local Free)' : '(Cloud API)'}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Flex>

              {/* API Keys Configuration */}
              <Flex direction="column" gap="3" pt="2">
                <Text size="2" weight="bold" style={{ color: '#f1f5f9' }}>
                  API Keys Configuration
                </Text>

                {/* OpenAI Key */}
                <Card variant="surface" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 12, padding: 12 }}>
                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap="2">
                        <Text size="2" weight="bold" style={{ color: '#e2e8f0' }}>
                          ⚡ OpenAI (GPT-4o / GPT-4o-mini)
                        </Text>
                      </Flex>
                      {keys.openai && (
                        <Badge color="green" size="1" variant="soft">
                          Key Saved
                        </Badge>
                      )}
                    </Flex>
                    <TextField.Root
                      type="password"
                      placeholder="sk-proj-..."
                      value={keys.openai}
                      onChange={(e) => handleKeyChange('openai', e.target.value)}
                      style={{ borderRadius: 8, height: 36 }}
                    >
                      <TextField.Slot>
                        <Key size={14} color="#94a3b8" />
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>
                </Card>

                {/* Anthropic Key */}
                <Card variant="surface" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 12, padding: 12 }}>
                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="space-between">
                      <Text size="2" weight="bold" style={{ color: '#e2e8f0' }}>
                        🧠 Anthropic Claude (Claude 3.5 Sonnet)
                      </Text>
                      {keys.anthropic && (
                        <Badge color="green" size="1" variant="soft">
                          Key Saved
                        </Badge>
                      )}
                    </Flex>
                    <TextField.Root
                      type="password"
                      placeholder="sk-ant-api..."
                      value={keys.anthropic}
                      onChange={(e) => handleKeyChange('anthropic', e.target.value)}
                      style={{ borderRadius: 8, height: 36 }}
                    >
                      <TextField.Slot>
                        <Key size={14} color="#94a3b8" />
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>
                </Card>

                {/* Gemini Key */}
                <Card variant="surface" style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 12, padding: 12 }}>
                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="space-between">
                      <Text size="2" weight="bold" style={{ color: '#e2e8f0' }}>
                        ✨ Google Gemini (Gemini 1.5 Flash / Pro)
                      </Text>
                      {keys.gemini && (
                        <Badge color="green" size="1" variant="soft">
                          Key Saved
                        </Badge>
                      )}
                    </Flex>
                    <TextField.Root
                      type="password"
                      placeholder="AIzaSy..."
                      value={keys.gemini}
                      onChange={(e) => handleKeyChange('gemini', e.target.value)}
                      style={{ borderRadius: 8, height: 36 }}
                    >
                      <TextField.Slot>
                        <Key size={14} color="#94a3b8" />
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>
                </Card>
              </Flex>

              {savedStatus && (
                <Box p="2" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: 8 }}>
                  <Flex align="center" gap="2" justify="center">
                    <Check size={16} color="#4ade80" />
                    <Text color="green" size="2" weight="bold">
                      {savedStatus}
                    </Text>
                  </Flex>
                </Box>
              )}

              {/* Footer */}
              <Flex justify="end" gap="3" pt="2">
                <Button variant="soft" color="gray" onClick={onClose} type="button" style={{ borderRadius: 10 }}>
                  Cancel
                </Button>
                <Button className="ai-glow-button" size="2" type="submit" style={{ borderRadius: 10, cursor: 'pointer' }}>
                  Save AI Settings
                </Button>
              </Flex>
            </Flex>
          </Box>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
