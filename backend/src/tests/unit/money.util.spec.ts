
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Basit yardımcılar: Projede bunlar genellikle utils içinde olur.
// Eğer projede farklı isim/path varsa importu güncelleyin.
function toMinor(major: number): bigint {
  return BigInt(Math.round(major * 100))
}
function toMajor(minor: bigint): number {
  return Number(minor) / 100
}

describe('Money utils', () => {
  it('toMinor should convert 100.00 -> 10000n', () => {
    assert.equal(toMinor(100.00), 10000n)
  })
  it('toMajor should convert 10000n -> 100.00', () => {
    assert.equal(toMajor(10000n), 100.00)
  })
  it('precision: 0.1 + 0.2 style errors avoided via integers', () => {
    const a = 10n, b = 20n // kuruş
    const c = a + b        // 30n
    assert.equal(c, 30n)
    assert.equal(Number(c) / 100, 0.30)
  })
})
