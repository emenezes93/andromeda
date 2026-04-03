import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

export function SkeletonBlock({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.sm,
        },
      }),
    [colors.surfaceElevated]
  );

  return <Animated.View style={[styles.block, { opacity }, style]} />;
}
