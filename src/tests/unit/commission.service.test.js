import test from 'node:test';
import assert from 'node:assert';
import { CommissionPolicy } from '../../domain/policies/CommissionPolicy.js';
import { CommissionService } from '../../domain/services/CommissionService.js';
import { InMemoryStore } from '../../infra/repo/InMemoryStore.js';
import { Money } from '../../domain/money.js';

test('same agent receives full agent pool', () => {
  const policy = new CommissionPolicy({ agencyId:'agency-1' });
  const store = new InMemoryStore();
  const service = new CommissionService({ policy, commissionRepo: store, auditRepo:{log(){}} });
  const tx = { id:'tx1', totalFeeCents: Money.fromDecimal('100.00') };

  const shares = service.distribute({ transaction: tx, listingAgentId:'a1', sellingAgentId:'a1' });

  const agency = shares.find(s=>s.type==='AGENCY').amount;
  const agent  = shares.find(s=>s.type==='AGENT').amount;
  assert.strictEqual(Money.toDecimalString(agency), '50.00');
  assert.strictEqual(Money.toDecimalString(agent),  '50.00');
});

test('different agents split agent pool equally', () => {
  const policy = new CommissionPolicy({ agencyId:'agency-1' });
  const store = new InMemoryStore();
  const service = new CommissionService({ policy, commissionRepo: store, auditRepo:{log(){}} });
  const tx = { id:'tx2', totalFeeCents: Money.fromDecimal('99.99') };

  const shares = service.distribute({ transaction: tx, listingAgentId:'a1', sellingAgentId:'a2' });
  const agents = shares.filter(s=>s.type==='AGENT');

  assert.strictEqual(agents.length, 2);
  assert.strictEqual(Money.toDecimalString(agents[0].amount), '25.00');
  assert.strictEqual(Money.toDecimalString(agents[1].amount), '25.00');
});
