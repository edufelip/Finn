import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_write_queue';

export type QueuedWrite = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

async function loadQueue(): Promise<QueuedWrite[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedWrite[];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedWrite[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueWrite(item: QueuedWrite) {
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
  return item;
}

export async function dequeueWrite(): Promise<QueuedWrite | null> {
  const queue = await loadQueue();
  const item = queue.shift() ?? null;
  await saveQueue(queue);
  return item;
}

export async function peekQueue(): Promise<QueuedWrite[]> {
  return loadQueue();
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
