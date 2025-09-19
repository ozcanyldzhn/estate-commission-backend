import type { Transaction, PropertyType } from '../domain/transaction.js';

// ajanın kazancını hesaplarken kullanılan alanlar
export type AgentEarningsTx = {
  id: string;
  commissionAmount: number;       // minor unit (kuruş)
  listingAgentId: string;
  sellingAgentId: string;
  completedAt?: Date | null;
};

// port/adapter
// işlem repository interface'i
export interface ITransactionRepository {
  create(input: { // işlem oluşturma
    userId: string;
    propertyId: string;
    propertyType: PropertyType;
    grossPrice: number;
    commissionRate: number;
    commissionAmount: number;
    currency: string;
    listingAgentId: string;
    sellingAgentId: string;
  }): Promise<Transaction>;

  list(input: { userId?: string; skip: number; take: number }): Promise<{ items: Transaction[]; total: number }>; // sayfalama liste
  findById(id: string): Promise<Transaction | null>; // tekil işlem için

  updateStage(id: string, stage: 'AGREEMENT' | 'EARNEST_MONEY' | 'TITLE_DEED' | 'COMPLETED'): Promise<void>; // aşamayı günceller

  upsertShares(transactionId: string, shares: { agentId: string; amountMinor: number }[]): Promise<void>;
  getShares(transactionId: string): Promise<{ agentId: string; amountMinor: number }[]>;

  /** 
   * Ajanın taraf olduğu TAMAMLANMIŞ işlemleri (opsiyonel tarih filtresiyle) döner.
   * `from` ve `to` değerleri sağlanırsa completedAt (veya şemanızda uygun tarih alanı) ile filtreleyin.
   */
  listCompletedByAgent(params: {
    agentId: string;
    from?: Date;
    to?: Date;
  }): Promise<AgentEarningsTx[]>;
}

export const TransactionRepositoryToken = Symbol('ITransactionRepository'); // prisma implemantasyonuna bağlanır
