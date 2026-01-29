import { create } from 'zustand';
import type { User } from '../../domain/models/user';

type UserState = {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  banStatus: {
    isBanned: boolean;
    reason?: string | null;
    bannedAt?: string | null;
  };
  banStatusLoaded: boolean;

  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setBanStatus: (status: { isBanned: boolean; reason?: string | null; bannedAt?: string | null }) => void;
  setBanStatusLoaded: (loaded: boolean) => void;
  clearBanStatus: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  banStatus: { isBanned: false, reason: null, bannedAt: null },
  banStatusLoaded: false,

  setUser: (user) => set({ currentUser: user, error: null }),
  updateUser: (updates) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
  })),
  clearUser: () => set({
    currentUser: null,
    error: null,
    banStatus: { isBanned: false, reason: null, bannedAt: null },
    banStatusLoaded: false,
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setBanStatus: (status) => set({ banStatus: status, banStatusLoaded: true }),
  setBanStatusLoaded: (loaded) => set({ banStatusLoaded: loaded }),
  clearBanStatus: () =>
    set({ banStatus: { isBanned: false, reason: null, bannedAt: null }, banStatusLoaded: false }),
}));
