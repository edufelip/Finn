import { useEffect, useMemo } from 'react';

import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useUserStore } from '../../app/store/userStore';

type HeaderProfile = {
  profilePhoto: string | null;
  displayInitial: string;
};

export const useHeaderProfile = (): HeaderProfile => {
  const { session, isGuest } = useAuth();
  const { users: userRepository } = useRepositories();
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    if (!session?.user?.id || currentUser) return;
    let active = true;
    userRepository
      .getUser(session.user.id)
      .then((data) => {
        if (active && data) {
          useUserStore.getState().setUser(data);
        }
      })
      .catch(() => {
        // Ignore fetch errors; fallback UI remains.
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id, userRepository, currentUser]);

  const displayName = useMemo(() => {
    if (isGuest) {
      return 'Guest';
    }
    return currentUser?.name ?? session?.user?.email ?? 'User';
  }, [currentUser?.name, isGuest, session?.user?.email]);

  const displayInitial = useMemo(() => {
    return displayName.trim().charAt(0).toUpperCase() || 'U';
  }, [displayName]);

  return {
    profilePhoto: currentUser?.photoUrl ?? null,
    displayInitial,
  };
};
