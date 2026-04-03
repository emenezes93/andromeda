import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { useUnreadNotifications } from '../context/UnreadNotificationsContext';
import { getMyNotifications, markNotificationAsRead } from '../api/notifications';
import type { PatientNotification } from '../api/notifications';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function NotificationsScreen({
  navigation,
}: {
  navigation: {
    navigate: (name: string, params?: object) => void;
  };
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token, tenantId } = useAuth();
  const { unreadCount, setUnreadCount } = useUnreadNotifications();
  const [list, setList] = useState<PatientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('');
  const [error, setError] = useState(false);

  const load = async (isRefresh = false) => {
    if (!token || !tenantId) {
      setLoading(false);
      setRefreshing(false);
      setList([]);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await getMyNotifications(token, tenantId, { limit: 50 });
      setList(res.data);
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      setList([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, tenantId]);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status: s }) => setPushStatus(s));
  }, []);

  const handleMarkAsRead = async (item: PatientNotification) => {
    if (item.read || !token || !tenantId) return;
    setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    setUnreadCount(Math.max(0, unreadCount - 1));
    try {
      await markNotificationAsRead(item.id, token, tenantId);
    } catch {
      await load();
    }
  };

  const openNotification = (item: PatientNotification) => {
    const metadata =
      typeof item.metadata === 'string'
        ? (() => {
            try {
              return JSON.parse(item.metadata) as Record<string, unknown>;
            } catch {
              return null;
            }
          })()
        : item.metadata;
    const fillToken =
      item.type === 'questionnaire_session_created'
        ? (metadata?.fillToken as string | undefined)
        : undefined;
    if (!fillToken) return;
    navigation.navigate('FillQuestionnaire', { fillToken });
  };

  const requestPushPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPushStatus(status);
  };

  const pushStatusLabel =
    pushStatus === 'granted'
      ? 'Ativas'
      : pushStatus === 'denied'
        ? 'Bloqueadas'
        : 'Ainda não configuradas';

  const pushButtonLabel = pushStatus === 'granted' ? 'Revisar permissão' : 'Ativar notificações';

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <AnimatedEntrance>
        <AppCard style={styles.heroCard}>
          <Text style={styles.kicker}>NOTIFICAÇÕES</Text>
          <Text style={styles.heroTitle}>Mensagens e lembretes</Text>
          <Text style={styles.heroSubtitle}>Centralize avisos do treinador e ações importantes do dia.</Text>
        </AppCard>
      </AnimatedEntrance>
      <AnimatedEntrance delay={30}>
        <Text style={styles.sectionTitle}>Mensagens</Text>
      </AnimatedEntrance>
      {loading && list.length === 0 ? (
        <AnimatedEntrance delay={40}>
          <AppCard style={styles.skeletonCard}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <SkeletonBlock style={styles.skeletonLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
          <SkeletonBlock style={styles.skeletonDate} />
          </AppCard>
        </AnimatedEntrance>
      ) : error && list.length === 0 ? (
        <AnimatedEntrance delay={40}>
          <AppCard>
          <EmptyState
            iconName="cloud-offline"
            title="Não foi possível carregar"
            subtitle="Sua central de notificações não respondeu agora. Tente atualizar para buscar novos avisos."
            actionLabel="Tentar novamente"
            onAction={() => load(true)}
          />
          </AppCard>
        </AnimatedEntrance>
      ) : list.length === 0 ? (
        <AnimatedEntrance delay={40}>
          <AppCard>
          <EmptyState
            iconName="notifications-outline"
            title="Nenhuma notificação"
            subtitle="Quando houver novidades de treino, dieta ou questionários, você verá tudo aqui."
            actionLabel="Atualizar agora"
            onAction={() => load(true)}
          />
          </AppCard>
        </AnimatedEntrance>
      ) : (
        list.map((item, index) => (
          <AnimatedEntrance key={item.id} delay={Math.min(40 * index, 240)}>
            <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={async () => {
              await handleMarkAsRead(item);
              openNotification(item);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.body ? (
              <Text style={styles.cardBody} numberOfLines={3}>
                {item.body}
              </Text>
            ) : null}
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        ))
      )}

      <AnimatedEntrance delay={120}>
        <Text style={[styles.sectionTitle, styles.pushTitle]}>
          Notificações push
        </Text>
      </AnimatedEntrance>
      <AnimatedEntrance delay={160}>
        <AppCard style={styles.pushCard}>
        <Text style={styles.pushBody}>
          Ative para receber lembretes e avisos do seu treinador (novos treinos, dietas, parabéns por streak).
        </Text>
        <Text style={styles.pushMeta}>Permissão atual: {pushStatusLabel}</Text>
        <Button
          title={pushButtonLabel}
          onPress={requestPushPermission}
          accessibilityLabel="Solicitar permissão de notificações"
        />
        </AppCard>
      </AnimatedEntrance>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    heroCard: { marginBottom: spacing.lg },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    skeletonCard: { marginBottom: spacing.md },
    skeletonTitle: { height: 18, width: '55%', marginBottom: spacing.md },
    skeletonLine: { height: 14, width: '100%', marginBottom: spacing.sm },
    skeletonLineShort: { height: 14, width: '72%', marginBottom: spacing.sm },
    skeletonDate: { height: 12, width: '35%' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardUnread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
    cardDate: { fontSize: 12, color: colors.textSubtle },
    pushTitle: { marginTop: spacing.xl },
    pushCard: {},
    pushBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
    pushMeta: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  });
}
