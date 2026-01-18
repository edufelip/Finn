export const getAppMode = () => process.env.EXPO_PUBLIC_APP_MODE ?? 'prod';

export const isMockMode = () => getAppMode() === 'mock';
export const currentAppMode = getAppMode();
