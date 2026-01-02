import AsyncStorage from '@react-native-async-storage/async-storage';

import { enqueueWrite, peekQueue } from '../src/data/offline/queueStore';
import { syncQueuedWrites } from '../src/data/offline/syncManager';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

const network = jest.requireMock('expo-network');

describe('syncQueuedWrites', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    network.getNetworkStateAsync.mockReset();
  });

  it('does not process when offline', async () => {
    await enqueueWrite({ id: '1', type: 'create_post', payload: {}, createdAt: 0 });
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const processor = jest.fn();

    const result = await syncQueuedWrites(processor);

    expect(processor).not.toHaveBeenCalled();
    expect(result.synced).toBe(0);
    expect((await peekQueue()).length).toBe(1);
  });

  it('processes and drains queue when online', async () => {
    await enqueueWrite({ id: '1', type: 'create_post', payload: {}, createdAt: 0 });
    await enqueueWrite({ id: '2', type: 'create_post', payload: {}, createdAt: 1 });
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const processor = jest.fn().mockResolvedValue(undefined);

    const result = await syncQueuedWrites(processor);

    expect(processor).toHaveBeenCalledTimes(2);
    expect(result.synced).toBe(2);
    expect((await peekQueue()).length).toBe(0);
  });
});
