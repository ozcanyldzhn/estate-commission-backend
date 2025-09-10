import { Money } from '../../domain/money.js';

// Yardımcı: BigInt ve nested object/array’leri insan-okur hale getir
function fmt(val) {
  if (typeof val === 'bigint') {
    return `${val}n (${Money.toDecimalString(val)})`; // örn: 5000n (50.00)
  }
  if (Array.isArray(val)) {
    return val.map(fmt);
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = fmt(v);
    }
    return out;
  }
  return val;
}

function log(level, ...args) {
  const ts = new Date().toISOString();
  console.log(`[${level}]`, ts, ...args.map(fmt));
}

export const logger = {
  info:  (...a) => log('INFO',  ...a),
  debug: (...a) => log('DEBUG', ...a),
  error: (...a) => log('ERROR', ...a)
};
