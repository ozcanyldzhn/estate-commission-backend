import 'reflect-metadata';
import { container } from 'tsyringe';
import { TransactionRepositoryToken } from './repositories/transaction.repository.js';
import { PrismaTransactionRepository } from './repositories/prisma/prisma.transaction.repository.js';
import { UserRepositoryToken } from './repositories/user.repository.js';
import { PrismaUserRepository } from './repositories/prisma/prisma.user.repository.js';

// adapter'ı porta bağlama
container.register(TransactionRepositoryToken, { useClass: PrismaTransactionRepository });
container.register(UserRepositoryToken, { useClass: PrismaUserRepository });

export { container };
