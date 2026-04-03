import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, touchTargetMin, typography } from '../../theme';

type AppListItemProps = {
  label: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  rightText?: string;
  showChevron?: boolean;
  isLast?: boolean;
};

export function AppListItem({
  label,
  subtitle,
  icon,
  onPress,
  rightText,
  showChevron = true,
  isLast = false,
}: AppListItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: touchTargetMin,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        },
        iconWrap: {
          marginRight: spacing.md,
          width: 34,
          height: 34,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryLight,
        },
        textWrap: { flex: 1 },
        label: { ...typography.body, fontSize: 15, fontWeight: '600', color: colors.text },
        subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
        rightText: { fontSize: 13, color: colors.textMuted, marginRight: spacing.sm },
        chevronWrap: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, isLast]
  );

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!onPress}
    >
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
      {showChevron ? (
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
