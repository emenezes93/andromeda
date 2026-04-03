import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUnreadNotifications } from '../context/UnreadNotificationsContext';
import { useHomeData } from '../hooks/useHomeData';
import { useNetwork } from '../context/NetworkContext';
import { getWeeklyReportData, scheduleWeeklyReportNotification } from '../services/weeklyReport';
import type { WeeklyReportData } from '../services/weeklyReport';
import { getAdaptiveRecommendation, type AdaptiveRecommendation } from '../services/adaptiveCoach';
import { getCheckInForDate, saveDailyCheckIn, todayISODate } from '../storage/dailyCheckins';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { WeeklyReportCard } from '../components/WeeklyReportCard';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export function HomeScreen() {
  const navigation = useNavigation();
  const { user, token, tenantId, logout } = useAuth();
  const { isConnected } = useNetwork();
  const { setUnreadCount } = useUnreadNotifications();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const {
    me,
    loading,
    refreshing,
    load,
    waterMl,
    waterGoal,
    todayKcal,
    lastWeight,
    globalStreak,
    syncPendingCount,
    hasTrainingPlans,
  } = useHomeData(token, tenantId, setUnreadCount);
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);
  const [weeklyReportData, setWeeklyReportData] = useState<WeeklyReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [hasCheckInToday, setHasCheckInToday] = useState(false);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [soreness, setSoreness] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [motivation, setMotivation] = useState<1 | 2 | 3 | 4 | 5>(3);

  useEffect(() => {
    scheduleWeeklyReportNotification().catch(() => {});
  }, []);

  useEffect(() => {
    getAdaptiveRecommendation().then(setAdaptiveRecommendation).catch(() => setAdaptiveRecommendation(null));
    getCheckInForDate(todayISODate())
      .then((item) => {
        if (!item) {
          setHasCheckInToday(false);
          return;
        }
        setHasCheckInToday(true);
        setEnergy(item.energy);
        setSoreness(item.soreness);
        setMotivation(item.motivation);
      })
      .catch(() => setHasCheckInToday(false));
  }, []);

  const openWeeklyReport = async () => {
    setWeeklyReportOpen(true);
    setLoadingReport(true);
    try {
      const data = await getWeeklyReportData();
      setWeeklyReportData(data);
    } finally {
      setLoadingReport(false);
    }
  };

  const nav = navigation as { navigate: (a: string, b?: { screen: string }) => void };
  const displayName = me?.patient?.fullName || user?.email?.split('@')[0] || 'Aluno';
  const hour = new Date().getHours();
  const contextLabel = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';
  const hydrationRatio = waterGoal > 0 ? Math.min(waterMl / waterGoal, 1) : 0;
  const checkInPending = !hasCheckInToday;
  const primaryAction = hasTrainingPlans
    ? {
        title: 'Treino do dia pronto',
        body: 'Abra seu plano, registre a sessao e mantenha sua consistencia sem perder o ritmo.',
        cta: 'Abrir treino de hoje',
        onPress: () => nav.navigate('Treinos'),
        helper: `${globalStreak} ${globalStreak === 1 ? 'dia seguido' : 'dias seguidos'} de constancia`,
      }
    : {
        title: 'Seu dia ainda nao comecou',
        body: 'Comece pelo diario para registrar agua e refeicoes enquanto seu profissional organiza os proximos planos.',
        cta: 'Abrir diario de hoje',
        onPress: () => nav.navigate('Dieta', { screen: 'DailyLog' }),
        helper: 'Registrar cedo aumenta a chance de retorno no mesmo dia',
      };
  const todayFocus = checkInPending
    ? {
        title: 'Fazer check-in diario',
        body: 'Leva 30 segundos e melhora a recomendacao do coach adaptativo.',
        cta: 'Responder agora',
        onPress: () => setCheckInOpen(true),
      }
    : hydrationRatio < 0.6
      ? {
          title: 'Completar sua hidratacao',
          body: `Voce registrou ${waterMl} ml de ${waterGoal} ml da meta de hoje.`,
          cta: 'Registrar agua',
          onPress: () => nav.navigate('Dieta', { screen: 'DailyLog' }),
        }
      : {
          title: 'Atualizar seu progresso',
          body: 'Revise peso, fotos ou medidas para manter o acompanhamento completo.',
          cta: 'Abrir progresso',
          onPress: () => nav.navigate('Progresso'),
        };

  const saveCheckIn = async () => {
    setSavingCheckIn(true);
    try {
      await saveDailyCheckIn({
        id: `checkin-${Date.now()}`,
        date: todayISODate(),
        energy,
        soreness,
        motivation,
      });
      setHasCheckInToday(true);
      setCheckInOpen(false);
      const rec = await getAdaptiveRecommendation();
      setAdaptiveRecommendation(rec);
    } finally {
      setSavingCheckIn(false);
    }
  };

  const applyAdaptiveCta = () => {
    if (!adaptiveRecommendation) return;
    if (adaptiveRecommendation.focus === 'nutrition') {
      nav.navigate('Dieta', { screen: 'DailyLog' });
      return;
    }
    if (adaptiveRecommendation.cta.toLowerCase().includes('rapido')) {
      nav.navigate('Treinos', { screen: 'QuickWorkouts' });
      return;
    }
    nav.navigate('Treinos');
  };

  const quickActions = [
    { key: 'daily', label: 'Registrar agua e refeicoes', icon: 'water-outline' as const, onPress: () => nav.navigate('Dieta', { screen: 'DailyLog' }) },
    { key: 'training', label: 'Abrir treinos do aluno', icon: 'barbell-outline' as const, onPress: () => nav.navigate('Treinos') },
    { key: 'progress', label: 'Atualizar peso e medidas', icon: 'analytics-outline' as const, onPress: () => nav.navigate('Progresso', { screen: 'WeightLog' }) },
    { key: 'challenges', label: 'Ver desafio da semana', icon: 'trophy-outline' as const, onPress: () => nav.navigate('Progresso', { screen: 'Challenges' }) },
  ];

  const loadingSkeleton = (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SkeletonBlock style={styles.skeletonTitle} />
      <SkeletonBlock style={styles.skeletonSubtitle} />
      <AppCard style={styles.heroCard}>
        <SkeletonBlock style={styles.skeletonLine} />
        <SkeletonBlock style={styles.skeletonLineShort} />
        <SkeletonBlock style={styles.skeletonButton} />
      </AppCard>
      <View style={styles.metricRow}>
        <AppCard style={styles.metricCard}><SkeletonBlock style={styles.skeletonMetric} /></AppCard>
        <AppCard style={styles.metricCard}><SkeletonBlock style={styles.skeletonMetric} /></AppCard>
        <AppCard style={styles.metricCard}><SkeletonBlock style={styles.skeletonMetric} /></AppCard>
      </View>
    </ScrollView>
  );

  if (loading && !me) {
    return <SafeAreaView style={styles.safe}>{loadingSkeleton}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>PAINEL DO ALUNO</Text>
          <Text style={styles.greeting}>Olá, {displayName}</Text>
          <Text style={styles.subtitle}>Seu plano do dia para esta {contextLabel}</Text>
          <View style={styles.syncRow}>
            <Ionicons name="cloud-outline" size={16} color={colors.textMuted} />
            <Text style={styles.syncText}>
              {syncPendingCount > 0 && isConnected
                ? `Sincronizando ${syncPendingCount} ${syncPendingCount === 1 ? 'item' : 'itens'}...`
                : syncPendingCount > 0
                  ? `${syncPendingCount} itens pendentes — serão enviados quando houver conexão`
                  : 'Tudo sincronizado'}
            </Text>
            {syncPendingCount > 0 && isConnected ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
          </View>
        </View>

        <AppCard style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>PRIORIDADE DE HOJE</Text>
          <Text style={styles.heroTitle}>{primaryAction.title}</Text>
          <Text style={styles.heroSubtitle}>{primaryAction.body}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatChip}>
              <Text style={styles.heroStatValue}>{globalStreak}</Text>
              <Text style={styles.heroStatLabel}>dias seguidos</Text>
            </View>
            <View style={styles.heroStatChip}>
              <Text style={styles.heroStatValue}>{waterMl}</Text>
              <Text style={styles.heroStatLabel}>ml de agua hoje</Text>
            </View>
          </View>
          <Text style={styles.heroHelper}>{primaryAction.helper}</Text>
          <Button title={primaryAction.cta} onPress={primaryAction.onPress} />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Proximo passo recomendado</Text>
          <Text style={styles.adaptiveTitle}>{todayFocus.title}</Text>
          <Text style={styles.adaptiveBody}>{todayFocus.body}</Text>
          <View style={styles.adaptiveActions}>
            <Button title={todayFocus.cta} onPress={todayFocus.onPress} variant="secondary" />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Coach adaptativo</Text>
          <Text style={styles.adaptiveTitle}>{adaptiveRecommendation?.title ?? 'Carregando recomendação...'}</Text>
          <Text style={styles.adaptiveBody}>
            {adaptiveRecommendation?.message ?? 'Analisando seus dados recentes para sugerir o melhor foco do dia.'}
          </Text>
          <View style={styles.adaptiveActions}>
            <Button
              title={adaptiveRecommendation?.cta ?? 'Abrir rotina'}
              onPress={applyAdaptiveCta}
            />
            <TouchableOpacity
              style={styles.adaptiveSecondary}
              onPress={() => setCheckInOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.adaptiveSecondaryText}>
                {hasCheckInToday ? 'Editar check-in de hoje' : 'Fazer check-in diário'}
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        <View style={styles.metricRow}>
          <AppCard style={styles.metricCard}>
            <Text style={styles.metricValue}>{waterMl}</Text>
            <Text style={styles.metricLabel}>Água ({waterGoal} ml)</Text>
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Text style={styles.metricValue}>{todayKcal}</Text>
            <Text style={styles.metricLabel}>kcal hoje</Text>
          </AppCard>
          <AppCard style={styles.metricCard}>
            <Text style={styles.metricValue}>{globalStreak}</Text>
            <Text style={styles.metricLabel}>streak</Text>
          </AppCard>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickTile}
              onPress={action.onPress}
              activeOpacity={0.86}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name={action.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
            </TouchableOpacity>
          ))}
        </View>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Seu progresso</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryValue}>{me?.sessionsCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Sessões</Text>
            </View>
            <View>
              <Text style={styles.summaryValue}>{me?.evolutionsCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Evoluções</Text>
            </View>
            <View>
              <Text style={styles.summaryValue}>{lastWeight ? `${lastWeight.kg}` : '—'}</Text>
              <Text style={styles.summaryLabel}>Peso</Text>
            </View>
          </View>
        </AppCard>

        <TouchableOpacity style={styles.reportCard} onPress={openWeeklyReport} activeOpacity={0.86}>
          <Text style={styles.reportTitle}>Resumo da semana</Text>
          <Text style={styles.reportSub}>Treinos, água, peso e evolução consolidada.</Text>
        </TouchableOpacity>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.profileLink}
            onPress={() => nav.navigate('Progresso', { screen: 'HealthIntegrations' })}
            activeOpacity={0.7}
          >
            <Text style={styles.profileLinkText}>Integrações Health</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileLink}
            onPress={() => nav.navigate('Progresso', { screen: 'Profile' })}
            activeOpacity={0.7}
          >
            <Text style={styles.profileLinkText}>Perfil e preferências</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => logout()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottom} />
      </ScrollView>

      <Modal visible={weeklyReportOpen} animationType="slide">
        <SafeAreaView style={styles.safe} edges={['top']}>
          {loadingReport ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : weeklyReportData ? (
            <WeeklyReportCard
              data={weeklyReportData}
              onClose={() => {
                setWeeklyReportOpen(false);
                setWeeklyReportData(null);
              }}
            />
          ) : (
            <View style={styles.centered}>
              <Text style={styles.subtitle}>Não foi possível carregar o resumo.</Text>
              <TouchableOpacity style={styles.profileLink} onPress={() => setWeeklyReportOpen(false)}>
                <Text style={styles.profileLinkText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={checkInOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.checkinModal}>
            <Text style={styles.modalTitle}>Check-in diário</Text>
            <Text style={styles.modalHint}>Leva 30 segundos e melhora a recomendação do seu dia.</Text>

            <Text style={styles.checkLabel}>Energia</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={`energy-${n}`}
                  style={[styles.scaleButton, energy === n && styles.scaleButtonActive]}
                  onPress={() => setEnergy(n as 1 | 2 | 3 | 4 | 5)}
                >
                  <Text style={[styles.scaleText, energy === n && styles.scaleTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.checkLabel}>Dor muscular</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={`soreness-${n}`}
                  style={[styles.scaleButton, soreness === n && styles.scaleButtonActive]}
                  onPress={() => setSoreness(n as 1 | 2 | 3 | 4 | 5)}
                >
                  <Text style={[styles.scaleText, soreness === n && styles.scaleTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.checkLabel}>Motivação</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={`motivation-${n}`}
                  style={[styles.scaleButton, motivation === n && styles.scaleButtonActive]}
                  onPress={() => setMotivation(n as 1 | 2 | 3 | 4 | 5)}
                >
                  <Text style={[styles.scaleText, motivation === n && styles.scaleTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCheckInOpen(false)} disabled={savingCheckIn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCheckIn} disabled={savingCheckIn}>
                <Text style={styles.saveBtnText}>{savingCheckIn ? 'Salvando...' : 'Salvar check-in'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  layout: ReturnType<typeof useResponsiveLayout>
) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { padding: layout.contentPadding, paddingTop: spacing.lg, paddingBottom: spacing.listBottom + 56 },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: { marginBottom: spacing.lg },
    kicker: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    greeting: { ...typography.titleSmall, fontSize: layout.heroTitleSize, lineHeight: layout.heroTitleSize + 6, color: colors.text },
    subtitle: { ...typography.bodySmall, fontSize: layout.bodySize, color: colors.textMuted, marginTop: 2 },
    syncRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    syncText: { fontSize: 12, color: colors.textMuted },
    heroCard: { marginBottom: spacing.lg },
    sectionEyebrow: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    heroTitle: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: layout.bodySize, color: colors.textMuted, lineHeight: layout.bodySize + 6, marginBottom: spacing.lg },
    heroHelper: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
    heroStatsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    heroStatChip: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    heroStatValue: { fontSize: 18, fontWeight: '700', color: colors.text },
    heroStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    metricRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: layout.sectionGap },
    metricCard: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
    metricValue: { fontSize: 22, fontWeight: '700', color: colors.text },
    metricLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
    sectionCard: { marginBottom: layout.sectionGap, paddingVertical: spacing.sm },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: layout.sectionGap,
    },
    quickTile: {
      width: '48%',
      minHeight: 92,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      justifyContent: 'space-between',
    },
    quickIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLabel: { fontSize: 13, color: colors.text, lineHeight: 18, marginTop: spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
    summaryLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
    reportCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: layout.cardPadding,
      marginBottom: layout.sectionGap,
    },
    reportTitle: { fontSize: layout.titleSize - 1, fontWeight: '700', color: colors.text },
    reportSub: { fontSize: layout.captionSize, color: colors.textMuted, marginTop: spacing.xs },
    adaptiveTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    adaptiveBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    adaptiveActions: { marginTop: spacing.md, gap: spacing.sm },
    adaptiveSecondary: {
      minHeight: touchTargetMin,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    adaptiveSecondaryText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    footerActions: { alignItems: 'flex-start', gap: spacing.md },
    profileLink: { paddingVertical: spacing.xs },
    profileLinkText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    logoutButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      minHeight: touchTargetMin,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
    },
    logoutText: { fontSize: 14, color: colors.textMuted },
    bottom: { height: spacing.xl },
    skeletonTitle: { width: '52%', height: 26, marginBottom: spacing.sm },
    skeletonSubtitle: { width: '36%', height: 14, marginBottom: spacing.lg },
    skeletonLine: { width: '90%', height: 16, marginBottom: spacing.sm },
    skeletonLineShort: { width: '66%', height: 16, marginBottom: spacing.lg },
    skeletonButton: { width: '100%', height: 48 },
    skeletonMetric: { width: '70%', height: 20 },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: spacing.lg,
    },
    checkinModal: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    modalHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
    modalTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    checkLabel: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs, fontWeight: '600' },
    scaleRow: { flexDirection: 'row', gap: spacing.sm },
    scaleButton: {
      flex: 1,
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scaleButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    scaleText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
    scaleTextActive: { color: colors.primary },
    modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    cancelBtn: {
      flex: 1,
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    cancelBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    saveBtn: {
      flex: 1,
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  });
}
