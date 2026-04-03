import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function AppCard({ children, style, padded = true }: AppCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000000',
          shadowOpacity: 0.24,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        },
        padded: { padding: spacing.xl },
      }),
    [colors]
  );

  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}
