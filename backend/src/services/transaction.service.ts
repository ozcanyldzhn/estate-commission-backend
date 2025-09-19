import { inject, injectable } from 'tsyringe';
import type { ITransactionRepository } from '../repositories/transaction.repository.js';
import { TransactionRepositoryToken } from '../repositories/transaction.repository.js';
import type { CreateTransactionDTO, GetTransactionQuery } from '../dto/transaction.dto.js';
import { ok, err, type Result } from '../types/result.js';
import { calculateCommissionAmount, calculateCommissionRate } from './commission.rules.js';
import type { Transaction, CommissionBreakdown } from '../domain/transaction.js';
import { TransactionStage } from '../domain/transaction.js';

// User repository importları
import type { IUserRepository } from '../repositories/user.repository.js';
import { UserRepositoryToken } from '../repositories/user.repository.js';

@injectable()
export class TransactionService {
  constructor(
    @inject(TransactionRepositoryToken) private readonly repo: ITransactionRepository,
    // User repo enjeksiyonu
    @inject(UserRepositoryToken) private readonly userRepo: IUserRepository
  ) {}

  async create(dto: CreateTransactionDTO): Promise<Result<Transaction, 'VALIDATION_ERROR'>> {
    // İstemci sağladıysa onu kullan, yoksa %10 (1000 bps) varsayılanı
    const rateBps = dto.commissionRateBps ?? 1000;
    const amount = calculateCommissionAmount(dto.grossPrice, rateBps); // komisyon tutarı burda hesaplanıyor
    const created = await this.repo.create({
      userId: dto.userId,
      propertyId: dto.propertyId,
      propertyType: dto.propertyType,
      grossPrice: dto.grossPrice,
      commissionRate: rateBps,
      commissionAmount: amount,
      currency: dto.currency,
      listingAgentId: dto.listingAgentId,
      sellingAgentId: dto.sellingAgentId
    });
    // repoda işlem oluşturuldu ve ok döndürüldü
    return ok(created);
  }
  // repodan sayfalama liste ve toplam alınır.
  async list(q: GetTransactionQuery) {
    const skip = (q.page - 1) * q.pageSize;
    const { items, total } = await this.repo.list({ userId: q.userId, skip, take: q.pageSize });
    return ok({ items, total, page: q.page, pageSize: q.pageSize });
  }

  // AGREEMENT -> EARNEST_MONEY -> TITLE_DEED -> COMPLETED aşamalarına geçiş yapılır.
  async advanceStage(id: string) {
    const tx = await this.repo.findById(id);
    if (!tx) return err('NOT_FOUND', 'Transaction not found');

    const next = this.nextStage(tx.stage);
    await this.repo.updateStage(id, next);

    if (next === TransactionStage.COMPLETED) {
      // %50 agency, %50 agents (aynı ise hepsi tek ajana; farklı ise eşit)
      const total = tx.commissionAmount;
      const agency = Math.floor(total / 2);
      const agentPortion = total - agency;
      // komisyon paylaşımı hesaplanır
      const shares = this.computeAgentShares(agentPortion, tx.listingAgentId, tx.sellingAgentId);
      await this.repo.upsertShares(id, shares);

      const breakdown: CommissionBreakdown = {
        agency,
        agents: shares.map(s => ({ agentId: s.agentId, amount: s.amountMinor }))
      };
      return ok({ id, stage: next, breakdown });
    }
    return ok({ id, stage: next });
  }

  // isim ve rol ekler, pay yoksa fallback hesaplar
  async getBreakdown(id: string) {
    const tx = await this.repo.findById(id);
    if (!tx) return err('NOT_FOUND', 'Transaction not found');

    const agency = Math.floor(tx.commissionAmount / 2);

    // Önce repo'daki payları al
    let shares = await this.repo.getShares(id); // { agentId: string; amountMinor: number }[]

    // Pay yoksa transaction üzerindeki agentId’lerden hesapla (fallback)
    if (!shares || shares.length === 0) {
      const agentPortion = tx.commissionAmount - agency;
      shares = this.computeAgentShares(agentPortion, tx.listingAgentId, tx.sellingAgentId);
    }

    // Rol bağlama
    const withRole = shares.map(s => {
      let role: 'solo' | 'listing' | 'selling' | 'other' = 'other';
      if (tx.listingAgentId === tx.sellingAgentId && s.agentId === tx.listingAgentId) {
        role = 'solo';
      } else if (s.agentId === tx.listingAgentId) {
        role = 'listing';
      } else if (s.agentId === tx.sellingAgentId) {
        role = 'selling';
      }
      return { ...s, role };
    });

    // >>> USER’dan isimleri çek
    const ids = Array.from(new Set(withRole.map(a => a.agentId)));
    const basics = ids.length ? await this.userRepo.getBasicByIds(ids) : [];
    const nameMap = new Map(basics.map(b => [b.id, b.name ?? null]));

    const agents = withRole.map(a => ({
      agentId: a.agentId,
      name: nameMap.get(a.agentId) ?? null,
      role: a.role,
      amountMinor: a.amountMinor
    }));

    return ok({
      transactionId: id,
      totalCommission: tx.commissionAmount,
      agency,
      agents
    });
  }

  // iş kuralı yardımcıları
  // aşamalar
  private nextStage(current: TransactionStage): TransactionStage {
    switch (current) {
      case TransactionStage.AGREEMENT: return TransactionStage.EARNEST_MONEY;
      case TransactionStage.EARNEST_MONEY: return TransactionStage.TITLE_DEED;
      case TransactionStage.TITLE_DEED: return TransactionStage.COMPLETED;
      default: return TransactionStage.COMPLETED;
    }
  }

  private computeAgentShares(agentPortion: number, listingAgentId: string, sellingAgentId: string) {
    if (listingAgentId === sellingAgentId) {
      return [{ agentId: listingAgentId, amountMinor: agentPortion }];
    }
    const half = Math.floor(agentPortion / 2);
    const remainder = agentPortion - half * 2; // son kuruş listing'e
    return [
      { agentId: listingAgentId, amountMinor: half + remainder },
      { agentId: sellingAgentId, amountMinor: half },
    ];
    
  }
}
