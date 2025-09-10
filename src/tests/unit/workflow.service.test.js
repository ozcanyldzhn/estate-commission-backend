import test from 'node:test';
import assert from 'node:assert';
import { WorkflowService } from '../../domain/services/WorkflowService.js';

test('valid forward transitions only', () => {
  const wf = new WorkflowService();
  assert.equal(wf.canTransition('AGREEMENT', 'EARNEST'), true);
  assert.equal(wf.canTransition('EARNEST', 'TITLE_DEED'), true);
  assert.equal(wf.canTransition('TITLE_DEED', 'COMPLETED'), true);

  // invalid jumps / backwards
  assert.equal(wf.canTransition('AGREEMENT', 'TITLE_DEED'), false);
  assert.equal(wf.canTransition('COMPLETED', 'TITLE_DEED'), false);
});
