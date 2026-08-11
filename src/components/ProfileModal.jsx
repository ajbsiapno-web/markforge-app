import { useState } from 'react';
import { Dialog, Flex, Button, Text, Box, TextField, Card, Badge } from '@radix-ui/themes';
import { User, Lock, ShieldCheck, LogOut, Check, X, KeyRound, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function ProfileModal({ isOpen, onClose, user, onLogout, onChangePasswordSuccess }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Change password state
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onChangePasswordSuccess) onChangePasswordSuccess();
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    }
    onLogout();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 480,
          background: 'rgba(20, 24, 36, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
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
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              }}
            >
              {user.avatar || user.name[0].toUpperCase()}
            </Flex>
            <Flex direction="column">
              <Flex align="center" gap="2">
                <Text weight="bold" size="3" style={{ color: '#f8fafc' }}>
                  {user.name}
                </Text>
                <Badge color="violet" variant="solid" size="1" style={{ borderRadius: 10 }}>
                  <Sparkles size={10} style={{ marginRight: 2 }} /> {user.plan || 'Pro Plan'}
                </Badge>
              </Flex>
              <Text size="2" color="gray" style={{ fontSize: 13 }}>
                {user.email}
              </Text>
            </Flex>
          </Flex>

          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 8 }}>
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Tab Switcher */}
        <Flex px="5" pt="3" gap="2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Button
            variant={activeTab === 'profile' ? 'soft' : 'ghost'}
            color={activeTab === 'profile' ? 'violet' : 'gray'}
            onClick={() => setActiveTab('profile')}
            style={{ borderRadius: '8px 8px 0 0', height: 36, padding: '0 16px' }}
          >
            <User size={15} /> User Profile
          </Button>

          <Button
            variant={activeTab === 'password' ? 'soft' : 'ghost'}
            color={activeTab === 'password' ? 'violet' : 'gray'}
            onClick={() => setActiveTab('password')}
            style={{ borderRadius: '8px 8px 0 0', height: 36, padding: '0 16px' }}
          >
            <KeyRound size={15} /> Change Password
          </Button>
        </Flex>

        {/* Profile Tab Body */}
        {activeTab === 'profile' && (
          <Box p="5">
            <Flex direction="column" gap="4">
              <Card variant="surface" style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 14, padding: 16 }}>
                <Flex direction="column" gap="3">
                  <Flex justify="space-between" align="center">
                    <Text size="2" color="gray">
                      Account Status:
                    </Text>
                    <Badge color="green" variant="soft" size="2">
                      <ShieldCheck size={12} style={{ marginRight: 4 }} /> Supabase Authenticated
                    </Badge>
                  </Flex>

                  <Flex justify="space-between" align="center">
                    <Text size="2" color="gray">
                      Member Since:
                    </Text>
                    <Text size="2" weight="bold" style={{ color: '#e2e8f0' }}>
                      {user.joined || 'August 2026'}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" align="center">
                    <Text size="2" color="gray">
                      Database Backend:
                    </Text>
                    <Text size="2" weight="bold" style={{ color: '#c084fc' }}>
                      Supabase Cloud DB
                    </Text>
                  </Flex>
                </Flex>
              </Card>

              <Flex justify="space-between" align="center" pt="2">
                <Button variant="outline" color="violet" onClick={() => setActiveTab('password')} style={{ borderRadius: 10 }}>
                  <KeyRound size={15} /> Change Password
                </Button>

                <Button
                  variant="solid"
                  color="red"
                  onClick={handleLogoutAction}
                  style={{ borderRadius: 10, cursor: 'pointer' }}
                >
                  <LogOut size={15} /> Log Out
                </Button>
              </Flex>
            </Flex>
          </Box>
        )}

        {/* Change Password Tab Body */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <Box p="5">
              <Flex direction="column" gap="4">
                {passwordError && (
                  <Box p="2" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 8 }}>
                    <Text color="red" size="1" weight="medium">
                      {passwordError}
                    </Text>
                  </Box>
                )}

                {passwordSuccess && (
                  <Box p="2" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: 8 }}>
                    <Flex align="center" gap="2">
                      <Check color="#22c55e" size={16} />
                      <Text color="green" size="1" weight="medium">
                        Password updated in Supabase successfully!
                      </Text>
                    </Flex>
                  </Box>
                )}

                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                    New Password
                  </Text>
                  <TextField.Root
                    placeholder="Enter new password (min 6 chars)"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  >
                    <TextField.Slot>
                      <KeyRound size={16} color="#94a3b8" />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                    Confirm New Password
                  </Text>
                  <TextField.Root
                    placeholder="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  >
                    <TextField.Slot>
                      <Lock size={16} color="#94a3b8" />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>

                <Button
                  className="ai-glow-button"
                  size="3"
                  type="submit"
                  disabled={loading}
                  style={{ height: 42, borderRadius: 10, marginTop: 8, cursor: 'pointer' }}
                >
                  <Check size={16} /> {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </Flex>
            </Box>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
