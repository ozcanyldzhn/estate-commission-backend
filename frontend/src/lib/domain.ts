import { CONFIG } from "@/lib/config";

export type ID = string;
export type TxType = "SALE" | "RENT";
// Align with backend stages
export type TxStatus = "AGREEMENT" | "EARNEST_MONEY" | "TITLE_DEED" | "COMPLETED";

export interface Agent {
  id: ID;
  name: string;
  email?: string;
}

export interface Transaction {
  id: ID;
  propertyId: ID;
  agentId: ID;
  listingAgentId?: ID;
  sellingAgentId?: ID;
  type: TxType;
  amountMinor: number | string | bigint;
  commissionRate: number;
  status: TxStatus;
  createdAt: string;
}

export interface CommissionBreakdown {
  commissionMinor: number;
  companyMinor: number;
  agentMinor: number;
}

// util
export const numOf = (x: number | string | bigint) =>
  typeof x === "bigint" ? Number(x) :
  typeof x === "string" ? Number.parseInt(x, 10) : x;

export const toMinor = (major: number) => Math.round((major || 0) * 100);

// komisyon hesaplama
export function calcCommission(
  tx: Pick<Transaction, "amountMinor" | "commissionRate">,
  companyShareRate = CONFIG.companyShareRate
): CommissionBreakdown {
  const base = numOf(tx.amountMinor) * (tx.commissionRate || 0);
  const commissionMinor = Math.round(base);
  const companyMinor = Math.round(commissionMinor * companyShareRate);
  const agentMinor = commissionMinor - companyMinor;
  return { commissionMinor, companyMinor, agentMinor };
}

// status geçişleri
export function nextStatuses(current: TxStatus): TxStatus[] {
  switch (current) {
    case "AGREEMENT": return ["EARNEST_MONEY"];
    case "EARNEST_MONEY": return ["TITLE_DEED"];
    case "TITLE_DEED": return ["COMPLETED"];
    case "COMPLETED": return ["COMPLETED"];
    default: return ["AGREEMENT"];
  }
}

export const canTransition = (from: TxStatus, to: TxStatus) =>
  nextStatuses(from).includes(to);
