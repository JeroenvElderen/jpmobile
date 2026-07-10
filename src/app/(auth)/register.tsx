import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Input, Screen, Typography } from '@/components/ui';
import { theme } from '@/lib/theme';

export default function RegisterScreen() {
  return (
    <Screen contentStyle={styles.screenContent}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Typography variant="title">Create your account</Typography>
          <Typography variant="subtitle">Start organizing trusted care for your favorite companions.</Typography>
        </View>

        <Divider />

        <View style={styles.form}>
          <Input label="Name" placeholder="Your name" autoCapitalize="words" />
          <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          <Input label="Password" placeholder="Create a password" secureTextEntry />
          <Button>Create Account</Button>
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
