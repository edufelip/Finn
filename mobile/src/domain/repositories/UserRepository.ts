import type { User } from '../models/user';

export interface UserRepository {
  getUser(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
