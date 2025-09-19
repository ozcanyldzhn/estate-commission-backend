import { calcCommission, canTransition, Transaction, TxStatus } from "@/lib/domain";
import { formatCurrencyMinor } from "@/lib/format";

export default function TxRow({
  t,
  onAdvance,
  onCancel
}: {
  t: Transaction;
  onAdvance: (to: TxStatus) => void;
  onCancel: () => void;
}) {
  const b = calcCommission(t);
  const candidates: TxStatus[] = ["EARNEST_MONEY", "TITLE_DEED", "COMPLETED"];
  // COMPLETED'a geç butonunu Completed durumunda gizle
  const actions: TxStatus[] = candidates
    .filter((s) => canTransition(t.status, s))
    .filter((s) => !(t.status === "COMPLETED" && s === "COMPLETED"));

  return (
    <div className="text-xs space-y-1">
      <div>
        Komisyon: <strong>{formatCurrencyMinor(b.commissionMinor)}</strong> — Şirket:{" "}
        <strong>{formatCurrencyMinor(b.companyMinor)}</strong> — Ajan:{" "}
        <strong>{formatCurrencyMinor(b.agentMinor)}</strong>
      </div>
      <div className="space-x-2">
        {t.status !== "COMPLETED" && (
          <button
            onClick={onCancel}
            className="rounded-lg border px-2 py-1 hover:bg-gray-50"
          >
            İptal
          </button>
        )}
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => onAdvance(a)}
            className="rounded-lg bg-black px-2 py-1 text-white"
          >
            {a}'a Geç
          </button>
        ))}
      </div>
    </div>
  );
}
