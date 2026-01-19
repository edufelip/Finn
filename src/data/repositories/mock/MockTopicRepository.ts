import type { Topic } from '../../../domain/models/topic';
import type { TopicRepository } from '../../../domain/repositories/TopicRepository';
import { mockTopics } from './mockData';

export class MockTopicRepository implements TopicRepository {
  async getTopics(): Promise<Topic[]> {
    return [...mockTopics];
  }

  async getTopic(id: number): Promise<Topic | null> {
    return mockTopics.find((topic) => topic.id === id) ?? null;
  }
}
