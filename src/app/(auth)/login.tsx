import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Input, Screen, Typography } from '@/components/ui';
import { theme } from '@/lib/theme';

export default function LoginScreen() {
  return (
    <Screen contentStyle={styles.screenContent}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Typography variant="title">Welcome back</Typography>
          <Typography variant="subtitle">Log in to continue managing your pet care.</Typography>
        </View>

        <Divider />

        <View style={styles.form}>
          <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" placeholder="Your password" secureTextEntry />
          <Button>Log In</Button>
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
