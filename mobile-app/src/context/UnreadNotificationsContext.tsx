import React, { createContext, useContext, useState, useCallback } from 'react';

type ContextValue = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
};

const UnreadNotificationsContext = createContext<ContextValue | null>(null);

export function UnreadNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  return (
    <UnreadNotificationsContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </UnreadNotificationsContext.Provider>
  );
}

export function useUnreadNotifications() {
  const ctx = useContext(UnreadNotificationsContext);
  if (!ctx) return { unreadCount: 0, setUnreadCount: () => {} };
  return ctx;
}
