import type { FeatureConfigEntry, FeatureConfigValue } from '../../domain/models/featureConfig';
import type { FeatureConfigRepository } from '../../domain/repositories/FeatureConfigRepository';
import { supabase } from '../supabase/client';
import { TABLES } from '../supabase/tables';

type FeatureConfigRow = {
  key: string;
  value: FeatureConfigValue;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const toDomain = (row: FeatureConfigRow): FeatureConfigEntry => ({
  key: row.key,
  value: row.value,
  description: row.description ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SupabaseFeatureConfigRepository implements FeatureConfigRepository {
  async getAll(): Promise<FeatureConfigEntry[]> {
    const { data, error } = await supabase
      .from(TABLES.featureConfig)
      .select('*')
      .order('key');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toDomain(row as FeatureConfigRow));
  }

  async upsertConfig(
    key: string,
    value: FeatureConfigValue,
    description?: string | null
  ): Promise<FeatureConfigEntry> {
    const { data, error } = await supabase
      .from(TABLES.featureConfig)
      .upsert({
        key,
        value,
        description: description ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select()
      .single<FeatureConfigRow>();

    if (error) {
      throw error;
    }

    return toDomain(data);
  }

  async deleteConfig(key: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.featureConfig)
      .delete()
      .eq('key', key);

    if (error) {
      throw error;
    }
  }
}
