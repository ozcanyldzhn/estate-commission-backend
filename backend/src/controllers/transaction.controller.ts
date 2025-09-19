import { container } from 'tsyringe';
import { TransactionService } from '../services/transaction.service.js';
import { CreateTransactionSchema, GetTransactionQuerySchema, TransactionIdParamSchema } from '../dto/transaction.dto.js';
import { toApi } from '../types/http.js';
import { badRequest, ok as httpOk, created as httpCreated } from '../http/http-helpers.js';
import type { HandlerCtx, HandlerResult } from '../http/router.js';

// container.resolve(TransactionService) ile TransactionService'i enjekte ederiz
// zod şemaları ile safeParse validasyon sağlıyoruz
// validasyonlardan geçenler için service çağrısı yapılır


// body validasyonu yapılır
export class TransactionController { //inbound adapter
  static async create(ctx: HandlerCtx): Promise<HandlerResult> {
    const parse = CreateTransactionSchema.safeParse(ctx.body); // geçersizse 400 hata döner
    if (!parse.success) return badRequest({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parse.error.flatten() } });
    const svc = container.resolve(TransactionService); // TransactionService'i enjekte ederiz
    const result = await svc.create(parse.data);
    return result.ok ? httpCreated(toApi(result)) : badRequest(toApi(result));
  }
  // guery validasyonu yaplır
  static async list(ctx: HandlerCtx): Promise<HandlerResult> {
    const parse = GetTransactionQuerySchema.safeParse(ctx.query);
    if (!parse.success) return badRequest({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query', details: parse.error.flatten() } });
    const svc = container.resolve(TransactionService);
    const result = await svc.list(parse.data);
    return httpOk(toApi(result));
  }
  // raoute paramaeterleri validasyonu yapılır
  static async advance(ctx: HandlerCtx): Promise<HandlerResult> {
    const idParam = TransactionIdParamSchema.safeParse(ctx.params);
    if (!idParam.success) return badRequest({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid id', details: idParam.error.flatten() } });
    const svc = container.resolve(TransactionService);
    const result = await svc.advanceStage(idParam.data.id);
    return result.ok ? httpOk({ success: true, data: result.data }) : badRequest({ success: false, error: result.error });
  }

  static async breakdown(ctx: HandlerCtx): Promise<HandlerResult> {
    const idParam = TransactionIdParamSchema.safeParse(ctx.params);
    if (!idParam.success) return badRequest({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid id', details: idParam.error.flatten() } });
    const svc = container.resolve(TransactionService);
    const result = await svc.getBreakdown(idParam.data.id);
    return result.ok ? httpOk({ success: true, data: result.data }) : badRequest({ success: false, error: result.error });
  }
}
