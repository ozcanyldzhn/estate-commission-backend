import { createRouter } from '../http/router.js';
import { agentRouter } from './agent.router.js';
import { transactionRouter } from './transaction.router.js';
import { userRouter } from './user.router.js';
// root router oluşturulu ve child routerlar mount edilir
export const router = createRouter();
router.use('/api/transactions', transactionRouter);
router.use('/api/users', userRouter);
router.use('/api/agents', agentRouter);