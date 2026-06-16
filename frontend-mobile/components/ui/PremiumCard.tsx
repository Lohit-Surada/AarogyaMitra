import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Palette, Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PremiumCardProps extends ViewProps {
  children: React.ReactNode;
  style?: object;
  noPadding?: boolean;
}

export function PremiumCard({ children, style, noPadding = false, ...props }: PremiumCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        noPadding ? { padding: 0 } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    ...Shadows.sm,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    ...Shadows.sm,
  },
});
