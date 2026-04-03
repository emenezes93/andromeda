/**
 * Card visual do relatório semanal (treinos, volume, água, peso, frase).
 * Exportável como imagem via ViewShot + expo-sharing (Instagram-friendly, dark theme).
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { WeeklyReportData } from '../services/weeklyReport';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

export interface WeeklyReportCardProps {
  data: WeeklyReportData;
  onClose: () => void;
}

export function WeeklyReportCard({ data, onClose }: WeeklyReportCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

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

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9, result: 'tmpfile' }}
        style={styles.card}
      >
        <Text style={styles.title}>Resumo da semana</Text>
        <Text style={styles.dateRange}>{formatDateRange(data.weekStart, data.weekEnd)}</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.workoutsCount}</Text>
            <Text style={styles.statLabel}>Treinos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.volumeTotalKg.toLocaleString('pt-BR')}</Text>
            <Text style={styles.statLabel}>Volume (kg)</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.waterAvgPct}%</Text>
            <Text style={styles.statLabel}>Água (média)</Text>
          </View>
        </View>

        {data.weightChangeKg != null && (
          <View style={styles.weightRow}>
            <Text style={styles.weightLabel}>Variação de peso:</Text>
            <Text style={[styles.weightValue, data.weightChangeKg >= 0 ? styles.weightUp : styles.weightDown]}>
              {data.weightChangeKg >= 0 ? '+' : ''}{data.weightChangeKg} kg
            </Text>
          </View>
        )}

        <Text style={styles.phrase}>{data.motivationalPhrase}</Text>
        <Text style={styles.watermark}>Andromeda</Text>
      </ViewShot>

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
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    dateRange: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl },
    stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.xl },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
    statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    weightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
    weightLabel: { fontSize: 14, color: colors.textMuted, marginRight: spacing.sm },
    weightValue: { fontSize: 16, fontWeight: '600' },
    weightUp: { color: colors.success },
    weightDown: { color: colors.primary },
    phrase: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.xl },
    watermark: { fontSize: 12, color: colors.textSubtle },
    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
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
    closeBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, justifyContent: 'center' },
    closeBtnText: { color: colors.primary, fontSize: 16 },
  });
}
