import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { theme } from '@/lib/theme';

import { Typography } from './Typography';

type LoadingProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Loading({ label, style }: LoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={theme.colors.primaryLight} />
      {label ? <Typography variant="caption">{label}</Typography> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
});
