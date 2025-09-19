"use client";
import { useState, useEffect } from "react";
import TransactionForm from "@/components/TransactionForm";
import TransactionTable from "@/components/TransactionTable";
import TxRow from "@/components/TxRow";
import EmptyState from "@/components/EmptyState";
import { canTransition, Transaction, TxStatus } from "@/lib/domain";
import { listTransactions, createTransaction as apiCreate, advanceTransaction, listUsers } from "@/lib/api";

export default function ClientTx({
  agents,
  initial
}: {
  agents: { id: string; name: string }[];
  initial: Transaction[];
}) {
  const [rows, setRows] = useState<Transaction[]>(initial);
  const [agentOptions, setAgentOptions] = useState<{ id: string; name: string }[]>(agents);

  // Backend'den veri yükle
  useEffect(() => {
    (async () => {
      try {
        const res = await listTransactions();
        if ((res as any).success === true) {
          const items = (res as any).data.items as any[];
          const mapped: Transaction[] = items.map((it) => ({
            id: it.id,
            propertyId: it.propertyId,
            agentId: it.listingAgentId ?? it.sellingAgentId,
            type: "SALE",
            amountMinor: it.grossPrice,
            commissionRate: Number(it.commissionRate ?? 0) / 10000,
            status: it.stage as TxStatus,
            createdAt: new Date(it.createdAt).toISOString(),
            // Listeleyen/Satan id'lerini de taşıyalım ki tabloda isim eşleştirelim
            ...(it.listingAgentId ? { listingAgentId: it.listingAgentId } : {}),
            ...(it.sellingAgentId ? { sellingAgentId: it.sellingAgentId } : {}),
          }));
          setRows(mapped);
        }
      } catch {
        // initial demo rows ile devam
      }

      try {
        const users = await listUsers({ page: 1, pageSize: 100 });
        const raw: any = users;
        const items: any[] = raw?.data?.items ?? raw?.items ?? (Array.isArray(raw) ? raw : []);
        if (Array.isArray(items) && items.length) {
          setAgentOptions(items.map((u: any) => ({ id: u.id, name: u.name ?? u.email ?? u.id })));
        }
      } catch {
        // kullanıcı listesi alınamazsa mevcut agents ile devam
      }
    })();
  }, []);

  async function onCreate(tx: Transaction & { listingAgentId: string; sellingAgentId?: string }) {
    if (!tx.listingAgentId) {
      alert("Listeleyen ajan seçilmelidir.");
      return;
    }
    const finalSellingId = tx.sellingAgentId && tx.sellingAgentId.length ? tx.sellingAgentId : tx.listingAgentId;

    try {
      const res = await apiCreate({
        userId: tx.listingAgentId,                 // backend zorunlu alanı
        propertyId: tx.propertyId,
        propertyType: "RESIDENTIAL",
        grossPrice: Number(tx.amountMinor),        // kuruş bazlı integer
        currency: "TRY",
        listingAgentId: tx.listingAgentId,
        sellingAgentId: finalSellingId,
        // FE commissionRate (0-1) -> bps
        commissionRateBps: Math.round((tx.commissionRate || 0) * 10000)
      } as any);

      if ((res as any).success) {
        const it = (res as any).data;
        const mapped: Transaction = {
          id: it.id,
          propertyId: it.propertyId,
          agentId: it.listingAgentId ?? it.sellingAgentId,
          type: "SALE",
          amountMinor: it.grossPrice,
          commissionRate: Number(it.commissionRate ?? 0) / 10000,
          status: it.stage as TxStatus,
          createdAt: new Date(it.createdAt).toISOString(),
          listingAgentId: it.listingAgentId,
          sellingAgentId: it.sellingAgentId,
        };
        setRows((prev) => [mapped, ...prev]);
        return;
      }
      console.error("Create failed:", res);
      alert("Kayıt başarısız. Lütfen tekrar deneyin.");
    } catch (e) {
      console.error(e);
      alert("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  function mutate(id: string, fn: (t: Transaction) => Transaction) {
    setRows((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İşlemler</h1>
      <TransactionForm agents={agentOptions} onCreate={onCreate} />
      {rows.length ? (
        <TransactionTable
          data={rows}
          agents={agentOptions}
          renderActions={(t) => (
            <TxRow
              t={t}
              onCancel={() =>
                mutate(t.id, (old) => ({
                  ...old,
                  status: canTransition(old.status, "COMPLETED") ? "COMPLETED" : old.status
                }))
              }
              onAdvance={async () => {
                try {
                  const res = await advanceTransaction(t.id);
                  if ((res as any).success) {
                    const next = (res as any).data.stage as TxStatus;
                    mutate(t.id, (old) => ({ ...old, status: next }));
                    return;
                  }
                  console.error("Advance failed:", res);
                  alert("Aşama ilerletilemedi.");
                } catch (e) {
                  console.error(e);
                  alert("Aşama ilerletilirken bir hata oluştu.");
                }
              }}
            />
          )}
        />
      ) : (
        <EmptyState title="Kayıt yok" description="Yeni bir işlem ekleyin." />
      )}
    </div>
  );
}
