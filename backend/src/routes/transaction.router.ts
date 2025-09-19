import { createRouter } from '../http/router.js';
import { TransactionController } from '../controllers/transaction.controller.js';
import { Handler } from '../http/router.js';

export const transactionRouter = createRouter();

transactionRouter.post('/', ((ctx) => TransactionController.create(ctx)) as  Handler);
transactionRouter.get('/', ((ctx) => TransactionController.list(ctx)) as Handler);
transactionRouter.post('/:id/advance', ((ctx) => TransactionController.advance(ctx)) as Handler);
transactionRouter.get('/:id/breakdown', ((ctx) => TransactionController.breakdown(ctx)) as Handler);
