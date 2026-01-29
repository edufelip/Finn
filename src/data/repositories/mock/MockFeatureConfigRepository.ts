import type { FeatureConfigEntry, FeatureConfigValue } from '../../../domain/models/featureConfig';
import type { FeatureConfigRepository } from '../../../domain/repositories/FeatureConfigRepository';

const mockConfigs: FeatureConfigEntry[] = [];

const findIndex = (key: string) => mockConfigs.findIndex((entry) => entry.key === key);

export class MockFeatureConfigRepository implements FeatureConfigRepository {
  async getAll(): Promise<FeatureConfigEntry[]> {
    return [...mockConfigs];
  }

  async upsertConfig(
    key: string,
    value: FeatureConfigValue,
    description?: string | null
  ): Promise<FeatureConfigEntry> {
    const now = new Date().toISOString();
    const index = findIndex(key);
    if (index >= 0) {
      const existing = mockConfigs[index];
      const updated: FeatureConfigEntry = {
        ...existing,
        value,
        description: description ?? existing.description ?? null,
        updatedAt: now,
      };
      mockConfigs[index] = updated;
      return updated;
    }

    const entry: FeatureConfigEntry = {
      key,
      value,
      description: description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mockConfigs.push(entry);
    return entry;
  }

  async deleteConfig(key: string): Promise<void> {
    const index = findIndex(key);
    if (index >= 0) {
      mockConfigs.splice(index, 1);
    }
  }
}
