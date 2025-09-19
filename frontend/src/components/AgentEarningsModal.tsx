"use client";

import { useEffect, useState } from "react";
import { getAgentEarnings } from "@/lib/api";
import { formatCurrencyMinor } from "@/lib/format";

type Props = {
  agentId: string | null;
  agentName?: string | null;
  open: boolean;
  onClose: () => void;
  from?: string;
  to?: string;
};

export default function AgentEarningsModal({ agentId, agentName, open, onClose, from, to }: Props) {
  // Varsayılan tarih aralığı: 2025-01-01 → yarın
  const defaultFrom = '2025-01-01'
  const defaultTo = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!open || !agentId) return;
    (async () => {
      try {
        setLoading(true); setError(null);
        const raw = await getAgentEarnings(agentId, from || defaultFrom, to || defaultTo);
        // Gözlem/log: farklı ortamlarda şekli teyit edelim
        console.debug('[earnings] response', raw);
        // String geldiyse JSON parse et
        let res: any = raw;
        if (typeof raw === 'string') {
          try { res = JSON.parse(raw); } catch { /* ignore */ }
        }
        // success/data şeması veya direkt payload
        const payload = (res && typeof res === 'object' && 'data' in res) ? (res as any).data : res;
        if (payload && typeof payload === 'object') {
          // createdAt varsa en yeni → eski (desc) zaten backend’de; yine de güvence olsun
          if (Array.isArray(payload.byTransaction)) {
            payload.byTransaction = [...payload.byTransaction].sort((a, b) => {
              const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
              const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
              return db - da
            })
          }
          setData(payload)
        }
        else setError("Veri alınamadı");
      } catch (e) {
        setError("Veri alınırken hata oluştu");
      } finally { setLoading(false); }
    })();
  }, [open, agentId, from, to]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Ajan Kazançları{agentName ? ` • ${agentName}` : ''}</h2>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm hover:bg-gray-100">Kapat</button>
        </div>

        <div className="p-4">
          {loading && <p>Yükleniyor…</p>}
          {!data && error && <p className="text-red-600">{error}</p>}
          {data && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Toplam Kazanç</div>
                <div className="text-2xl font-bold">{data.totalAgentEarningsFormatted ?? formatCurrencyMinor(data.totalAgentEarningsMinor)}</div>
                {data.period && (
                  <div className="text-xs text-gray-500">{data.period.from ?? '—'} → {data.period.to ?? '—'}</div>
                )}
              </div>

              <div className="rounded-xl border">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th className="w-1/3 p-3">İşlem</th>
                      <th className="w-1/3 p-3">Rol</th>
                      <th className="w-1/3 p-3 text-right">Kazanç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data.byTransaction) && data.byTransaction.length ? (
                      data.byTransaction.map((row: any) => (
                        <tr key={row.transactionId} className="border-b last:border-none">
                          <td className="p-3 font-mono text-xs">{row.transactionId}</td>
                          <td className="p-3">{row.role}</td>
                          <td className="p-3 text-right">{row.earnedFormatted ?? formatCurrencyMinor(row.earnedMinor)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-500">Kayıt yok</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


