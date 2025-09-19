export enum PropertyType { RESIDENTIAL = 'RESIDENTIAL', COMMERCIAL = 'COMMERCIAL', LAND = 'LAND' }
export enum TransactionStage { AGREEMENT='AGREEMENT', EARNEST_MONEY='EARNEST_MONEY', TITLE_DEED='TITLE_DEED', COMPLETED='COMPLETED' }

export interface Transaction {
  id: string;
  userId: string;
  propertyId: string;
  propertyType: PropertyType; //mülk tipi
  grossPrice: number;        // minor units (kuruş)
  commissionRate: number;    // bps
  commissionAmount: number;  // minor units
  currency: string;
  stage: TransactionStage; //işlem aşaması
  listingAgentId: string;
  sellingAgentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionBreakdown {
  agency: number; // minor units
  agents: { agentId: string; amount: number }[];
}

// domain'in tip sözleşmesini belirler,servisler ve repositoryler bu sözleşmeye uyar