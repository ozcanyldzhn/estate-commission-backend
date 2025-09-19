
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

type Stage = 'AGREEMENT' | 'EARNEST_MONEY' | 'TITLE_DEED' | 'COMPLETED'

function nextStage(current: Stage): Stage {
  switch (current) {
    case 'AGREEMENT': return 'EARNEST_MONEY'
    case 'EARNEST_MONEY': return 'TITLE_DEED'
    case 'TITLE_DEED': return 'COMPLETED'
    case 'COMPLETED': throw new Error('Already completed')
  }
}

describe('Workflow service', () => {
  it('progresses in strict order', () => {
    let s: Stage = 'AGREEMENT'
    s = nextStage(s)
    assert.equal(s, 'EARNEST_MONEY')
    s = nextStage(s)
    assert.equal(s, 'TITLE_DEED')
    s = nextStage(s)
    assert.equal(s, 'COMPLETED')
  })

  it('throws if already completed', () => {
    assert.throws(() => nextStage('COMPLETED'), /Already completed/)
  })
})
