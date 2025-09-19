import { createRouter } from '../http/router.js';
import type { Handler } from '../http/router.js';
import { UserController } from '../controllers/user.controller.js';

export const userRouter = createRouter();

userRouter.post('/', ((ctx) => UserController.create(ctx)) as Handler);
userRouter.get('/', ((ctx) => UserController.list(ctx)) as Handler);
