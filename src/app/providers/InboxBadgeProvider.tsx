import React, { createContext, useContext, useState } from 'react';

type InboxBadgeContextValue = {
  hasUnread: boolean;
  setHasUnread: (hasUnread: boolean) => void;
};

const InboxBadgeContext = createContext<InboxBadgeContextValue | undefined>(undefined);

export function InboxBadgeProvider({ children }: { children: React.ReactNode }) {
  const [hasUnread, setHasUnread] = useState(false);

  return (
    <InboxBadgeContext.Provider value={{ hasUnread, setHasUnread }}>
      {children}
    </InboxBadgeContext.Provider>
  );
}

export function useInboxBadge() {
  const context = useContext(InboxBadgeContext);
  if (!context) {
    throw new Error('useInboxBadge must be used within InboxBadgeProvider');
  }
  return context;
}
