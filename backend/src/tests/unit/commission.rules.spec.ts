
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Varsayılan kurallar (bps = basis points).
const DEFAULT_BPS = 1000 // %10

function calcCommissionAmountMinor(grossMinor: bigint, rateBps: number = DEFAULT_BPS): bigint {
  // gross * bps / 10000
  return BigInt(Math.round(Number(grossMinor) * rateBps / 10000))
}

function splitCommission(minor: bigint) {
  const agency = BigInt(Math.floor(Number(minor) / 2))
  const agents = minor - agency
  return { agency, agents }
}

function splitBetweenAgents(agentsPortion: bigint, samePerson: boolean) {
  if (samePerson) return { listing: agentsPortion, selling: 0n }
  const half = BigInt(Math.floor(Number(agentsPortion) / 2))
  const listing = agentsPortion - half // kuruş kalırsa listinge
  const selling = half
  return { listing, selling }
}

describe('Commission rules', () => {
  it('calculates 10% commission from gross (minor)', () => {
    const gross = 1_000_00n // 1000.00
    const commission = calcCommissionAmountMinor(gross, 1000)
    assert.equal(commission, 100_00n) // 100.00
  })

  it('splits commission 50/50 between agency and agents', () => {
    const commission = 100_00n // 100.00
    const { agency, agents } = splitCommission(commission)
    assert.equal(agency, 50_00n)
    assert.equal(agents, 50_00n)
  })

  it('agent split: same person gets all agent portion', () => {
    const res = splitBetweenAgents(50_00n, true)
    assert.equal(res.listing, 50_00n)
    assert.equal(res.selling, 0n)
  })

  it('agent split: two agents get equal, remainder to listing', () => {
    const agents = 51_01n // 51.01
    const res = splitBetweenAgents(agents, false)
    // selling = floor(51.01/2)=25.50, listing = 25.51
    assert.equal(res.selling, 25_50n)
    assert.equal(res.listing, 25_51n)
    assert.equal(res.listing + res.selling, agents)
  })
})
