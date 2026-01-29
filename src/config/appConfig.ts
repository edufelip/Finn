export const getAppMode = () => process.env.EXPO_PUBLIC_APP_MODE ?? 'prod';

export const isMockMode = () => getAppMode() === 'mock';
export const currentAppMode = getAppMode();

export const TERMS_VERSION = '2026-01-28';
