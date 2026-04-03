import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getProgressPhotos, saveProgressPhoto } from '../storage/progressPhotos';
import type { ProgressPhoto } from '../types';
import { spacing, radius, typography } from '../theme';
import { PhotoCompare } from '../components/PhotoCompare';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const ANGLES: Array<{ key: ProgressPhoto['angle']; label: string }> = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

export function ProgressPhotosScreen() {
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = React.useMemo(() => createStyles(colors, layout), [colors, layout]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareAngle, setCompareAngle] = useState<ProgressPhoto['angle']>('front');
  const [compareDate1, setCompareDate1] = useState<string | null>(null);
  const [compareDate2, setCompareDate2] = useState<string | null>(null);
  const [compareActive, setCompareActive] = useState<{ left: ProgressPhoto; right: ProgressPhoto } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = async (withInitialLoader = false) => {
    if (withInitialLoader) setInitialLoading(true);
    try {
      const list = await getProgressPhotos();
      setPhotos(list);
    } finally {
      if (withInitialLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const pickImage = async (angle?: ProgressPhoto['angle']) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const entry: ProgressPhoto = {
      id: 'photo-' + Date.now(),
      date: todayISO(),
      uri,
      angle,
    };
    setPhotos((prev) => [entry, ...prev]);
    try {
      await saveProgressPhoto(entry);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a foto agora. Tente novamente.');
      await load();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const byDate = photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    if (!acc[p.date]) acc[p.date] = [];
    acc[p.date].push(p);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const byAngle = (angle: ProgressPhoto['angle']) =>
    photos.filter((p) => p.angle === angle).sort((a, b) => a.date.localeCompare(b.date));
  const datesForAngle = (angle: ProgressPhoto['angle']) =>
    Array.from(new Set(byAngle(angle).map((p) => p.date))).sort((a, b) => a.localeCompare(b));
  const photoForDateAndAngle = (date: string, angle: ProgressPhoto['angle']) =>
    photos.find((p) => p.date === date && p.angle === angle);

  const openCompare = () => {
    setCompareDate1(null);
    setCompareDate2(null);
    setCompareModalOpen(true);
  };
  const startCompare = () => {
    if (!compareDate1 || !compareDate2 || compareDate1 === compareDate2) {
      Alert.alert('Comparar', 'Escolha duas datas diferentes com fotos no mesmo ângulo.');
      return;
    }
    const leftDate = compareDate1 < compareDate2 ? compareDate1 : compareDate2;
    const rightDate = compareDate1 < compareDate2 ? compareDate2 : compareDate1;
    const left = photoForDateAndAngle(leftDate, compareAngle ?? undefined);
    const right = photoForDateAndAngle(rightDate, compareAngle ?? undefined);
    if (!left || !right) {
      Alert.alert('Comparar', 'Fotos não encontradas para as datas escolhidas.');
      return;
    }
    setCompareModalOpen(false);
    setCompareActive({ left, right });
  };

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <AnimatedEntrance>
        <AppCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>Fotos de progresso</Text>
        <Text style={styles.heroSubtitle}>
          Capture sempre no mesmo ângulo e iluminação para comparar sua evolução com mais precisão.
        </Text>
        <Button
          title="Adicionar foto da galeria"
          onPress={() => pickImage()}
          accessibilityLabel="Adicionar foto da galeria"
        />
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={50}>
        <AppCard style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Atalho por ângulo</Text>
        <View style={styles.angleActionsRow}>
          {ANGLES.map(({ key, label }) => (
            <Button
              key={key}
              title={label}
              onPress={() => pickImage(key)}
              variant="secondary"
              style={styles.angleActionButton}
              textStyle={styles.angleActionText}
              accessibilityLabel={`Adicionar foto de ${label.toLowerCase()}`}
            />
          ))}
        </View>
        {photos.length >= 2 && (
          <Button
            title="Comparar antes/depois"
            onPress={openCompare}
            variant="ghost"
            style={styles.compareBtn}
            accessibilityLabel="Comparar fotos antes e depois"
          />
        )}
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={90}>
        <Text style={styles.sectionTitle}>Suas fotos</Text>
      </AnimatedEntrance>
      <AnimatedEntrance delay={130}>
        <AppCard style={styles.historyCard}>
        {initialLoading ? (
          <View style={styles.skeletonList}>
            <SkeletonBlock style={styles.skeletonDate} />
            <SkeletonBlock style={styles.skeletonPhoto} />
            <SkeletonBlock style={styles.skeletonDate} />
            <SkeletonBlock style={styles.skeletonPhoto} />
          </View>
        ) : photos.length === 0 ? (
          <EmptyState
            iconName="camera-outline"
            title="Nenhuma foto registrada"
            subtitle="Adicione fotos para começar a acompanhar sua evolução visual."
            actionLabel="Adicionar primeira foto"
            onAction={() => pickImage()}
          />
        ) : (
          dates.map((date, index) => (
            <AnimatedEntrance key={date} delay={Math.min(60 * index, 280)}>
              <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              {byDate[date].map((p) => (
                <View key={p.id} style={styles.photoCard}>
                  {p.angle && (
                    <Text style={styles.angleLabel}>
                      {ANGLES.find((a) => a.key === p.angle)?.label ?? p.angle}
                    </Text>
                  )}
                  <Image source={{ uri: p.uri }} style={styles.photo} resizeMode="cover" />
                </View>
              ))}
              </View>
            </AnimatedEntrance>
          ))
        )}
        </AppCard>
      </AnimatedEntrance>

      <Modal visible={compareModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comparar fotos</Text>
            <Text style={styles.modalLabel}>Ângulo</Text>
            <View style={styles.angleRow}>
              {ANGLES.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.angleChip, compareAngle === key && styles.angleChipActive]}
                  onPress={() => setCompareAngle(key)}
                >
                  <Text style={[styles.angleChipText, compareAngle === key && styles.angleChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {compareAngle && (
              <>
                <Text style={styles.modalLabel}>Data 1 (antes)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                  {datesForAngle(compareAngle).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateChip, compareDate1 === d && styles.dateChipActive]}
                      onPress={() => setCompareDate1(d)}
                    >
                      <Text style={[styles.dateChipText, compareDate1 === d && styles.dateChipTextActive]}>
                        {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.modalLabel}>Data 2 (depois)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                  {datesForAngle(compareAngle).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateChip, compareDate2 === d && styles.dateChipActive]}
                      onPress={() => setCompareDate2(d)}
                    >
                      <Text style={[styles.dateChipText, compareDate2 === d && styles.dateChipTextActive]}>
                        {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCompareModalOpen(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={startCompare}>
                <Text style={styles.modalBtnPrimaryText}>Ver comparação</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {compareActive && (
        <Modal visible={!!compareActive} animationType="slide">
          <PhotoCompare
            leftUri={compareActive.left.uri}
            rightUri={compareActive.right.uri}
            leftDate={compareActive.left.date}
            rightDate={compareActive.right.date}
            onClose={() => setCompareActive(null)}
          />
        </Modal>
      )}
    </AppScreen>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  layout: ReturnType<typeof useResponsiveLayout>
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: layout.contentPadding, paddingBottom: spacing.xxl },
    heroCard: { marginBottom: spacing.xl },
    heroTitle: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: layout.bodySize, color: colors.textMuted, lineHeight: layout.bodySize + 6, marginBottom: spacing.lg },
    actionsCard: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
    angleActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    angleActionButton: { marginBottom: spacing.sm },
    angleActionText: { fontSize: 14 },
    compareBtn: { alignSelf: 'flex-start', marginTop: spacing.sm },
    historyCard: { marginBottom: spacing.xl },
    skeletonList: { gap: spacing.md },
    skeletonDate: { height: 14, width: '38%' },
    skeletonPhoto: { height: 240, width: '100%', borderRadius: radius.md },
    dateGroup: { marginTop: spacing.lg },
    dateLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    photoCard: { marginBottom: spacing.lg },
    angleLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
    photo: { width: '100%', height: 280, borderRadius: radius.md, backgroundColor: colors.surfaceElevated },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      maxHeight: '80%',
    },
    modalTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.lg },
    modalLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.sm },
    angleRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    angleChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    angleChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    angleChipText: { fontSize: 14, color: colors.textMuted },
    angleChipTextActive: { color: colors.primary, fontWeight: '600' },
    datesScroll: { marginBottom: spacing.sm, maxHeight: 48 },
    dateChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    dateChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    dateChipText: { fontSize: 13, color: colors.textMuted },
    dateChipTextActive: { color: colors.primary, fontWeight: '600' },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, justifyContent: 'flex-end' },
    modalBtnSecondary: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    modalBtnSecondaryText: { color: colors.textMuted, fontSize: 16 },
    modalBtnPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    modalBtnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  });
}
