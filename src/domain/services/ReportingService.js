// Basit kırılım raporu: toplam tutarı ve payları insan-okur formatında döndürür.

import { Money } from '../money.js';

export class ReportingService {
  constructor({ store }) {
    this.store = store; // InMemoryStore
  }

  breakdown(id) {
    const tx = this.store.tables.transactions.get(id);
    if (!tx) return null;
    const shares = this.store.tables.shares.get(id) || [];

    return {
      id,
      totalFee: Money.toDecimalString(tx.totalFeeCents),
      shares: shares.map(s => ({
        ...s,
        amount: Money.toDecimalString(s.amount)
      }))
    };
    // Not: İleride agent/agency isimleri eklemek için repo'dan join yapılabilir.
  }
}
