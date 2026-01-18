import * as Network from 'expo-network';

import { dequeueWrite, peekQueue, QueuedWrite } from './queueStore';

export async function syncQueuedWrites(processor: (item: QueuedWrite) => Promise<void>) {
  const status = await Network.getNetworkStateAsync();
  if (!status.isConnected) {
    return { synced: 0, remaining: (await peekQueue()).length };
  }

  let synced = 0;
  let next = await dequeueWrite();
  while (next) {
    await processor(next);
    synced += 1;
    next = await dequeueWrite();
  }

  const remaining = (await peekQueue()).length;
  return { synced, remaining };
}
