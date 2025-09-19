import { container } from 'tsyringe';
import { CreateUserSchema } from '../dto/user.dto.js';
import { ok as httpOk, badRequest, created as httpCreated } from '../http/http-helpers.js';
import { UserService } from '../services/user.services.js';
import type { HandlerCtx, HandlerResult } from '../http/router.js';
import { z } from 'zod';

export class UserController {
  static async create(ctx: HandlerCtx): Promise<HandlerResult> {
    const parse = CreateUserSchema.safeParse(ctx.body);
    if (!parse.success) {
      return badRequest({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parse.error.flatten() }
      });
    }
    const svc = container.resolve(UserService);
    const result = await svc.create(parse.data);
    if (!result.ok) {
      return badRequest({ success: false, error: result.error });
    }
    return httpCreated({ success: true, data: result.data });
  }

  static async list(ctx: HandlerCtx): Promise<HandlerResult> {
    const Query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    });
    const parse = Query.safeParse(ctx.query);
    if (!parse.success) {
      return badRequest({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query', details: parse.error.flatten() } });
    }
    const svc = container.resolve(UserService);
    const result = await svc.list(parse.data);
    return httpOk({ success: true, data: result.data });
  }
}
