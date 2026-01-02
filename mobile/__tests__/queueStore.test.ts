import AsyncStorage from '@react-native-async-storage/async-storage';

import { enqueueWrite, dequeueWrite, peekQueue, clearQueue } from '../src/data/offline/queueStore';

describe('queueStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('enqueues and dequeues items', async () => {
    await enqueueWrite({ id: '1', type: 'create_post', payload: {}, createdAt: 0 });
    await enqueueWrite({ id: '2', type: 'create_post', payload: {}, createdAt: 1 });

    const queue = await peekQueue();
    expect(queue).toHaveLength(2);

    const first = await dequeueWrite();
    expect(first?.id).toBe('1');

    const second = await dequeueWrite();
    expect(second?.id).toBe('2');

    const empty = await dequeueWrite();
    expect(empty).toBeNull();
  });

  it('clears queue', async () => {
    await enqueueWrite({ id: '1', type: 'create_post', payload: {}, createdAt: 0 });
    await clearQueue();
    const queue = await peekQueue();
    expect(queue).toHaveLength(0);
  });
});
