import { CommissionPolicy } from '../domain/policies/CommissionPolicy.js';
import { CommissionService } from '../domain/services/CommissionService.js';
import { WorkflowService } from '../domain/services/WorkflowService.js';
import { ReportingService } from '../domain/services/ReportingService.js';
import { TransactionRepository } from '../infra/repo/TransactionRepository.js';
import { InMemoryStore } from '../infra/repo/InMemoryStore.js';
import { logger } from '../infra/logging/logger.js';

export function createContainer() {
  const store = new InMemoryStore();
  const transactions = new TransactionRepository(store);
  const policy = new CommissionPolicy({ agencyId: 'agency-1' });

  const workflow = new WorkflowService();
  const commission = new CommissionService({
    policy,
    commissionRepo: store,
    auditRepo: { log: (...args) => logger.debug(...args) }
  });
  const reporting = new ReportingService({ store });
  const audit = { log: (...args) => logger.debug(...args) };

  return { logger, transactions, workflow, commission, reporting, audit };
}
