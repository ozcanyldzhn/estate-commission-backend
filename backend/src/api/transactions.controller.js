import { Money } from '../domain/money.js';

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function badRequest(m) { const e = new Error(m); e.statusCode = 400; return e; }
function notFound(m)  { const e = new Error(`${m} not found`); e.statusCode = 404; return e; }

// BigInt tutarları insan-okur stringe çevir (örn. 5000n -> "50.00")
function formatShares(shares = []) {
  return shares.map(s => ({
    ...s,
    amount: Money.toDecimalString(s.amount)
  }));
}

export function registerTransactionRoutes({ addRoute, container }) {
  // 1) Yeni işlem oluştur
  addRoute('POST', '/transactions', async (req, res, { transactions, audit }) => {
    const { totalFee, listingAgentId, sellingAgentId, currency = 'GBP' } = req.body || {};
    if (totalFee == null || !listingAgentId || !sellingAgentId) throw badRequest('missing fields');

    const totalFeeCents = Money.fromDecimal(String(totalFee));
    const tx = await transactions.create({
      totalFeeCents, currency, stage: 'AGREEMENT',
      listingAgentId, sellingAgentId
    });
    audit.log('Transaction', 'CREATE', { id: tx.id });

    json(res, 201, { id: tx.id });
  });

  // 2) Aşamayı ilerlet
  addRoute('PATCH', '/transactions/stage', async (req, res, { transactions, workflow, audit }) => {
    const { id, nextStage } = req.body || {};
    if (!id || !nextStage) throw badRequest('missing fields');

    const tx = await transactions.findById(id);
    if (!tx) throw notFound('transaction');
    if (!workflow.canTransition(tx.stage, nextStage)) throw badRequest('invalid transition');

    await transactions.update(id, { stage: nextStage });
    audit.log('Transaction', 'STAGE', { id, from: tx.stage, to: nextStage });

    res.writeHead(204); res.end();
  });

  // 3) İşlemi tamamla (ve komisyonu dağıt)
  addRoute('POST', '/transactions/complete', async (req, res, { transactions, commission }) => {
    const { id } = req.body || {};
    if (!id) throw badRequest('missing id');

    const tx = await transactions.findById(id);
    if (!tx) throw notFound('transaction');

    // Idempotent: zaten tamamlandıysa mevcut kırılımı döndür
    if (tx.stage === 'COMPLETED') {
      const shares = commission.getShares(tx.id) || [];
      return json(res, 200, {
        totalFee: Money.toDecimalString(tx.totalFeeCents),
        shares: formatShares(shares)
      });
    }

    if (tx.stage !== 'TITLE_DEED') throw badRequest('must be at TITLE_DEED before complete');

    await transactions.update(id, { stage: 'COMPLETED', completedAt: new Date().toISOString() });
    const shares = commission.distribute({
      transaction: tx,
      listingAgentId: tx.listingAgentId,
      sellingAgentId: tx.sellingAgentId
    });

    return json(res, 200, {
      totalFee: Money.toDecimalString(tx.totalFeeCents),
      shares: formatShares(shares)
    });
  });

  // 4) Finansal kırılımı getir
  addRoute('GET', '/transactions/breakdown', async (req, res, { reporting }) => {
    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) throw badRequest('missing id');

    const data = await reporting.breakdown(id);
    if (!data) throw notFound('transaction');

    json(res, 200, data);
  });

  addRoute('GET', '/health', async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
  });
}


