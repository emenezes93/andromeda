import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, buttonHeight, touchTargetMin } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        },
        primary: { backgroundColor: colors.primary },
        secondary: {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
        },
        ghost: { backgroundColor: colors.semantic.interactive.ghost },
        danger: { backgroundColor: colors.error },
        disabled: { opacity: 0.7 },
        text: { fontSize: 16, fontWeight: '600' as const },
        text_primary: { color: '#0B111A' },
        text_secondary: { color: colors.textSecondary },
        text_ghost: { color: colors.primary },
        text_danger: { color: colors.semantic.text.onDanger },
      }),
    [colors]
  );
  const minH = Math.max(buttonHeight, touchTargetMin);
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        { minHeight: minH },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.semantic.text.onPrimary : variant === 'danger' ? colors.semantic.text.onDanger : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
