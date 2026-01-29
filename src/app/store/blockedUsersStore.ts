import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BlockedUsersState = {
  ownerId: string | null;
  blockedUserIds: string[];
  setOwnerId: (id: string | null) => void;
  setBlockedUserIds: (ids: string[]) => void;
  blockUserId: (id: string) => void;
  unblockUserId: (id: string) => void;
  reset: () => void;
};

export const useBlockedUsersStore = create<BlockedUsersState>()(
  persist(
    (set) => ({
      ownerId: null,
      blockedUserIds: [],
      setOwnerId: (id) => set({ ownerId: id }),
      setBlockedUserIds: (ids) => set({ blockedUserIds: ids }),
      blockUserId: (id) =>
        set((state) =>
          state.blockedUserIds.includes(id)
            ? state
            : { blockedUserIds: [...state.blockedUserIds, id] }
        ),
      unblockUserId: (id) =>
        set((state) => ({
          blockedUserIds: state.blockedUserIds.filter((blockedId) => blockedId !== id),
        })),
      reset: () => set({ ownerId: null, blockedUserIds: [] }),
    }),
    {
      name: 'blocked-users-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
