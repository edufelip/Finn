import type { CommunityModerator } from '../../domain/models/communityModerator';
import type { CommunityModeratorRepository } from '../../domain/repositories/CommunityModeratorRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type CommunityModeratorRow = {
  id: number;
  community_id: number;
  user_id: string;
  assigned_by: string;
  created_at: string;
};

function toDomain(row: CommunityModeratorRow, profileName?: string, profilePhotoUrl?: string | null): CommunityModerator {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    userName: profileName,
    userPhotoUrl: profilePhotoUrl,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
  };
}

export class SupabaseCommunityModeratorRepository implements CommunityModeratorRepository {
  async getModerators(communityId: number): Promise<CommunityModerator[]> {
    const { data, error } = await supabase
      .from(TABLES.communityModerators)
      .select(`
        *,
        profiles:user_id (
          name,
          photo_url
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row) => {
      const profile = (row as any).profiles;
      return toDomain(row, profile?.name, profile?.photo_url);
    });
  }

  async addModerator(communityId: number, userId: string, assignedBy: string): Promise<CommunityModerator> {
    const { data, error } = await supabase
      .from(TABLES.communityModerators)
      .insert({
        community_id: communityId,
        user_id: userId,
        assigned_by: assignedBy,
      })
      .select(`
        *,
        profiles:user_id (
          name,
          photo_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to add moderator');
    }

    const profile = (data as any).profiles;
    return toDomain(data, profile?.name, profile?.photo_url);
  }

  async removeModerator(communityId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.communityModerators)
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  async isModerator(communityId: number, userId: string): Promise<boolean> {
    // Check if user is moderator
    const { data: modData, error: modError } = await supabase
      .from(TABLES.communityModerators)
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (modError) {
      throw modError;
    }

    if (modData) {
      return true;
    }

    // Check if user is community owner
    const { data: communityData, error: communityError } = await supabase
      .from(TABLES.communities)
      .select('owner_id')
      .eq('id', communityId)
      .single();

    if (communityError) {
      throw communityError;
    }

    return communityData?.owner_id === userId;
  }
}
