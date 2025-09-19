import { injectable } from 'tsyringe';
import { prisma } from '../../infra/prisma.js';
import type { IUserRepository } from '../user.repository.js';
import type { User } from '../../domain/user.js';

// Basit geçici-hata retry sarmalayıcısı (P2024/P1001 için)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function isTransient(e: any) {
  return e?.code === 'P2024' || e?.code === 'P1001';
}
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && isTransient(e)) {
      await sleep(500);
      return withRetry(fn, retries - 1);
    }
    throw e;
  }
}

@injectable()
export class PrismaUserRepository implements IUserRepository {
  async create(input: { email: string; name: string }): Promise<User> {
    const u = await withRetry(() =>
      prisma.user.create({ data: { email: input.email, name: input.name } })
    );
    return this.map(u);
  }
  async getBasicByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    const rows = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true }
    });
    return rows.map(r => ({ id: r.id, name: r.name ?? null }));
  }

  async findById(id: string): Promise<User | null> {
    const u = await withRetry(() =>
      prisma.user.findUnique({ where: { id } })
    );
    return u ? this.map(u) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await withRetry(() =>
      prisma.user.findUnique({ where: { email } })
    );
    return u ? this.map(u) : null;
  }

  async list({ skip, take }: { skip: number; take: number }): Promise<{ items: User[]; total: number }> {
    // ⚠️ PgBouncer connection_limit=1 sebebiyle paralel sorgu YAPMA
    const itemsRaw = await withRetry(() =>
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      })
    );

    const total = await withRetry(() =>
      prisma.user.count()
    );

    return { items: itemsRaw.map((r) => this.map(r)), total };
  }

  private map(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.createdAt, // Domain tipin Date ise zaten Date döner
      updatedAt: row.updatedAt,
    };
  }
}
