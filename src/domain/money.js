// Para işlemleri için BigInt "cents" yaklaşımı (kuruş/penny bazlı).
// Örn: "123.45" -> 12345n, güvenli toplama/çıkarma/yüzde hesabı.

const SCALE = 100n;

export const Money = {
  fromDecimal(str) {
    const s = String(str).trim();
    if (!/^[-+]?\d+(\.\d{1,})?$/.test(s)) throw new Error('invalid money');
    const [l, r = ''] = s.split('.');
    const cents = (BigInt(l) * SCALE) + BigInt((r + '00').slice(0, 2));
    return cents;
  },

  toDecimalString(cents) {
    const sign = cents < 0 ? '-' : '';
    const abs = cents < 0 ? -cents : cents;
    const l = abs / SCALE;
    const r = abs % SCALE;
    return `${sign}${l}.${r.toString().padStart(2, '0')}`;
  },

  add: (a, b) => a + b,
  sub: (a, b) => a - b,

  // p: 0..100 arası tamsayı yüzde
  percent(amount, p) {
    return (amount * BigInt(p)) / 100n;
  }
};
