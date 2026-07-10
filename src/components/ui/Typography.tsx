import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';

import { theme } from '@/lib/theme';

type TypographyVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type TypographyProps = ComponentProps<typeof Text> & {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
};

export function Typography({
  children,
  variant = 'body',
  color,
  align,
  style,
  ...props
}: TypographyProps) {
  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], color ? { color } : undefined, align ? { textAlign: align } : undefined, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
  },
  display: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 17,
    lineHeight: 25,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
});
