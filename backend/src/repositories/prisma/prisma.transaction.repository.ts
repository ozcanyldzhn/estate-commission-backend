import { injectable } from 'tsyringe';
import { prisma } from '../../infra/prisma.js';
import type { ITransactionRepository ,AgentEarningsTx} from '../transaction.repository.js';
import type { Transaction } from '../../domain/transaction.js';

//outbound adapter
@injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  async create(input: any): Promise<Transaction> {
    const created = await prisma.transaction.create({
      data: {
        userId: input.userId,
        propertyId: input.propertyId,
        propertyType: input.propertyType as any, //enum farklılığını gevşetmek için cast türe as any ile müdahale
        grossPrice: (input.grossPrice / 100).toString(), //db de decimal/string saklandığı için minor inti string'e çeviririz
        commissionRate: (input.commissionRate / 100).toString(),
        commissionAmount: (input.commissionAmount / 100).toString(),
        currency: input.currency,
        listingAgentId: input.listingAgentId,
        sellingAgentId: input.sellingAgentId,
      }
    });
    return this.map(created); // soyutlama sağlar, hexagonal architecture için adapter görevi görür
  }
  async listCompletedByAgent(params: { agentId: string; from?: Date; to?: Date; }): Promise<AgentEarningsTx[]> {
    const { agentId, from, to } = params;

    // completedAt yoksa updatedAt/createdAt kullan
    const where: any = {
      stage: 'COMPLETED',
      OR: [{ listingAgentId: agentId }, { sellingAgentId: agentId }]
    };

    if (from || to) {
      const dateRange: any = {};
      if (from) dateRange.gte = from;
      if (to)   dateRange.lte = to;
      // Şemanıza göre "completedAt" alanı varsa onu kullanın:
      where.createdAt = dateRange;
      // Eğer yoksa, şu satırı kaldırıp updatedAt/createdAt ile değiştirin.
    }

    const rows = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        commissionAmount: true,
        listingAgentId: true,
        sellingAgentId: true
      },
      orderBy: { id: 'desc' }
    });

    return rows.map(r => ({
      id: r.id,
      commissionAmount: ('toNumber' in (r.commissionAmount as any))
        ? (r.commissionAmount as any).toNumber()
        : Number(r.commissionAmount),
      listingAgentId: r.listingAgentId,
      sellingAgentId: r.sellingAgentId
    }));
    
  }
  async list({ userId, skip, take }: { userId?: string; skip: number; take: number }) {
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.transaction.count({ where: { userId } })
    ]);
    return { items: items.map(this.map), total };
  }

  async findById(id: string) {
    const t = await prisma.transaction.findUnique({ where: { id } });
    return t ? this.map(t) : null;
  }

  async updateStage(id: string, stage: 'AGREEMENT' | 'EARNEST_MONEY' | 'TITLE_DEED' | 'COMPLETED'): Promise<void> {
    await prisma.transaction.update({ where: { id }, data: { stage } });
  }
  // var olan tüm payları silip yeniden yazıyor
  async upsertShares(transactionId: string, shares: { agentId: string; amountMinor: number }[]): Promise<void> {
    await prisma.commissionShare.deleteMany({ where: { transactionId } });
    if (shares.length === 0) return;
    await prisma.commissionShare.createMany({
      data: shares.map(s => ({
        transactionId,
        agentId: s.agentId,
        amount: (s.amountMinor / 100).toString(),
      }))
    });
  }

  async getShares(transactionId: string): Promise<{ agentId: string; amountMinor: number }[]> {
    const rows = await prisma.commissionShare.findMany({ where: { transactionId } });
    return rows.map(r => ({ agentId: r.agentId, amountMinor: Math.round(Number(r.amount) * 100) })); //stringten minor inti hesaplar
  }

  private map = (row: any): Transaction => ({ // db den gelen veriyi domain modeline çevirir
    id: row.id,
    userId: row.userId,
    propertyId: row.propertyId,
    propertyType: row.propertyType,
    grossPrice: Math.round(Number(row.grossPrice) * 100),
    commissionRate: Math.round(Number(row.commissionRate) * 100),
    commissionAmount: Math.round(Number(row.commissionAmount) * 100), //stringten minor inti hesaplar
    currency: row.currency,
    stage: row.stage,
    listingAgentId: row.listingAgentId,
    sellingAgentId: row.sellingAgentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  });
}
