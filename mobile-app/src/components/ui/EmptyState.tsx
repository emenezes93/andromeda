import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme';

export function EmptyState({
  iconName,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        },
        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryLight,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.lg,
        },
        icon: {},
        title: {
          ...typography.titleSmall,
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        subtitle: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textMuted,
          textAlign: 'center',
          maxWidth: 320,
        },
        action: {
          marginTop: spacing.xl,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xl,
          minHeight: 44,
          borderRadius: radius.full,
          backgroundColor: colors.primaryLight,
          justifyContent: 'center',
        },
        actionText: { fontSize: 15, fontWeight: '700' as const, color: colors.primary },
      }),
    [colors]
  );
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={34} color={colors.primary} style={styles.icon} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
