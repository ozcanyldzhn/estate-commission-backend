export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export const toApi = <T>(r: import('./result.js').Result<T>): ApiResponse<T> => (r.ok ? { success: true, data: r.data } : { success: false, error: r.error });
