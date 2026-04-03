import React, { useMemo, useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { radius, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';

const MEDIA_HEIGHT = 160;

interface ExerciseMediaProps {
  /** Preferir GIF para mostrar o movimento; se não houver, usa imageUrl. */
  gifUrl?: string | null;
  imageUrl?: string | null;
  exerciseName?: string;
}

export function ExerciseMedia({ gifUrl, imageUrl, exerciseName }: ExerciseMediaProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const uri = gifUrl || imageUrl;
  if (!uri || error) return null;

  return (
    <View style={styles.wrapper}>
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.media, loading && styles.mediaLoading]}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {!loading && gifUrl && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GIF</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrapper: {
      width: '100%',
      height: MEDIA_HEIGHT,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      marginBottom: spacing.md,
    },
    media: {
      width: '100%',
      height: MEDIA_HEIGHT,
    },
    mediaLoading: {
      opacity: 0.3,
    },
    loadingWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
    },
  });
}
