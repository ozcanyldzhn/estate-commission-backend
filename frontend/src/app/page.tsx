"use client";

import { useEffect, useMemo, useState } from "react";
import { listTransactions, listUsers, advanceTransaction } from "@/lib/api";
import { Transaction, TxStatus, canTransition } from "@/lib/domain";
import { calcCommission } from "@/lib/domain";
import { formatCurrencyMinor } from "@/lib/format";
import TransactionTable from "@/components/TransactionTable";
import TxRow from "@/components/TxRow";

export default function HomePage() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // backend'den verileri çek
  useEffect(() => {
    (async () => {
      try {
        // Transactions
        const txRes = await listTransactions();
        if (txRes?.success) {
          const items: any[] = txRes.data.items ?? [];
          const mapped: Transaction[] = items.map((it: any) => ({
            id: it.id,
            propertyId: it.propertyId,
            agentId: it.listingAgentId ?? it.sellingAgentId,
            type: "SALE",
            amountMinor: Number(it.grossPrice ?? 0),
            commissionRate: Number(it.commissionRate ?? 0) / 10000,
            status: it.stage as TxStatus,
            createdAt: new Date(it.createdAt).toISOString(),
            // tablo componenti listing/selling'i (any) üstünden okuyor
            ...(it.listingAgentId ? { listingAgentId: it.listingAgentId } : {}),
            ...(it.sellingAgentId ? { sellingAgentId: it.sellingAgentId } : {}),
            // isim cache'i; users yüklenince agents üzerinden yine isim bulunur
            listingName: undefined,
            sellingName: undefined,
          }));
          setRows(mapped);
        }

        // Users
        const users = await listUsers({ page: 1, pageSize: 100 });
        const raw: any = users;
        const items: any[] = raw?.data?.items ?? raw?.items ?? (Array.isArray(raw) ? raw : []);
        if (Array.isArray(items) && items.length) {
          const mappedAgents = items.map((u: any) => ({ id: u.id, name: u.name ?? u.email ?? u.id }));
          setAgents(mappedAgents);
          // isimleri satırlara da yansıt (erken render için)
          setRows(prev => prev.map(r => ({
            ...r,
            listingName: mappedAgents.find(a => a.id === (r as any).listingAgentId)?.name ?? (r as any).listingName,
            sellingName: mappedAgents.find(a => a.id === (r as any).sellingAgentId)?.name ?? (r as any).sellingName,
          })));
        }
      } catch (e) {
        console.error("home fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Özet kutuları (toplamlar)
  const summary = useMemo(() => {
    return rows.reduce(
      (acc, t) => {
        const { commissionMinor, companyMinor, agentMinor } = calcCommission({
          amountMinor: t.amountMinor,
          commissionRate: t.commissionRate,
        });
        acc.totalCommission += commissionMinor;
        acc.company += companyMinor;
        acc.agent += agentMinor;
        return acc;
      },
      { totalCommission: 0, company: 0, agent: 0 }
    );
  }, [rows]);

  function mutate(id: string, fn: (t: Transaction) => Transaction) {
    setRows((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Özet kutuları */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-600">Toplam Komisyon</div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrencyMinor(summary.totalCommission)}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-600">Şirket Payı</div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrencyMinor(summary.company)}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-600">Ajan Payı</div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrencyMinor(summary.agent)}
          </div>
        </div>
      </div>

      {/* İşlemler tablosu */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">İşlemler</h2>
        <TransactionTable
          data={rows}
          agents={agents}
          renderActions={(t) => (
            <TxRow
              t={t}
              onCancel={() =>
                mutate(t.id, (old) => ({
                  ...old,
                  status: canTransition(old.status, "COMPLETED") ? "COMPLETED" : old.status,
                }))
              }
              onAdvance={async () => {
                try {
                  const res = await advanceTransaction(t.id);
                  if ((res as any)?.success) {
                    const next = (res as any).data.stage as TxStatus;
                    mutate(t.id, (old) => ({ ...old, status: next }));
                    return;
                  }
                  alert("Aşama ilerletilemedi.");
                } catch (e) {
                  console.error(e);
                  alert("Aşama ilerletilirken bir hata oluştu.");
                }
              }}
            />
          )}
        />
      </div>
    </div>
  );
}
