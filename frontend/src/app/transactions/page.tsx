import ClientTx from "./ClientTx";
import type { Transaction } from "@/lib/domain";

export const dynamic = "force-dynamic"; // cache kapalı

export default function TransactionsPage() {
  const agents: { id: string; name: string }[] = [];
  const initial: Transaction[] = [];
  return <ClientTx agents={agents} initial={initial} />;
}
