import { Flex, Box, IconButton, Button, Tooltip, Badge } from '@radix-ui/themes';
import {
  Search,
  Replace,
  ChevronDown,
  ChevronUp,
  X,
  CaseSensitive,
  ChevronRight,
} from 'lucide-react';

export default function FindReplaceBar({
  isOpen,
  showReplace,
  findText,
  replaceText,
  onFindChange,
  onReplaceChange,
  matchIndex,
  totalMatches,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
  onClose,
  onToggleReplace,
  isCaseSensitive,
  onToggleCaseSensitive,
  findInputRef,
  replaceInputRef,
}) {
  if (!isOpen) return null;

  const counterText = !findText.trim()
    ? '0 matches'
    : totalMatches > 0
    ? `${matchIndex + 1} of ${totalMatches}`
    : '0 of 0';

  const handleFindKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleReplaceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.altKey || e.metaKey) {
        onReplaceAll();
      } else {
        onReplace();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Box
      className="find-replace-bar"
      style={{
        position: 'absolute',
        top: 16,
        right: 24,
        zIndex: 100,
        backgroundColor: 'rgba(15, 18, 28, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(139, 92, 246, 0.15)',
        width: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Find Row */}
      <Flex align="center" justify="space-between" gap="2">
        <Flex align="center" gap="2" style={{ flex: 1 }}>
          <Tooltip content={showReplace ? 'Hide Replace' : 'Show Replace (Ctrl+H)'}>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={onToggleReplace}
              style={{ cursor: 'pointer' }}
            >
              {showReplace ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </IconButton>
          </Tooltip>

          <Search size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />

          <input
            ref={findInputRef}
            type="text"
            placeholder="Find text..."
            value={findText}
            onChange={(e) => onFindChange(e.target.value)}
            onKeyDown={handleFindKeyDown}
            style={{
              flex: 1,
              background: 'rgba(9, 11, 17, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#f8fafc',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />

          <Badge
            variant="soft"
            color={totalMatches > 0 ? 'violet' : 'gray'}
            style={{
              fontSize: 11,
              minWidth: 55,
              textAlign: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
          >
            {counterText}
          </Badge>
        </Flex>

        <Flex align="center" gap="1">
          <Tooltip content="Match Case (Case Sensitive)">
            <IconButton
              size="1"
              variant={isCaseSensitive ? 'soft' : 'ghost'}
              color={isCaseSensitive ? 'violet' : 'gray'}
              onClick={onToggleCaseSensitive}
              style={{ cursor: 'pointer' }}
            >
              <CaseSensitive size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Previous Match (Shift+Enter)">
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={onPrev}
              disabled={totalMatches === 0}
              style={{ cursor: totalMatches > 0 ? 'pointer' : 'default' }}
            >
              <ChevronUp size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Next Match (Enter)">
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={onNext}
              disabled={totalMatches === 0}
              style={{ cursor: totalMatches > 0 ? 'pointer' : 'default' }}
            >
              <ChevronDown size={15} />
            </IconButton>
          </Tooltip>

          <Tooltip content="Close (Esc)">
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={onClose}
              style={{ cursor: 'pointer', marginLeft: 2 }}
            >
              <X size={15} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      {/* Replace Row */}
      {showReplace && (
        <Flex align="center" justify="space-between" gap="2" style={{ paddingTop: 2 }}>
          <Flex align="center" gap="2" style={{ flex: 1 }}>
            <Replace size={15} style={{ color: '#c084fc', flexShrink: 0, marginLeft: 23 }} />

            <input
              ref={replaceInputRef}
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => onReplaceChange(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              style={{
                flex: 1,
                background: 'rgba(9, 11, 17, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 6,
                padding: '5px 10px',
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </Flex>

          <Flex align="center" gap="2">
            <Button
              size="1"
              variant="soft"
              color="violet"
              onClick={onReplace}
              disabled={totalMatches === 0 || !findText.trim()}
              style={{ cursor: totalMatches > 0 && findText.trim() ? 'pointer' : 'default' }}
            >
              Replace
            </Button>
            <Button
              size="1"
              variant="solid"
              color="violet"
              onClick={onReplaceAll}
              disabled={totalMatches === 0 || !findText.trim()}
              style={{ cursor: totalMatches > 0 && findText.trim() ? 'pointer' : 'default' }}
            >
              Replace All
            </Button>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
