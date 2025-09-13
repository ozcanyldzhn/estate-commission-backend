import test from 'node:test';
import assert from 'node:assert';
import { Money } from '../../domain/money.js';

test('fromDecimal/toDecimalString roundtrip', () => {
  const c = Money.fromDecimal('123.45');
  assert.strictEqual(Money.toDecimalString(c), '123.45');
});

test('percent 50 of 100.00 equals 50.00', () => {
  const c = Money.fromDecimal('100.00');
  const p = Money.percent(c, 50);
  assert.strictEqual(Money.toDecimalString(p), '50.00');
});
