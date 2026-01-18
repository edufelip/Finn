import { create } from 'zustand';
import type { User } from '../../domain/models/user';

type UserState = {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ currentUser: user, error: null }),
  updateUser: (updates) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
  })),
  clearUser: () => set({ currentUser: null, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
