import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { runSync } from '../services/syncService';
import { getPendingSyncCount } from '../storage/syncQueue';

const THROTTLE_MS = 60_000;

export function useAutoSync(token: string | null, tenantId: string | null): void {
  const lastSyncAtRef = useRef(0);
  const previousConnectedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!token || !tenantId) return;

    const attemptSync = async () => {
      const now = Date.now();
      if (now - lastSyncAtRef.current < THROTTLE_MS) return;
      const pending = await getPendingSyncCount();
      if (pending <= 0) return;
      lastSyncAtRef.current = now;
      runSync(token, tenantId).catch(() => {});
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true;
      const previous = previousConnectedRef.current;
      previousConnectedRef.current = connected;
      if (connected && previous === false) {
        attemptSync().catch(() => {});
      }
    });

    // Primeira carga: se já estiver online e com pendências, tenta sync.
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected === true;
      previousConnectedRef.current = connected;
      if (connected) attemptSync().catch(() => {});
    });

    return unsubscribe;
  }, [token, tenantId]);
}
