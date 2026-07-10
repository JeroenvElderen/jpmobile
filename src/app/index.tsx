import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Typography } from '@/components/ui';
import { APP_NAME } from '@/lib/constants';
import { theme } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen centered contentStyle={styles.screenContent}>
      <Card style={styles.card}>
        <View style={styles.logo} accessibilityLabel="Jeroen & Paws logo">
          <Typography variant="display" align="center">🐾</Typography>
        </View>

        <View style={styles.copy}>
          <Typography variant="display" align="center">
            {APP_NAME}
          </Typography>
          <Typography variant="subtitle" align="center">
            Thoughtful care for every walk, wag, and whisker.
          </Typography>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => router.push('/(auth)/login')}>Log In</Button>
          <Button variant="secondary" onPress={() => router.push('/(auth)/register')}>
            Create Account
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    width: '100%',
  },
  card: {
    alignSelf: 'center',
    gap: theme.spacing.xl,
    maxWidth: 440,
    width: '100%',
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  copy: {
    gap: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
