import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Divider, Input, Screen, Typography } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const ADMIN_EMAIL = "jeroen@jeroenandpaws.com".toLowerCase();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('Enter your email and password to log in.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const authenticatedEmail = data.user?.email?.toLowerCase() ?? normalizedEmail.toLowerCase();

    if (authenticatedEmail === ADMIN_EMAIL) {
      router.replace('/admin');
      return;
    }

    router.replace('/client');
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Typography variant="title">Welcome back</Typography>
          <Typography variant="subtitle">Log in to continue managing your pet care.</Typography>
        </View>

        <Divider />

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="Your password"
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />
          {error ? <Typography variant="caption" color={theme.colors.danger}>{error}</Typography> : null}
          <Button loading={isSubmitting} onPress={handleLogin}>Log In</Button>
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
