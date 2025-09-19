import type { Transaction } from "@/lib/domain";
import { calcCommission } from "@/lib/domain";
import { formatCurrencyMinor, formatDate } from "@/lib/format";
import Badge from "@/components/Badge";

export default function TransactionTable({
  data,
  agents,
  renderActions
}: {
  data: Transaction[];
  agents: { id: string; name: string }[];
  renderActions: (t: Transaction) => React.ReactNode;
}) {
  if (!data?.length) return null;

  return (
    <div className="rounded-2xl border bg-white">
      {/* Yatay kaydırma için sarmalayıcı + min genişlik */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm min-w-[1200px]">
          <thead>
            <tr className="bg-gray-50 text-left font-medium">
              <th className="px-4 py-3 w-[260px]">ID</th>
              <th className="px-4 py-3 w-[140px]">Taşınmaz</th>
              <th className="px-4 py-3 w-[160px]">Listeleyen</th>
              <th className="px-4 py-3 w-[160px]">Satan</th>
              <th className="px-4 py-3 w-[90px]">Tür</th>
              <th className="px-4 py-3 w-[140px] text-right">Tutar</th>
              <th className="px-4 py-3 w-[120px] text-right">Komisyon %</th>
              <th className="px-4 py-3 w-[220px] text-right">Ajan Payı</th>
              <th className="px-4 py-3 w-[130px]">Durum</th>
              <th className="px-4 py-3 w-[160px]">Oluşturma</th>
              <th className="px-4 py-3 w-[240px]">Aksiyon</th>
            </tr>
          </thead>

          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-t">
                {/* ID */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-700 block max-w-[240px] truncate">
                    {t.id}
                  </span>
                </td>

                {/* Taşınmaz */}
                <td className="px-4 py-3">
                  <span className="block max-w-[120px] truncate">{t.propertyId}</span>
                </td>

                {/* Listeleyen */}
                <td className="px-4 py-3">
                  <span className="block max-w-[150px] truncate">
                    {(t as any).listingName ??
                      agents.find((a) => a.id === (t as any).listingAgentId)?.name ??
                      (t as any).listingAgentId ??
                      "-"}
                  </span>
                </td>

                {/* Satan */}
                <td className="px-4 py-3">
                  <span className="block max-w-[150px] truncate">
                    {(t as any).sellingName ??
                      agents.find((a) => a.id === (t as any).sellingAgentId)?.name ??
                      (t as any).sellingAgentId ??
                      "-"}
                  </span>
                </td>

                {/* Tür */}
                <td className="px-4 py-3 whitespace-nowrap">{t.type}</td>

                {/* Tutar */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {formatCurrencyMinor(t.amountMinor)}
                </td>

                {/* Komisyon % */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {(t.commissionRate * 100).toFixed(2)}%
                </td>

                {/* Ajan Payı */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {(() => {
                    const { agentMinor } = calcCommission({
                      amountMinor: (t as any).amountMinor,
                      commissionRate: t.commissionRate,
                    });
                    const listingId = (t as any).listingAgentId;
                    const sellingId = (t as any).sellingAgentId;
                    const sameAgent = listingId && sellingId && listingId === sellingId;

                    if (sameAgent) {
                      return (
                        <span className="whitespace-nowrap">
                          <span className="text-gray-500">Listeleyen & Satan:</span> {formatCurrencyMinor(agentMinor)}
                        </span>
                      );
                    }

                    const listingShare = Math.floor(agentMinor / 2);
                    const sellingShare = agentMinor - listingShare;

                    return (
                      <span className="inline-flex flex-col items-end">
                        <span className="whitespace-nowrap"><span className="text-gray-500">Listeleyen:</span> {formatCurrencyMinor(listingShare)}</span>
                        <span className="whitespace-nowrap"><span className="text-gray-500">Satan:</span> {formatCurrencyMinor(sellingShare)}</span>
                      </span>
                    );
                  })()}
                </td>

                {/* Durum */}
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      t.status === "COMPLETED"
                        ? "green"
                        : t.status === "TITLE_DEED"
                        ? "blue"
                        : t.status === "EARNEST_MONEY"
                        ? "amber"
                        : "gray"
                    }
                  >
                    {t.status}
                  </Badge>
                </td>

                {/* Oluşturma */}
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.createdAt)}</td>

                {/* Aksiyonlar */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderActions(t)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
