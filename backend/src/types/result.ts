export type Ok<T> = { ok: true; data: T };
export type Err<E extends string = string> = { ok: false; error: { code: E; message: string; details?: unknown } };
export type Result<T, E extends string = string> = Ok<T> | Err<E>;
export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E extends string>(code: E, message: string, details?: unknown): Err<E> => ({ ok: false, error: { code, message, details } });