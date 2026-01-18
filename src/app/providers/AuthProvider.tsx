import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isMockMode } from '../../config/appConfig';
import env from '../../config/env';
import { supabase } from '../../data/supabase/client';
import { processQueuedWrite } from '../../data/offline/processor';
import { syncQueuedWrites } from '../../data/offline/syncManager';
import { useRepositories } from './RepositoryProvider';
import { registerPushToken, setNotificationGatePreference } from '../notifications/pushTokens';
import { useUserStore } from '../store/userStore';

const resolveProfileName = (session: Session): string => {
  const metadata = session.user.user_metadata as { name?: string } | null | undefined;
  const metadataName = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  if (metadataName) {
    return metadataName;
  }
  const email = session.user.email ?? '';
  const emailName = email.split('@')[0]?.trim() ?? '';
  return emailName || session.user.id.slice(0, 8);
};

const resolveProfilePhotoUrl = (session: Session): string | null => {
  const metadata = session.user.user_metadata as { avatar_url?: string; picture?: string } | null | undefined;
  if (typeof metadata?.avatar_url === 'string' && metadata.avatar_url.trim()) {
    return metadata.avatar_url.trim();
  }
  if (typeof metadata?.picture === 'string' && metadata.picture.trim()) {
    return metadata.picture.trim();
  }
  return null;
};

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  isGuest: boolean;
  enterGuest: () => Promise<void>;
  exitGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const GUEST_MODE_KEY = 'auth_guest_mode';

const createMockSession = (): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'mock-user',
    email: 'mock@finn.app',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: 'Mock User' },
    created_at: new Date().toISOString(),
    identities: [],
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    isMockMode() ? createMockSession() : null
  );
  const [isGuest, setIsGuest] = useState(false);
  const [initializing, setInitializing] = useState(() => !isMockMode());
  const repositories = useRepositories();

  useEffect(() => {
    let mounted = true;
    const loadAuthState = async () => {
      if (isMockMode()) {
        if (!mounted) return;
        setSession(createMockSession());
        setIsGuest(false);
        setInitializing(false);
        return;
      }
      try {
        const [sessionResult, guestFlag] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(GUEST_MODE_KEY),
        ]);
        if (!mounted) return;
        const nextSession = sessionResult.data.session ?? null;
        setSession(nextSession);
        setIsGuest(Boolean(guestFlag === 'true' && !nextSession));
      } catch {
        if (!mounted) return;
        setSession(null);
        setIsGuest(false);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    loadAuthState();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsGuest(false);
        AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
      } else {
        useUserStore.getState().clearUser();
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    syncQueuedWrites((item) =>
      processQueuedWrite(item, {
        posts: repositories.posts,
        comments: repositories.comments,
        communities: repositories.communities,
      })
    ).catch(() => {
      // Retry will happen on next app start or auth change.
    });
  }, [session, repositories]);

  useEffect(() => {
    if (!session || isMockMode()) return;
    let active = true;
    repositories.users
      .getUser(session.user.id)
      .then((profile) => {
        if (!active) return;
        setNotificationGatePreference(profile?.notificationsEnabled ?? true);
      })
      .catch(() => {
        if (!active) return;
        setNotificationGatePreference(true);
      });

    return () => {
      active = false;
    };
  }, [session, repositories.users]);

  // Load (or create) user profile into Zustand store
  useEffect(() => {
    if (!session?.user?.id || isMockMode()) return;

    let active = true;
    const loadUser = async () => {
      try {
        useUserStore.getState().setLoading(true);
        const profile = await repositories.users.getUser(session.user.id);
        if (active && profile) {
          useUserStore.getState().setUser(profile);
          return;
        }
        const created = await repositories.users.createUser({
          id: session.user.id,
          name: resolveProfileName(session),
          photoUrl: resolveProfilePhotoUrl(session),
        });
        if (active) {
          useUserStore.getState().setUser(created);
        }
      } catch (error) {
        if (active) {
          useUserStore.getState().setError(
            error instanceof Error ? error.message : 'Failed to load user'
          );
        }
      } finally {
        if (active) {
          useUserStore.getState().setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [session?.user?.id, repositories.users]);

  useEffect(() => {
    if (!session || isMockMode()) return;
    let active = true;
    Notifications.getPermissionsAsync()
      .then((status) => {
        if (!active) return;
        if (status.status === 'granted') {
          return;
        }
        if (status.canAskAgain) {
          return Notifications.requestPermissionsAsync();
        }
      })
      .catch(() => {
        // Ignore permission errors for now.
      });

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session || isMockMode()) return;
    const registerToken = async () => {
      try {
        await registerPushToken(repositories.users, session.user.id, env.appEnv);
      } catch {
        // Ignore registration failures for now.
      }
    };

    registerToken();
  }, [session, repositories.users]);

  const value = useMemo(
    () => ({
      session,
      initializing,
      isGuest,
      enterGuest: async () => {
        if (session) {
          return;
        }
        setIsGuest(true);
        try {
          await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
        } catch {
          // Ignore storage failures.
        }
      },
      exitGuest: async () => {
        setIsGuest(false);
        try {
          await AsyncStorage.removeItem(GUEST_MODE_KEY);
        } catch {
          // Ignore storage failures.
        }
      },
    }),
    [session, initializing, isGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
