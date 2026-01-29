import type { FeatureConfigEntry, FeatureConfigValue } from '../models/featureConfig';

export interface FeatureConfigRepository {
  getAll(): Promise<FeatureConfigEntry[]>;
  upsertConfig(
    key: string,
    value: FeatureConfigValue,
    description?: string | null
  ): Promise<FeatureConfigEntry>;
  deleteConfig(key: string): Promise<void>;
}
