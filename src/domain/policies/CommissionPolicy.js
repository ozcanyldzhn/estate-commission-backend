// Komisyon politikası: %50 ajans, %50 danışman havuzu.
// Senaryo 1: listing === selling -> havuzun tamamı aynı danışmana
// Senaryo 2: farklı -> havuz eşit bölüşülür

import { Money } from '../money.js';

export class CommissionPolicy {
  constructor({ agencyId }) { this.agencyId = agencyId; }

  compute(totalCents, listingAgentId, sellingAgentId) {
    const agency = Money.percent(totalCents, 50);
    const agentPool = Money.sub(totalCents, agency);

    if (listingAgentId === sellingAgentId) {
      return [
        { type: 'AGENCY', id: this.agencyId, amount: agency, percent: 50 },
        { type: 'AGENT',  id: listingAgentId, amount: agentPool, percent: 50 }
      ];
    } else {
      const each = agentPool / 2n; // eşit bölüşüm
      return [
        { type: 'AGENCY', id: this.agencyId, amount: agency, percent: 50 },
        { type: 'AGENT',  id: listingAgentId, amount: each,   percent: 25 },
        { type: 'AGENT',  id: sellingAgentId, amount: each,   percent: 25 }
      ];
    }
  }
}
