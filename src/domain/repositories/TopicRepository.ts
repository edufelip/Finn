import type { Topic } from '../models/topic';

export interface TopicRepository {
  getTopics(): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | null>;
}
