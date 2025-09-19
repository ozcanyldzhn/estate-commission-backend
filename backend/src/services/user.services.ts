import { inject, injectable } from 'tsyringe';
import { UserRepositoryToken, type IUserRepository } from '../repositories/user.repository.js';
import { ok, err, type Result } from '../types/result.js';
import type { CreateUserDTO } from '../dto/user.dto.js';
import type { User } from '../domain/user.js';

@injectable()
export class UserService {
  constructor(@inject(UserRepositoryToken) private readonly repo: IUserRepository) {}

  // Örnek: e-mail tekilliği kontrolü
  async create(dto: CreateUserDTO): Promise<Result<User, 'EMAIL_IN_USE'>> {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) return err('EMAIL_IN_USE', 'Email already in use');
    const u = await this.repo.create(dto);
    return ok(u);
  }

  async list(params: { page: number; pageSize: number }) {
    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, Math.min(100, params.pageSize));
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.repo.list({ skip, take: pageSize });
    return ok({ items, total, page, pageSize });
  }
}
