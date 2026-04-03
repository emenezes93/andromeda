import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { setApiRefreshCallback, getBaseUrl } from '../api/client';
import { getToken, setToken, getRefreshToken, setRefreshToken, removeAuthTokens, AUTH_KEYS } from '../storage/authStorage';
import type { PatientUser } from '../types';

const USER_KEY = AUTH_KEYS.USER;
const TENANT_KEY = AUTH_KEYS.TENANT;

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: PatientUser | null;
  tenantId: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, tenantId: string) => Promise<void>;
  register: (tenantId: string, fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    user: null,
    tenantId: null,
    isLoading: true,
    isSignedIn: false,
  });

  const loadStored = useCallback(async () => {
    try {
      const [token, refresh, userJson, tenantId] = await Promise.all([
        getToken(),
        getRefreshToken(),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(TENANT_KEY),
      ]);
      const user = userJson ? (JSON.parse(userJson) as PatientUser) : null;
      setState({
        token,
        refreshToken: refresh,
        user,
        tenantId,
        isLoading: false,
        isSignedIn: !!(token && user && tenantId),
      });
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(
    async (email: string, password: string, tenantId: string) => {
      const res = await apiLogin(email, password, tenantId);
      await Promise.all([
        setToken(res.token),
        setRefreshToken(res.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)),
        AsyncStorage.setItem(TENANT_KEY, res.user.tenantId),
      ]);
      setState({
        token: res.token,
        refreshToken: res.refreshToken,
        user: res.user,
        tenantId: res.user.tenantId,
        isLoading: false,
        isSignedIn: true,
      });
    },
    []
  );

  const register = useCallback(
    async (tenantId: string, fullName: string, email: string, password: string) => {
      const res = await apiRegister(tenantId, fullName, email, password);
      await Promise.all([
        setToken(res.token),
        setRefreshToken(res.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user)),
        AsyncStorage.setItem(TENANT_KEY, res.user.tenantId),
      ]);
      setState({
        token: res.token,
        refreshToken: res.refreshToken,
        user: res.user,
        tenantId: res.user.tenantId,
        isLoading: false,
        isSignedIn: true,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await Promise.all([
      removeAuthTokens(),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(TENANT_KEY),
    ]);
    setState({
      token: null,
      refreshToken: null,
      user: null,
      tenantId: null,
      isLoading: false,
      isSignedIn: false,
    });
  }, []);

  const refreshAuthAsync = useCallback(async (): Promise<string | null> => {
    try {
      const refresh = await getRefreshToken();
      if (!refresh) return null;
      const url = `${getBaseUrl()}/v1/auth/refresh`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        await logout();
        return null;
      }
      const data = (await res.json()) as { token: string; refreshToken: string };
      await setToken(data.token);
      await setRefreshToken(data.refreshToken);
      setState((s) => ({
        ...s,
        token: data.token,
        refreshToken: data.refreshToken,
      }));
      return data.token;
    } catch {
      await logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    setApiRefreshCallback(refreshAuthAsync);
    return () => setApiRefreshCallback(null);
  }, [refreshAuthAsync]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
