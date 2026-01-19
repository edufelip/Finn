import { create } from 'zustand';
import type { Subscription } from '../../domain/models/subscription';

type CommunityState = {
  subscriptions: Record<number, Subscription | null>; // communityId -> Subscription

  setSubscription: (communityId: number, subscription: Subscription | null) => void;
  setSubscriptions: (subscriptions: Record<number, Subscription | null>) => void;
  clearSubscriptions: () => void;
};

export const useCommunityStore = create<CommunityState>((set) => ({
  subscriptions: {},

  setSubscription: (communityId, subscription) =>
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [communityId]: subscription,
      },
    })),

  setSubscriptions: (subscriptions) =>
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        ...subscriptions,
      },
    })),

  clearSubscriptions: () => set({ subscriptions: {} }),
}));
