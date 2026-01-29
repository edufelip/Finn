import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Community } from '../../domain/models/community';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useUserStore } from '../../app/store/userStore';

export interface ModerationAuthConfig {
  communityId: number;
  /**
   * Require user to be the community owner (not just a moderator).
   * Default: false (allows both owners and moderators)
   */
  requireOwner?: boolean;
  /**
   * Allow staff/admin roles to access moderation screens.
   * Default: false
   */
  allowStaff?: boolean;
  /**
   * Custom alert messages for different error scenarios
   */
  alerts?: {
    signInRequired?: { title: string; message: string };
    notFound?: { title: string; message?: string };
    notAuthorized?: { title: string; message: string };
    failed?: { title: string };
  };
}

export interface ModerationAuthResult {
  /**
   * The loaded community data
   */
  community: Community | null;
  /**
   * Whether the initial authorization check is in progress
   */
  loading: boolean;
  /**
   * Whether the current user is authorized (owner or moderator based on config)
   */
  isAuthorized: boolean;
  /**
   * Whether the current user is the community owner
   */
  isOwner: boolean;
  /**
   * Whether the current user is a moderator (but not owner)
   */
  isModerator: boolean;
  /**
   * Whether the current user is staff/admin
   */
  isStaff: boolean;
  /**
   * Reload the community data and re-check authorization
   */
  reload: () => Promise<void>;
}

/**
 * Custom hook to handle moderation authorization for community screens.
 * 
 * Automatically:
 * - Checks if user is signed in
 * - Loads community data
 * - Verifies user is owner or moderator (configurable)
 * - Shows alerts and navigates back on failure
 * - Provides reload function for refreshing data
 * 
 * @example
 * ```tsx
 * const { community, loading, isAuthorized } = useModerationAuth({
 *   communityId,
 *   requireOwner: true, // Only allow owners
 *   alerts: { 
 *     signInRequired: editCommunityCopy.alerts.signInRequired,
 *     // ... other custom alerts
 *   }
 * });
 * 
 * if (loading) return <LoadingScreen />;
 * if (!isAuthorized || !community) return null;
 * 
 * return <YourScreen community={community} />;
 * ```
 */
export function useModerationAuth(config: ModerationAuthConfig): ModerationAuthResult {
  const { communityId, requireOwner = false, allowStaff = false, alerts } = config;
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { session } = useAuth();
  const currentUserRole = useUserStore((state) => state.currentUser?.role ?? 'user');
  const isUserLoading = useUserStore((state) => state.isLoading);
  const {
    communities: communityRepository,
    communityModerators: moderatorRepository,
  } = useRepositories();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const checkAuthorization = useCallback(async () => {
    // Default alert messages
    const defaultAlerts = {
      signInRequired: {
        title: 'Sign In Required',
        message: 'You must be signed in to access this feature.',
      },
      notFound: {
        title: 'Error',
        message: 'Community not found',
      },
      notAuthorized: {
        title: 'Not Authorized',
        message: requireOwner
          ? 'Only the community owner can access this feature.'
          : 'You must be a moderator or owner to access this feature.',
      },
      failed: {
        title: 'Error',
      },
    };

    const alertMessages = {
      signInRequired: alerts?.signInRequired ?? defaultAlerts.signInRequired,
      notFound: alerts?.notFound ?? defaultAlerts.notFound,
      notAuthorized: alerts?.notAuthorized ?? defaultAlerts.notAuthorized,
      failed: alerts?.failed ?? defaultAlerts.failed,
    };

    if (!session?.user?.id) {
      Alert.alert(alertMessages.signInRequired.title, alertMessages.signInRequired.message);
      navigation.goBack();
      return;
    }

    if (allowStaff && isUserLoading) {
      setLoading(true);
      return;
    }

    setLoading(true);
    try {
      const communityData = await communityRepository.getCommunity(communityId);
      if (!communityData) {
        Alert.alert(alertMessages.notFound.title, alertMessages.notFound.message);
        navigation.goBack();
        return;
      }

      const ownerCheck = communityData.ownerId === session.user.id;
      setIsOwner(ownerCheck);

      const staffCheck = allowStaff && (currentUserRole === 'staff' || currentUserRole === 'admin');
      setIsStaff(staffCheck);

      let moderatorCheck = false;
      if (!requireOwner) {
        moderatorCheck = await moderatorRepository.isModerator(communityId, session.user.id);
        setIsModerator(moderatorCheck);
      }

      const authorized = requireOwner
        ? ownerCheck || staffCheck
        : ownerCheck || moderatorCheck || staffCheck;
      setIsAuthorized(authorized);

      if (!authorized) {
        Alert.alert(alertMessages.notAuthorized.title, alertMessages.notAuthorized.message);
        navigation.goBack();
        return;
      }

      setCommunity(communityData);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert(alertMessages.failed.title, err.message);
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [
    communityId,
    requireOwner,
    allowStaff,
    session?.user?.id,
    currentUserRole,
    isUserLoading,
    navigation,
    communityRepository,
    moderatorRepository,
    alerts,
  ]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  return {
    community,
    loading,
    isAuthorized,
    isOwner,
    isModerator,
    isStaff,
    reload: checkAuthorization,
  };
}
