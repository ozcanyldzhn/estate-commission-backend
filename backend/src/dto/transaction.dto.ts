import { z } from 'zod';
import { PropertyType } from '../domain/transaction.js';

export const CreateTransactionSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().min(1),
  propertyType: z.nativeEnum(PropertyType),
  grossPrice: z.number().int().positive(), // minor units
  // İstemciden gelen komisyon oranı (basis points). Sağlanmazsa %10 (1000 bps) kullanılır
  commissionRateBps: z.coerce.number().int().min(0).max(10000).default(1000).optional(),
  currency: z.string().length(3).default('TRY'),
  listingAgentId: z.string().cuid(),
  sellingAgentId: z.string().cuid()
});
export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

export const GetTransactionQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
export type GetTransactionQuery = z.infer<typeof GetTransactionQuerySchema>;

export const TransactionIdParamSchema = z.object({ id: z.string().cuid() });
export type TransactionIdParam = z.infer<typeof TransactionIdParamSchema>;
