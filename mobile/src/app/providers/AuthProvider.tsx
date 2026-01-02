import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { isMockMode } from '../../config/appConfig';
import { supabase } from '../../data/supabase/client';
import { processQueuedWrite } from '../../data/offline/processor';
import { syncQueuedWrites } from '../../data/offline/syncManager';
import { useRepositories } from './RepositoryProvider';

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const repositories = useRepositories();

  useEffect(() => {
    if (isMockMode()) {
      const mockSession = {
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
      } as Session;
      setSession(mockSession);
      setInitializing(false);
      return;
    }

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
