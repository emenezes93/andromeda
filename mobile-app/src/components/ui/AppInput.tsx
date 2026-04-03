import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { inputHeight, radius, spacing, typography } from '../../theme';

type AppInputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppInput({
  label,
  hint,
  error,
  containerStyle,
  style,
  editable,
  ...inputProps
}: AppInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: spacing.lg },
        label: {
          ...typography.label,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        input: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          height: inputHeight,
          fontSize: 16,
          color: colors.text,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
        },
        inputDisabled: { opacity: 0.7 },
        hint: { marginTop: spacing.xs, fontSize: 12, color: colors.textMuted },
        error: { marginTop: spacing.xs, fontSize: 12, color: colors.error },
      }),
    [colors, error]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...inputProps}
        editable={editable}
        style={[styles.input, editable === false && styles.inputDisabled, style]}
        placeholderTextColor={inputProps.placeholderTextColor ?? colors.textSubtle}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
