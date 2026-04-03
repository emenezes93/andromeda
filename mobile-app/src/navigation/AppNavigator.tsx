import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { setPushNavigationRef, setupNotificationResponseHandler } from '../services/pushService';

export const navigationRef = createNavigationContainerRef();
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useUnreadNotifications } from '../context/UnreadNotificationsContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingScreen, hasSeenOnboarding } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TrainingPlansScreen } from '../screens/TrainingPlansScreen';
import { TrainingPlanDetailScreen } from '../screens/TrainingPlanDetailScreen';
import { LogWorkoutScreen } from '../screens/LogWorkoutScreen';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { WorkoutHistoryScreen } from '../screens/WorkoutHistoryScreen';
import { QuickWorkoutsScreen } from '../screens/QuickWorkoutsScreen';
import { WeightLogScreen } from '../screens/WeightLogScreen';
import { ProgressPhotosScreen } from '../screens/ProgressPhotosScreen';
import { DietPlansScreen } from '../screens/DietPlansScreen';
import { DietPlanDetailScreen } from '../screens/DietPlanDetailScreen';
import { DailyLogScreen } from '../screens/DailyLogScreen';
import { EvolutionChartsScreen } from '../screens/EvolutionChartsScreen';
import { BodyMeasurementsScreen } from '../screens/BodyMeasurementsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ChallengesScreen } from '../screens/ChallengesScreen';
import { HealthIntegrationsScreen } from '../screens/HealthIntegrationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressHubScreen } from '../screens/ProgressHubScreen';
import { FillQuestionnaireScreen } from '../screens/FillQuestionnaireScreen';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export type TrainingStackParamList = {
  TrainingList: undefined;
  TrainingPlanDetail: { id: string };
  ActiveWorkout: { planId: string; planName?: string };
  LogWorkout: { planId: string; planName?: string };
  WorkoutHistory: undefined;
  QuickWorkouts: undefined;
};

export type DietStackParamList = {
  DietList: undefined;
  DietPlanDetail: { id: string };
  DailyLog: undefined;
};

export type ProgressStackParamList = {
  ProgressHub: undefined;
  WeightLog: undefined;
  ProgressPhotos: undefined;
  EvolutionCharts: undefined;
  BodyMeasurements: undefined;
  Notifications: undefined;
  Achievements: undefined;
  Challenges: undefined;
  HealthIntegrations: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator();
const TrainingStackNav = createNativeStackNavigator<TrainingStackParamList>();
const DietStackNav = createNativeStackNavigator<DietStackParamList>();
const Tab = createBottomTabNavigator();

function useHeaderScreenOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

function TabIcon({
  name,
  focused,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  color: string;
}) {
  return (
    <View style={{ opacity: focused ? 1 : 0.6 }}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

function TrainingStack() {
  const headerOptions = useHeaderScreenOptions();
  return (
    <TrainingStackNav.Navigator screenOptions={headerOptions}>
      <TrainingStackNav.Screen
        name="TrainingList"
        component={TrainingPlansScreen}
        options={{ title: 'Treinos encaminhados' }}
      />
      <TrainingStackNav.Screen
        name="TrainingPlanDetail"
        component={TrainingPlanDetailScreen}
        options={{ title: 'Plano de treino' }}
      />
      <TrainingStackNav.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ title: 'Treino em andamento' }}
      />
      <TrainingStackNav.Screen
        name="LogWorkout"
        component={LogWorkoutScreen}
        options={{ title: 'Registrar treino' }}
      />
      <TrainingStackNav.Screen
        name="WorkoutHistory"
        component={WorkoutHistoryScreen}
        options={{ title: 'Histórico de treinos' }}
      />
      <TrainingStackNav.Screen
        name="QuickWorkouts"
        component={QuickWorkoutsScreen}
        options={{ title: 'Treinos rápidos' }}
      />
    </TrainingStackNav.Navigator>
  );
}

function DietStack() {
  const headerOptions = useHeaderScreenOptions();
  return (
    <DietStackNav.Navigator screenOptions={headerOptions}>
      <DietStackNav.Screen
        name="DietList"
        component={DietPlansScreen}
        options={{ title: 'Dietas encaminhadas' }}
      />
      <DietStackNav.Screen
        name="DietPlanDetail"
        component={DietPlanDetailScreen}
        options={{ title: 'Plano de dieta' }}
      />
      <DietStackNav.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{ title: 'Água e refeições' }}
      />
    </DietStackNav.Navigator>
  );
}

const ProgressStackNav = createNativeStackNavigator<ProgressStackParamList>();

function ProgressStack() {
  const headerOptions = useHeaderScreenOptions();
  return (
    <ProgressStackNav.Navigator screenOptions={headerOptions}>
      <ProgressStackNav.Screen
        name="ProgressHub"
        component={ProgressHubScreen}
        options={{ title: 'Progresso', headerLargeTitle: false }}
      />
      <ProgressStackNav.Screen
        name="WeightLog"
        component={WeightLogScreen}
        options={{ title: 'Peso corporal' }}
      />
      <ProgressStackNav.Screen
        name="ProgressPhotos"
        component={ProgressPhotosScreen}
        options={{ title: 'Fotos de progresso' }}
      />
      <ProgressStackNav.Screen
        name="EvolutionCharts"
        component={EvolutionChartsScreen}
        options={{ title: 'Gráficos de evolução' }}
      />
      <ProgressStackNav.Screen
        name="BodyMeasurements"
        component={BodyMeasurementsScreen}
        options={{ title: 'Medidas corporais' }}
      />
      <ProgressStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificações' }}
      />
      <ProgressStackNav.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Conquistas' }}
      />
      <ProgressStackNav.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{ title: 'Desafios e ranking' }}
      />
      <ProgressStackNav.Screen
        name="HealthIntegrations"
        component={HealthIntegrationsScreen}
        options={{ title: 'Integrações Health' }}
      />
      <ProgressStackNav.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </ProgressStackNav.Navigator>
  );
}

const ChatStackNav = createNativeStackNavigator();

function ChatStack() {
  const headerOptions = useHeaderScreenOptions();
  return (
    <ChatStackNav.Navigator screenOptions={headerOptions}>
      <ChatStackNav.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Conversar' }}
      />
    </ChatStackNav.Navigator>
  );
}

function MainTabs() {
  const { primaryColor } = useBranding();
  const { unreadCount } = useUnreadNotifications();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const activeColor = (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) ? primaryColor : colors.primary;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: layout.tabBarHeight,
          borderRadius: 24,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000000',
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
          paddingTop: layout.tier === 'compact' ? 4 : 6,
          paddingBottom: layout.tier === 'expanded' ? 10 : 8,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primaryLight,
        tabBarLabelStyle: { fontSize: layout.captionSize, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 2, borderRadius: 14, marginHorizontal: 2 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Treinos"
        component={TrainingStack}
        options={{
          tabBarLabel: 'Treinos',
          tabBarIcon: ({ focused, color }) => <TabIcon name="barbell" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Dieta"
        component={DietStack}
        options={{
          tabBarLabel: 'Dieta',
          tabBarIcon: ({ focused, color }) => <TabIcon name="nutrition" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progresso"
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progresso',
          tabBarIcon: ({ focused, color }) => <TabIcon name="stats-chart" focused={focused} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Conversar"
        component={ChatStack}
        options={{
          tabBarLabel: 'Conversar',
          tabBarIcon: ({ focused, color }) => <TabIcon name="chatbubbles" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const loadingWrap = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

const linking = {
  prefixes: ['fitinsight://', 'https://app.fitinsight.com', 'https://fitinsight.app'],
  config: {
    screens: {
      Login: 'login',
      Register: {
        path: 'register',
        parse: {
          tenantId: (v: string) => v,
          email: (v: string) => decodeURIComponent(v),
          tenantName: (v: string) => decodeURIComponent(v),
        },
      },
      FillQuestionnaire: 'fill/:fillToken',
      Main: {
        screens: {
          Treinos: {
            screens: {
              TrainingList: 'training',
            },
          },
        },
      },
    },
  },
} as const;

export function AppNavigator() {
  const { isSignedIn, isLoading } = useAuth();
  const { colors } = useTheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    setPushNavigationRef({
      get current() {
        return navigationRef.isReady() ? { navigate: navigationRef.navigate.bind(navigationRef) } : null;
      },
    });
    const cleanup = setupNotificationResponseHandler();
    return () => {
      setPushNavigationRef(null);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setOnboardingDone(null);
      return;
    }
    let cancelled = false;
    hasSeenOnboarding().then((done) => {
      if (!cancelled) setOnboardingDone(done);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  if (isLoading) {
    return (
      <View style={[loadingWrap.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isSignedIn && onboardingDone === null) {
    return (
      <View style={[loadingWrap.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isSignedIn && onboardingDone === false) {
    return (
      <NavigationContainer ref={navigationRef} linking={linking as never}>
        <OnboardingScreen onFinish={() => setOnboardingDone(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking as never}>
      {isSignedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="FillQuestionnaire" component={FillQuestionnaireScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="FillQuestionnaire" component={FillQuestionnaireScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
