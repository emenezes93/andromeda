import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export function OfflineBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Modo offline — dados serão sincronizados quando houver conexão.</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.warning + 'E0',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    text: {
      ...typography.body,
      color: colors.text,
      textAlign: 'center',
    },
  });
}
