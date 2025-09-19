
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Basit in-memory veri ve earnings hesabı:
// Yalnızca COMPLETED işlemler hesaba katılır.
type Role = 'listing' | 'selling' | 'solo'
type Stage = 'AGREEMENT' | 'EARNEST_MONEY' | 'TITLE_DEED' | 'COMPLETED'

interface Tx {
  id: string
  stage: Stage
  currency: string
  commissionMinor: bigint
  listingAgentId?: string
  sellingAgentId?: string
}

interface Share {
  transactionId: string
  agentId: string
  role: Role
  amountMinor: bigint
  currency: string
}

function computeShares(tx: Tx): Share[] {
  if (tx.stage !== 'COMPLETED') return []
  const half = BigInt(Math.floor(Number(tx.commissionMinor) / 2))
  const agency = tx.commissionMinor - half // not used in earnings
  const agentsPortion = half

  if (tx.listingAgentId && tx.sellingAgentId && tx.listingAgentId !== tx.sellingAgentId) {
    const sellingHalf = BigInt(Math.floor(Number(agentsPortion) / 2))
    const listingShare = agentsPortion - sellingHalf
    return [
      { transactionId: tx.id, agentId: tx.listingAgentId, role: 'listing', amountMinor: listingShare, currency: tx.currency },
      { transactionId: tx.id, agentId: tx.sellingAgentId, role: 'selling', amountMinor: sellingHalf, currency: tx.currency },
    ]
  } else {
    const agentId = tx.listingAgentId || tx.sellingAgentId || 'unknown'
    return [{ transactionId: tx.id, agentId, role: 'solo', amountMinor: agentsPortion, currency: tx.currency }]
  }
}

function earningsForAgent(agentId: string, txs: Tx[]) {
  const shares = txs.flatMap(computeShares).filter(s => s.agentId === agentId)
  const total = shares.reduce((acc, s) => acc + s.amountMinor, 0n)
  return { totalMinor: total, count: shares.length }
}

describe('Agent earnings service', () => {
  it('sums only COMPLETED transactions and correct roles', () => {
    const txs: Tx[] = [
      { id:'t1', stage:'COMPLETED', currency:'TRY', commissionMinor: 100_00n, listingAgentId:'A', sellingAgentId:'B' }, // A:25, B:25, agency:50
      { id:'t2', stage:'TITLE_DEED', currency:'TRY', commissionMinor: 80_00n, listingAgentId:'A', sellingAgentId:'B' }, // not completed
      { id:'t3', stage:'COMPLETED', currency:'TRY', commissionMinor: 62_50n, listingAgentId:'A', sellingAgentId:'A' }, // A solo:31.25
    ]
    const A = earningsForAgent('A', txs)
    const B = earningsForAgent('B', txs)

    // t1: A=25, B=25; t3: A=31.25
    assert.equal(A.totalMinor, 56_25n) // 25 + 31.25
    assert.equal(B.totalMinor, 25_00n)
  })
})
