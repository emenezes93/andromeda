/**
 * Armazenamento de credenciais: usa expo-secure-store para token e refresh quando disponível
 * (iOS/Android), com fallback para AsyncStorage (ex.: web ou falha).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = '@patient_app_token';
const REFRESH_KEY = '@patient_app_refresh';

export const AUTH_KEYS = {
  TOKEN: TOKEN_KEY,
  REFRESH: REFRESH_KEY,
  USER: '@patient_app_user',
  TENANT: '@patient_app_tenant',
} as const;

async function getSecure(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setSecure(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function removeSecure(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
  await AsyncStorage.removeItem(key);
}

export async function getToken(): Promise<string | null> {
  return (await getSecure(TOKEN_KEY)) ?? (await AsyncStorage.getItem(TOKEN_KEY));
}

export async function setToken(value: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, value);
  await setSecure(TOKEN_KEY, value);
}

export async function getRefreshToken(): Promise<string | null> {
  return (await getSecure(REFRESH_KEY)) ?? (await AsyncStorage.getItem(REFRESH_KEY));
}

export async function setRefreshToken(value: string): Promise<void> {
  await AsyncStorage.setItem(REFRESH_KEY, value);
  await setSecure(REFRESH_KEY, value);
}

export async function removeAuthTokens(): Promise<void> {
  await removeSecure(TOKEN_KEY);
  await removeSecure(REFRESH_KEY);
}
