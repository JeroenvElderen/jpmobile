import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Divider, Input, Screen, Typography } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      setError('Enter your name, email, and password to create an account.');
      setSuccessMessage(undefined);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setSuccessMessage(undefined);
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    setSuccessMessage(undefined);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          full_name: trimmedName,
        },
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.replace('/');
      return;
    }

    setSuccessMessage('Account created. Check your email to confirm your account, then log in.');
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Typography variant="title">Create your account</Typography>
          <Typography variant="subtitle">Start organizing trusted care for your favorite companions.</Typography>
        </View>

        <Divider />

        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            secureTextEntry
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />
          {error ? <Typography variant="caption" color={theme.colors.danger}>{error}</Typography> : null}
          {successMessage ? <Typography variant="caption" color={theme.colors.success}>{successMessage}</Typography> : null}
          <Button loading={isSubmitting} onPress={handleRegister}>Create Account</Button>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
  },
  card: {
    alignSelf: 'center',
    gap: theme.spacing.lg,
    maxWidth: 440,
    width: '100%',
  },
  header: {
    gap: theme.spacing.sm,
  },
  form: {
    gap: theme.spacing.md,
  },
});
