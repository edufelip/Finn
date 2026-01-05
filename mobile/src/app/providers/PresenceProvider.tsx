import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { useAuth } from './AuthProvider';
import { useRepositories } from './RepositoryProvider';
import { isMockMode } from '../../config/appConfig';
import { supabase } from '../../data/supabase/client';
import { ONLINE_THRESHOLD_MS } from '../../domain/presence';

const HEARTBEAT_INTERVAL_MS = Math.floor(ONLINE_THRESHOLD_MS / 2);

type PresenceContextValue = {
  isOnline: boolean;
  isOnlineVisible: boolean;
  setOnlineVisibility: (visible: boolean) => Promise<void>;
};

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { users: userRepository } = useRepositories();
  const [isOnlineVisible, setIsOnlineVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const visibilityRef = useRef(isOnlineVisible);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    visibilityRef.current = isOnlineVisible;
  }, [isOnlineVisible]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const updateLastSeen = useCallback(
    async (userId: string) => {
      try {
        await userRepository.updateLastSeenAt(userId, new Date().toISOString());
      } catch {
        // Presence updates should not crash the UI.
      }
    },
    [userRepository]
  );

  const stopPresence = useCallback(
    async (userId: string, shouldUpdateLastSeen: boolean) => {
      stopHeartbeat();
      if (channelRef.current) {
        try {
          channelRef.current.untrack();
          channelRef.current.unsubscribe();
        } catch {
          // Ignore teardown errors.
        }
        channelRef.current = null;
      }
      setIsOnline(false);
      if (shouldUpdateLastSeen) {
        await updateLastSeen(userId);
      }
    },
    [stopHeartbeat, updateLastSeen]
  );

  const startHeartbeat = useCallback(
    (userId: string) => {
      stopHeartbeat();
      heartbeatRef.current = setInterval(() => {
        void updateLastSeen(userId);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [stopHeartbeat, updateLastSeen]
  );

  const startPresence = useCallback(
    async (userId: string) => {
      if (channelRef.current) {
        return;
      }
      const channel = supabase.channel('presence:users', {
        config: { presence: { key: userId } },
      });
      channelRef.current = channel;
      channel.subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          return;
        }
        channel.track({ online_at: new Date().toISOString() });
        setIsOnline(true);
        void updateLastSeen(userId);
        startHeartbeat(userId);
      });
    },
    [startHeartbeat, updateLastSeen]
  );

  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      const userId = session?.user?.id;
      if (!userId || isMockMode()) {
        appState.current = nextState;
        return;
      }
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (isOnlineVisible) {
          void startPresence(userId);
        } else {
          setIsOnline(false);
        }
      } else if (nextState.match(/inactive|background/)) {
        void stopPresence(userId, isOnlineVisible);
      }
      appState.current = nextState;
    },
    [isOnlineVisible, session?.user?.id, startPresence, stopPresence]
  );

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      Promise.resolve().then(() => {
        setIsOnline(false);
        setIsOnlineVisible(true);
      });
      return;
    }
    if (isMockMode()) {
      Promise.resolve().then(() => {
        setIsOnlineVisible(true);
        setIsOnline(true);
      });
      return;
    }

    let mounted = true;
    userRepository
      .getUser(userId)
      .then((profile) => {
        if (!mounted) return;
        const visible = profile?.onlineVisible ?? true;
        setIsOnlineVisible(visible);
        if (visible && appState.current === 'active') {
          void startPresence(userId);
        } else {
          setIsOnline(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsOnlineVisible(true);
      });

    return () => {
      mounted = false;
      void stopPresence(userId, visibilityRef.current);
    };
  }, [session?.user?.id, startPresence, stopPresence, userRepository]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const setOnlineVisibility = useCallback(
    async (visible: boolean) => {
      const userId = session?.user?.id;
      if (!userId) {
        return;
      }
      if (isMockMode()) {
        setIsOnlineVisible(visible);
        setIsOnline(visible);
        return;
      }
      await userRepository.setOnlineVisibility(userId, visible);
      setIsOnlineVisible(visible);
      if (visible && appState.current === 'active') {
        await startPresence(userId);
      } else {
        await stopPresence(userId, true);
      }
    },
    [session?.user?.id, startPresence, stopPresence, userRepository]
  );

  const value = useMemo(
    () => ({
      isOnline,
      isOnlineVisible,
      setOnlineVisibility,
    }),
    [isOnline, isOnlineVisible, setOnlineVisibility]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
}
