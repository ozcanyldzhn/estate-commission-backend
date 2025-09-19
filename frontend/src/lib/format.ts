export function formatCurrencyMinor(amountMinor: number | string | bigint, currency = "TRY") {
  const n = typeof amountMinor === "bigint"
    ? Number(amountMinor)
    : typeof amountMinor === "string"
      ? Number.parseInt(amountMinor, 10)
      : amountMinor;

  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format((n || 0) / 100);
}

export function formatDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
