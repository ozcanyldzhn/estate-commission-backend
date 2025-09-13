export class TransactionRepository {
    constructor(store){ this.store = store; }
    create(tx){ return this.store.insert('transactions', tx); }
    findById(id){ return this.store.find('transactions', id); }
    update(id, patch){ return this.store.update('transactions', id, patch); }
  }
  