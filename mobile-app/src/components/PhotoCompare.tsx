/**
 * Comparativo lado a lado de duas fotos com divisor deslizável.
 * Marca d'água com data em cada lado; exportar como imagem via expo-sharing.
 */
import React, { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { setPhotoCompareUsed } from '../storage/achievements';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export interface PhotoCompareProps {
  leftUri: string;
  rightUri: string;
  leftDate: string;
  rightDate: string;
  onClose: () => void;
}

export function PhotoCompare({ leftUri, rightUri, leftDate, rightDate, onClose }: PhotoCompareProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [dividerPosition, setDividerPosition] = useState(0.5);
  const viewShotRef = useRef<ViewShot>(null);
  const positionRef = useRef(0.5);
  const startPositionRef = useRef(0.5);
  positionRef.current = dividerPosition;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPositionRef.current = positionRef.current;
      },
      onPanResponderMove: (_, g) => {
        const next = startPositionRef.current + g.dx / screenWidth;
        setDividerPosition(Math.max(0.15, Math.min(0.85, next)));
      },
    })
  ).current;

  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setPhotoCompareUsed().catch(() => {});
  }, []);

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Compartilhar', 'Compartilhamento não disponível neste dispositivo.');
      return;
    }
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar a imagem.');
    } finally {
      setSharing(false);
    }
  };

  const leftWidth = screenWidth * dividerPosition;
  const rightWidth = screenWidth * (1 - dividerPosition);
  const maxHeight = Math.min(screenHeight * 0.6, 400);

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9, result: 'tmpfile' }}
        style={[styles.captureArea, { height: maxHeight }]}
      >
        <View style={[styles.compareRow, { height: maxHeight }]}>
          <View style={[styles.half, { width: leftWidth }]}>
            <Image source={{ uri: leftUri }} style={[styles.photo, { width: leftWidth, height: maxHeight }]} resizeMode="cover" />
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>Antes</Text>
              <Text style={styles.watermarkDate}>{formatDate(leftDate)}</Text>
            </View>
          </View>
          <View style={[styles.half, { width: rightWidth }]}>
            <Image source={{ uri: rightUri }} style={[styles.photo, { width: rightWidth, height: maxHeight }]} resizeMode="cover" />
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>Depois</Text>
              <Text style={styles.watermarkDate}>{formatDate(rightDate)}</Text>
            </View>
          </View>
        </View>
      </ViewShot>

      <View style={[styles.sliderTrack, { height: maxHeight, top: 0 }]}>
        <View style={[styles.sliderThumb, { left: leftWidth - 16 }]} {...panResponder.panHandlers}>
          <View style={styles.sliderLine} />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>Exportar imagem</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    captureArea: { overflow: 'hidden' },
    compareRow: {
      flexDirection: 'row',
      width: '100%',
    },
    half: {
      overflow: 'hidden',
    },
    photo: {},
    watermark: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    watermarkText: { ...typography.caption, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    watermarkDate: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
    sliderTrack: {
      position: 'absolute',
      left: 0,
      right: 0,
      justifyContent: 'center',
      pointerEvents: 'box-none',
    },
    sliderThumb: {
      position: 'absolute',
      width: 32,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sliderLine: {
      width: 4,
      height: 48,
      borderRadius: 2,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    actions: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
    shareBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    closeBtn: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    closeBtnText: { color: colors.primary, fontSize: 16 },
  });
}
