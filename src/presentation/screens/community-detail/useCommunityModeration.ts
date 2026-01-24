import { useEffect, useState } from 'react';

import type { Community } from '../../../domain/models/community';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useRepositories } from '../../../app/providers/RepositoryProvider';

type UseCommunityModerationParams = {
  communityId: number;
  community: Community | null;
};

export const useCommunityModeration = ({
  communityId,
  community,
}: UseCommunityModerationParams) => {
  const { session } = useAuth();
  const { communityModerators: moderatorRepository } = useRepositories();
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkModeration = async () => {
      if (!session?.user?.id || !community) {
        setCanModerate(false);
        return;
      }

      try {
        if (community.ownerId === session.user.id) {
          if (mounted) setCanModerate(true);
          return;
        }

        const isMod = await moderatorRepository.isModerator(communityId, session.user.id);
        if (mounted) setCanModerate(isMod);
      } catch {
        if (mounted) setCanModerate(false);
      }
    };

    checkModeration();

    return () => {
      mounted = false;
    };
  }, [communityId, community, session?.user?.id, moderatorRepository]);

  return { canModerate };
};
