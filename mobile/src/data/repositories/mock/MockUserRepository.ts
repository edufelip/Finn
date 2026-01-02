import type { User } from '../../../domain/models/user';
import type { UserRepository } from '../../../domain/repositories/UserRepository';

const mockUser: User = {
  id: 'mock-user',
  name: 'Mock User',
  photoUrl: null,
};

export class MockUserRepository implements UserRepository {
  async getUser(_id: string): Promise<User | null> {
    return mockUser;
  }

  async createUser(user: User): Promise<User> {
    return user;
  }

  async deleteUser(_id: string): Promise<void> {
    return;
  }
}
