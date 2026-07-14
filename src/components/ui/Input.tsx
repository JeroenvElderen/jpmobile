import { StyleSheet, TextInput, View } from 'react-native';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { theme } from '@/lib/theme';

import { Typography } from './Typography';

type InputProps = ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
};

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Typography variant="label">{label}</Typography> : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        {...props}
        style={[styles.input, error ? styles.inputError : undefined, style]}
      />
      {error ? <Typography variant="caption" color={theme.colors.danger}>{error}</Typography> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight,
  },
});
