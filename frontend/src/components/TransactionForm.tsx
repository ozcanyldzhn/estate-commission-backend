"use client";

import { useEffect, useMemo, useState } from "react";
import { CONFIG } from "@/lib/config";
import { toMinor, calcCommission, TxType, Transaction } from "@/lib/domain";
import AgentPicker from "@/components/AgentPicker";
import { formatCurrencyMinor } from "@/lib/format";

export default function TransactionForm({
  agents,
  onCreate
}: {
  agents: { id: string; name: string }[];
  onCreate: (tx: Transaction & { listingAgentId: string; sellingAgentId: string }) => void;
}) {
  const [listingAgentId, setListingAgentId] = useState("");
  const [sellingAgentId, setSellingAgentId] = useState("");
  const [sameAsListing, setSameAsListing] = useState(true);

  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState<TxType>("SALE");
  const [amountMajor, setAmountMajor] = useState(0);
  const [commissionRate, setCommissionRate] = useState<number>(
    CONFIG.defaultCommissionRateSale
  );

  useEffect(() => {
    setCommissionRate(
      type === "SALE"
        ? CONFIG.defaultCommissionRateSale
        : CONFIG.defaultCommissionRateRent
    );
  }, [type]);

  const canSubmit =
    !!propertyId &&
    !!listingAgentId &&
    (sameAsListing || !!sellingAgentId) &&
    amountMajor >= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const finalSellingId = sameAsListing ? listingAgentId : sellingAgentId;

    const tx: Transaction & { listingAgentId: string; sellingAgentId: string } = {
      id: crypto.randomUUID(),
      agentId: listingAgentId || finalSellingId, // UI tarafında satır gösterimi için
      listingAgentId,
      sellingAgentId: finalSellingId,
      propertyId,
      type,
      amountMinor: toMinor(amountMajor),
      commissionRate,
      status: "AGREEMENT",
      createdAt: new Date().toISOString()
    };

    onCreate(tx);

    // Formu sıfırla
    setListingAgentId("");
    setSellingAgentId("");
    setSameAsListing(true);
    setPropertyId("");
    setType("SALE");
    setAmountMajor(0);
  }

  const preview = useMemo(
    () => calcCommission({ amountMinor: toMinor(amountMajor), commissionRate }),
    [amountMajor, commissionRate]
  );

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Listeleyen Ajan</label>
          <AgentPicker
            agents={agents as any}
            value={listingAgentId}
            onChange={setListingAgentId}
          />
          {!listingAgentId && (
            <p className="mt-1 text-xs text-red-600">Bu alan zorunludur.</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-sm">Satan Ajan</label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={sameAsListing}
                onChange={(e) => setSameAsListing(e.target.checked)}
              />
              Listeleyen ile aynı
            </label>
          </div>

          <AgentPicker
            agents={agents as any}
            value={sameAsListing ? listingAgentId : sellingAgentId}
            onChange={(val: string) => setSellingAgentId(val)}
            // AgentPicker native select değilse "disabled" desteklemeyebilir;
            // yine de UI'da seçim yapılamayacak şekilde render ediyorsa sorun yok.
          />

          {!sameAsListing && !sellingAgentId && (
            <p className="mt-1 text-xs text-red-600">Bu alan zorunludur.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm">Taşınmaz ID</label>
          <input
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Tür</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TxType)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="SALE">SATIŞ</option>
            <option value="RENT">KİRA</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Tutar (₺)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={amountMajor}
            onChange={(e) => setAmountMajor(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Komisyon Oranı (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={commissionRate * 100}
            onChange={(e) => setCommissionRate(Number(e.target.value) / 100)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-3 text-sm">
        <div>
          Komisyon: <strong>{formatCurrencyMinor(preview.commissionMinor)}</strong>
        </div>
        <div>
          Şirket (%{(CONFIG.companyShareRate * 100).toFixed(0)}):{" "}
          <strong>{formatCurrencyMinor(preview.companyMinor)}</strong>
        </div>
        <div>
          Ajan: <strong>{formatCurrencyMinor(preview.agentMinor)}</strong>
        </div>
      </div>

      <button
        disabled={!canSubmit}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        İşlem Oluştur
      </button>
    </form>
  );
}
