function id(prefix='id'){ return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }

export class InMemoryStore {
  constructor(){
    this.tables = {
      transactions: new Map(),
      shares: new Map()
    };
  }

  insert(table, obj){
    const _id = obj.id || id('tx');
    const clone = { ...obj, id: _id };
    this.tables[table].set(_id, clone);
    return clone;
  }
  find(table, _id){
    return this.tables[table].get(_id) || null;
  }
  update(table, _id, patch){
    const prev = this.find(table, _id);
    if (!prev) return null;
    const next = { ...prev, ...patch };
    this.tables[table].set(_id, next);
    return next;
  }

  // Commission shares (idempotent)
  saveShares(txId, shares){
    if (this.tables.shares.has(txId)) return; // guard
    this.tables.shares.set(txId, shares.map(s => ({ ...s })));
  }
  hasShares(txId){ return this.tables.shares.has(txId); }
  getShares(txId){ return this.tables.shares.get(txId) || null; }
}
