import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/context/AuthContext';
import { BrandingProvider } from './src/context/BrandingContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NetworkProvider, useNetwork } from './src/context/NetworkContext';
import { UnreadNotificationsProvider } from './src/context/UnreadNotificationsContext';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAutoSync } from './src/hooks/useAutoSync';

function AppContent() {
  const { isOffline } = useNetwork();
  const { isDark } = useTheme();
  const { token, tenantId } = useAuth();
  useAutoSync(token, tenantId);
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isOffline && <OfflineBanner />}
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <BrandingProvider>
            <ThemeProvider>
              <UnreadNotificationsProvider>
                <NetworkProvider>
                  <AppContent />
                </NetworkProvider>
              </UnreadNotificationsProvider>
            </ThemeProvider>
          </BrandingProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
