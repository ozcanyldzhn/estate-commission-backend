// Komisyon dağıtımı servisi: idempotent çalışır (aynı tx için iki kez yazmaz).

export class CommissionService {
    constructor({ policy, commissionRepo, auditRepo }) {
      this.policy = policy;
      this.repo = commissionRepo; // store.saveShares/hasShares/getShares bekler
      this.audit = auditRepo;
    }
  
    distribute({ transaction, listingAgentId, sellingAgentId }) {
      if (this.repo.hasShares(transaction.id)) {
        return this.repo.getShares(transaction.id); // idempotent
      }
      const shares = this.policy.compute(
        transaction.totalFeeCents,
        listingAgentId,
        sellingAgentId
      );
      this.repo.saveShares(transaction.id, shares);
      this.audit.log('CommissionShare', 'CREATE', { txId: transaction.id, shares });
      return shares;
    }
  
    getShares(txId) {
      return this.repo.getShares(txId);
    }
  }
  