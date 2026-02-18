import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Network from 'expo-network';

import type { Subscription as CommunitySubscription } from '../../../domain/models/subscription';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRepositories } from '../../../app/providers/RepositoryProvider';
import { enqueueWrite } from '../../../data/offline/queueStore';
import { isMockMode } from '../../../config/appConfig';
import { communityDetailCopy } from '../../content/communityDetailCopy';
import { showGuestGateAlert } from '../../components/GuestGateAlert';
import { useLocalization } from '../../../app/providers/LocalizationProvider';

type UseCommunitySubscriptionParams = {
  communityId: number;

  communityTitle?: string;
  subscribersCount: number;
  subscription: CommunitySubscription | null;
  setSubscription: (communityId: number, subscription: CommunitySubscription | null) => void;
  setSubscribersCount: Dispatch<SetStateAction<number>>;
};

export const useCommunitySubscription = ({
  communityId,
  communityTitle,
  subscribersCount,
  subscription,
  setSubscription,
  setSubscribersCount,
}: UseCommunitySubscriptionParams) => {
  useLocalization();
  const { session, isGuest, exitGuest } = useAuth();
  const { communities: communityRepository } = useRepositories();
  const [isProcessing, setIsProcessing] = useState(false);

  const performToggleSubscription = useCallback(
    async (current: CommunitySubscription | null, nextSubscribed: boolean) => {
      if (!session?.user?.id) return;

      const currentId = current?.id ?? 0;
      const previousCount = subscribersCount;
      setSubscription(
        communityId,
        nextSubscribed
          ? {
              id: currentId,
              userId: session.user.id,
              communityId,
            }
          : null
      );
      setSubscribersCount((prev) => Math.max(0, prev + (nextSubscribed ? 1 : -1)));

      const status = isMockMode() ? { isConnected: true } : await Network.getNetworkStateAsync();
      if (!status.isConnected) {
        await enqueueWrite({
          id: `${Date.now()}`,
          type: nextSubscribed ? 'subscribe_community' : 'unsubscribe_community',
          payload: {
            id: current?.id ?? 0,
            userId: session.user.id,
            communityId,
          },
          createdAt: Date.now(),
        });
        Alert.alert(communityDetailCopy.alerts.offline.title, communityDetailCopy.alerts.offline.message);
        return;
      }

      try {
        if (nextSubscribed) {
          const created = await communityRepository.subscribe({
            id: 0,
            userId: session.user.id,
            communityId,
          });
          setSubscription(communityId, created);
        } else {
          await communityRepository.unsubscribe({
            id: current?.id ?? 0,
            userId: session.user.id,
            communityId,
          });
          setSubscription(communityId, null);
        }
      } catch (err) {
        setSubscription(communityId, current ?? null);
        setSubscribersCount(previousCount);
        if (err instanceof Error) {
          Alert.alert(communityDetailCopy.alerts.subscriptionFailed.title, err.message);
        }
      }
    },
    [
      communityId,
      communityRepository,
      setSubscribersCount,
      setSubscription,
      session?.user?.id,
      subscribersCount,
    ]
  );

  const handleToggleSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      showGuestGateAlert({ onSignIn: () => void exitGuest() });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    let didPromptUnsubscribe = false;

    try {
      const current = subscription as CommunitySubscription | null;
      const nextSubscribed = !current;

      if (!nextSubscribed) {
        didPromptUnsubscribe = true;
        Alert.alert(
          'Unsubscribe',
          `Are you sure you want to leave ${communityTitle ?? 'this community'}?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
            {
              text: 'Unsubscribe',
              style: 'destructive',
              onPress: async () => {
                await performToggleSubscription(current, nextSubscribed);
                setIsProcessing(false);
              },
            },
          ],
          {
            cancelable: true,
            onDismiss: () => setIsProcessing(false),
          }
        );
        return;
      }

      await performToggleSubscription(current, nextSubscribed);
    } finally {
      if (!didPromptUnsubscribe) {
        setIsProcessing(false);
      }
    }
  }, [
    communityTitle,
    exitGuest,
    isProcessing,
    performToggleSubscription,
    session?.user?.id,
    subscription,
  ]);

  return {
    handleToggleSubscription,
    isGuest,
  };
};
