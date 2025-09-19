import type { User } from '../domain/user.js';

export interface IUserRepository {
  create(input: { email: string; name: string }): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(params: { skip: number; take: number }): Promise<{ items: User[]; total: number }>;
  getBasicByIds(ids: string[]): Promise<Array<{ id: string; name: string | null }>>;
}

export const UserRepositoryToken = Symbol('IUserRepository');
