export type FeatureConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, unknown>
  | null;

export type FeatureConfigEntry = {
  key: string;
  value: FeatureConfigValue;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
