import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
};

export function AppScreen({
  children,
  scrollable = false,
  edges = ['top', 'bottom'],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  refreshControl,
}: AppScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        backgroundDecorTop: {
          position: 'absolute',
          top: -140,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: colors.primaryLight,
          opacity: 0.28,
        },
        backgroundDecorBottom: {
          position: 'absolute',
          bottom: -170,
          left: -120,
          width: 300,
          height: 300,
          borderRadius: 999,
          backgroundColor: colors.accentLight,
          opacity: 0.22,
        },
      }),
    [colors]
  );

  const decor = (
    <>
      <View pointerEvents="none" style={styles.backgroundDecorTop} />
      <View pointerEvents="none" style={styles.backgroundDecorBottom} />
    </>
  );

  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {decor}
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {decor}
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
