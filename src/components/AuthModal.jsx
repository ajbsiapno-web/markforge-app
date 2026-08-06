import React, { useState } from 'react';
import { Dialog, Flex, Button, Text, Box, TextField, Checkbox } from '@radix-ui/themes';
import { Lock, Mail, User, KeyRound, X, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (isRegister && !name)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          // Supabase Sign Up
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { full_name: name.trim() },
            },
          });

          if (signUpError) throw signUpError;

          const userObj = {
            id: data.user?.id,
            name: name.trim(),
            email: data.user?.email || email.trim(),
            avatar: name.slice(0, 2).toUpperCase(),
            plan: 'Free Writer',
            joined: 'Just now',
          };
          onLogin(userObj);
        } else {
          // Supabase Sign In
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (signInError) throw signInError;

          const fullName = data.user?.user_metadata?.full_name || email.split('@')[0];
          const words = fullName.split(' ').filter(Boolean);
          const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();

          const userObj = {
            id: data.user?.id,
            name: fullName,
            email: data.user?.email || email.trim(),
            avatar: initials,
            plan: 'Pro Plan',
            joined: new Date(data.user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          };
          onLogin(userObj);
        }
      } else {
        // Fallback local auth if Supabase credentials are not in .env.local yet
        const displayName = isRegister ? name.trim() : email.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = displayName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const words = formattedName.split(' ').filter(Boolean);
        const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : formattedName.slice(0, 2).toUpperCase();

        const userObj = {
          name: formattedName,
          email: email.trim(),
          avatar: initials,
          plan: 'Writer',
          joined: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };
        onLogin(userObj);
      }

      onClose();
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content
        style={{
          maxWidth: 420,
          background: 'rgba(20, 24, 36, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.25)',
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
                color: 'white',
              }}
            >
              <KeyRound size={18} />
            </Flex>
            <Text weight="bold" size="3" style={{ color: '#f8fafc' }}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Text>
          </Flex>

          <Dialog.Close>
            <Button variant="ghost" color="gray" size="1" onClick={onClose} style={{ borderRadius: 8 }}>
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <Box p="5">
            <Flex direction="column" gap="4">
              {!isSupabaseConfigured && (
                <Box p="2" style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', borderRadius: 8 }}>
                  <Flex align="center" gap="2">
                    <AlertCircle size={15} color="#eab308" />
                    <Text size="1" color="yellow">
                      Set <code>VITE_SUPABASE_URL</code> in <code>.env.local</code> to connect live Supabase project.
                    </Text>
                  </Flex>
                </Box>
              )}

              {error && (
                <Box p="2" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 8 }}>
                  <Text color="red" size="1" weight="medium">
                    {error}
                  </Text>
                </Box>
              )}

              {isRegister && (
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                    Full Name
                  </Text>
                  <TextField.Root
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ height: 40, borderRadius: 10 }}
                  >
                    <TextField.Slot>
                      <User size={16} color="#94a3b8" />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>
              )}

              <Flex direction="column" gap="1">
                <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                  Email Address
                </Text>
                <TextField.Root
                  placeholder="your.email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ height: 40, borderRadius: 10 }}
                >
                  <TextField.Slot>
                    <Mail size={16} color="#94a3b8" />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Flex direction="column" gap="1">
                <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>
                  Password
                </Text>
                <TextField.Root
                  placeholder="••••••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ height: 40, borderRadius: 10 }}
                >
                  <TextField.Slot>
                    <Lock size={16} color="#94a3b8" />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>

              <Flex align="center" justify="space-between" mt="1">
                <Flex align="center" gap="2">
                  <Checkbox defaultChecked id="remember" />
                  <Text size="1" style={{ color: '#94a3b8' }}>
                    Remember me
                  </Text>
                </Flex>
                <Button variant="link" color="violet" size="1" type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                  {isRegister ? 'Sign in instead' : 'Need an account?'}
                </Button>
              </Flex>

              <Button
                className="ai-glow-button"
                size="3"
                type="submit"
                disabled={loading}
                style={{ height: 42, borderRadius: 10, marginTop: 8, cursor: 'pointer' }}
              >
                {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
              </Button>
            </Flex>
          </Box>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
