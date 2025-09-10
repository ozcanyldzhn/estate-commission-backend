export const logger = {
    info:  (...a) => console.log('[INFO]',  ...a),
    debug: (...a) => console.log('[DEBUG]', ...a),
    error: (...a) => console.error('[ERROR]', ...a)
  };
  