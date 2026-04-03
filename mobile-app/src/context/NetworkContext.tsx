import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkContextValue = { isConnected: boolean | null; isOffline: boolean };

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: null,
  isOffline: false,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState);
    NetInfo.fetch().then(setState);
    return unsubscribe;
  }, []);

  const isConnected = state?.isConnected ?? null;
  const isOffline = isConnected === false;

  return (
    <NetworkContext.Provider value={{ isConnected, isOffline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  return useContext(NetworkContext);
}
