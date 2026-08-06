import React from 'react';
import { Flex, Text, Button, DropdownMenu, Tooltip, Avatar, IconButton } from '@radix-ui/themes';
import { FileText, Check, User, LogOut, KeyRound, LogIn, ChevronDown, HelpCircle } from 'lucide-react';

export default function Titlebar({ filePath, isModified, user, onOpenAuth, onOpenProfile, onLogout, onOpenShortcuts }) {
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'Untitled.md';

  return (
    <div className="app-titlebar">
      {/* Left Brand */}
      <Flex align="center" gap="3">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
          }}
        >
          <FileText size={14} />
        </Flex>
        <Text weight="bold" style={{ color: '#f8fafc', fontSize: 14, letterSpacing: '0.4px' }}>
          MarkForge
        </Text>
      </Flex>

      {/* Center Document Title */}
      <Flex align="center" gap="2" className="titlebar-no-drag">
        <Text size="2" weight="medium" style={{ color: '#cbd5e1', fontSize: 13 }}>
          {fileName}
        </Text>

        <Tooltip content={isModified ? 'Unsaved changes' : 'All changes saved'}>
          <Flex align="center" gap="1" style={{ marginLeft: 6 }}>
            {isModified ? (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  boxShadow: '0 0 10px #f59e0b',
                  display: 'inline-block',
                }}
              />
            ) : (
              <Check color="#22c55e" size={14} />
            )}
          </Flex>
        </Tooltip>
      </Flex>

      {/* Right User Authentication / Profile / Help Area */}
      <Flex align="center" gap="3" className="titlebar-no-drag">
        <Tooltip content="Keyboard Shortcuts (?)">
          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            onClick={onOpenShortcuts}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              color: '#cbd5e1',
              cursor: 'pointer',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.15s ease',
            }}
          >
            <HelpCircle size={15} />
          </IconButton>
        </Tooltip>

        {user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '3px 10px 3px 4px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    position: 'relative',
                  }}
                >
                  {user.avatar || user.name[0].toUpperCase()}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      border: '1.5px solid #07090d',
                    }}
                  />
                </Flex>

                <Text size="2" weight="medium" style={{ color: '#f1f5f9', fontSize: 12 }}>
                  {user.name}
                </Text>
                <ChevronDown size={12} color="#94a3b8" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content variant="soft" color="violet" style={{ minWidth: 200, padding: 6, borderRadius: 12 }}>
              <DropdownMenu.Item onClick={onOpenProfile} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <User size={15} />
                View Profile
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={onOpenProfile} style={{ padding: '8px 12px', borderRadius: 8 }}>
                <KeyRound size={15} />
                Change Password
              </DropdownMenu.Item>

              <DropdownMenu.Separator style={{ margin: '4px 0' }} />

              <DropdownMenu.Item onClick={onLogout} color="red" style={{ padding: '8px 12px', borderRadius: 8 }}>
                <LogOut size={15} />
                Log Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : (
          <Button
            size="1"
            variant="soft"
            color="violet"
            onClick={onOpenAuth}
            style={{ height: 28, borderRadius: 14, padding: '0 12px', cursor: 'pointer' }}
          >
            <LogIn size={13} /> Sign In
          </Button>
        )}
      </Flex>
    </div>
  );
}
