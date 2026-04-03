import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, radius, typography } from '../theme';
import { ThemeContext } from '../context/ThemeContext';

interface Props {
  children: ReactNode;
  /** Custom fallback UI, or a function (error, retry) => ReactNode */
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros de render e evitar tela branca.
 * Exibe fallback com opção de tentar novamente.
 */
export class ErrorBoundary extends Component<Props, State> {
  static contextType = ThemeContext;
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, errorInfo.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const themeCtx = this.context as React.ContextType<typeof ThemeContext> | null;
    const colors = themeCtx?.colors ?? {
      background: '#0f172a',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      textSubtle: '#64748b',
      primary: '#0ea5e9',
    };
    const styles = createStyles(colors);
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? (this.props.fallback as (error: Error, retry: () => void) => ReactNode)(this.state.error, this.handleRetry)
          : this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.message}>
            O app encontrou um erro inesperado. Tente novamente ou reinicie o aplicativo.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.devError} numberOfLines={5}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function createStyles(colors: {
  background: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    title: {
      ...typography.titleSmall,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    devError: {
      fontSize: 12,
      color: colors.textSubtle,
      marginBottom: spacing.lg,
      fontFamily: 'monospace',
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
}
