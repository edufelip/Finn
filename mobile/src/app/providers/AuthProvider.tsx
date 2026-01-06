import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';

import { isMockMode } from '../../config/appConfig';
import { supabase } from '../../data/supabase/client';
import { processQueuedWrite } from '../../data/offline/processor';
import { syncQueuedWrites } from '../../data/offline/syncManager';
import { useRepositories } from './RepositoryProvider';
import { registerPushToken, setNotificationGatePreference } from '../notifications/pushTokens';

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
  const [initializing, setInitializing] = useState(() => !isMockMode());
  const repositories = useRepositories();

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setInitializing(false);
      })
      .catch(() => {
        if (!mounted) return;
        setInitializing(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
        await registerPushToken(repositories.users, session.user.id);
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
    }),
    [session, initializing]
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
