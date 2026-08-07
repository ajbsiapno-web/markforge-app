import React, { useState, useEffect, useRef } from 'react';
import { Flex, Text, Box, Button, TextField, Badge, IconButton } from '@radix-ui/themes';
import { Bot, Sparkles, Workflow, Table, Wand2, X, Send, GitFork, Calculator } from 'lucide-react';

export default function AiAgentBar({ isOpen, onClose, onSubmitPrompt, activeProvider, selectedModel }) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setPrompt('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    onSubmitPrompt(prompt.trim());
    onClose();
  };

  const handleChipClick = (presetText) => {
    setPrompt(presetText);
    onSubmitPrompt(presetText);
    onClose();
  };

  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 23, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 9990,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 640,
          background: 'rgba(20, 24, 36, 0.98)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 92, 246, 0.3)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <Flex
          align="center"
          justify="space-between"
          px="4"
          py="3"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(192, 132, 252, 0.1))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Flex align="center" gap="2">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                color: 'white',
              }}
            >
              <Bot size={16} />
            </Flex>
            <Text weight="bold" size="2" style={{ color: '#f8fafc' }}>
              MarkForge AI Agent
            </Text>
            <Badge color="violet" variant="soft" size="1">
              {activeProvider.toUpperCase()} ({selectedModel || 'Default'})
            </Badge>
          </Flex>

          <IconButton variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 6 }}>
            <X size={16} />
          </IconButton>
        </Flex>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <Flex gap="2" align="center">
            <TextField.Root
              ref={inputRef}
              placeholder="Tell AI Agent what to generate (e.g. 'Generate a flowchart for order checkout process')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                fontSize: 14,
                background: 'rgba(30, 41, 59, 0.6)',
              }}
            >
              <TextField.Slot>
                <Sparkles size={18} color="#c084fc" />
              </TextField.Slot>
            </TextField.Root>

            <Button
              type="submit"
              className="ai-glow-button"
              size="3"
              disabled={!prompt.trim()}
              style={{ height: 44, borderRadius: 12, padding: '0 20px', cursor: 'pointer' }}
            >
              <Send size={16} /> Generate
            </Button>
          </Flex>

          {/* Quick Agentic Preset Chips */}
          <Flex direction="column" gap="2" mt="3">
            <Text size="1" weight="medium" style={{ color: '#94a3b8' }}>
              Quick Agentic Presets:
            </Text>

            <Flex gap="2" wrap="wrap">
              <Button
                type="button"
                size="1"
                variant="soft"
                color="violet"
                onClick={() => handleChipClick('Generate a detailed Mermaid flowchart diagram for a system architecture with user login, database, and API')}
                style={{ borderRadius: 8, cursor: 'pointer', padding: '6px 10px' }}
              >
                <Workflow size={13} /> 📊 Mermaid Flowchart
              </Button>

              <Button
                type="button"
                size="1"
                variant="soft"
                color="violet"
                onClick={() => handleChipClick('Generate a Mermaid sequence diagram showing OAuth authentication flow between Client, Server, and Auth Provider')}
                style={{ borderRadius: 8, cursor: 'pointer', padding: '6px 10px' }}
              >
                <GitFork size={13} /> 📐 Sequence Diagram
              </Button>

              <Button
                type="button"
                size="1"
                variant="soft"
                color="violet"
                onClick={() => handleChipClick('Generate a structured Markdown comparison table comparing MySQL, PostgreSQL, and MongoDB with feature columns')}
                style={{ borderRadius: 8, cursor: 'pointer', padding: '6px 10px' }}
              >
                <Table size={13} /> 📊 Feature Comparison Table
              </Button>

              <Button
                type="button"
                size="1"
                variant="soft"
                color="violet"
                onClick={() => handleChipClick('Generate mathematical formulas in LaTeX math format for calculus integration and matrix multiplication')}
                style={{ borderRadius: 8, cursor: 'pointer', padding: '6px 10px' }}
              >
                <Calculator size={13} /> 🧮 LaTeX Math Formulas
              </Button>

              <Button
                type="button"
                size="1"
                variant="soft"
                color="violet"
                onClick={() => handleChipClick('Summarize this document into clean bullet points with key takeaways and actionable action items')}
                style={{ borderRadius: 8, cursor: 'pointer', padding: '6px 10px' }}
              >
                <Wand2 size={13} /> 📝 Summarize Document
              </Button>
            </Flex>
          </Flex>
        </form>

        {/* Footer Hint */}
        <Box px="4" py="2" style={{ background: 'rgba(10, 14, 23, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Text size="1" color="gray" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            💡 Tip: Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>Ctrl+K</kbd> anywhere to launch the AI Agent.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
