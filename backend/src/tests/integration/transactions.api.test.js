import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { startServer } from '../../app/server.js';
import { createContainer } from '../../app/di.js';

// tiny helper to request
function req(port, method, path, body){
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const r = http.request({
      hostname: '127.0.0.1', port, path, method,
      headers: data ? {'Content-Type':'application/json','Content-Length':data.length} : {}
    }, res => {
      let buf=''; res.on('data', c=> buf+=c);
      res.on('end', ()=> {
        const json = buf ? JSON.parse(buf) : null;
        resolve({ status: res.statusCode, body: json });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

test('end-to-end transaction flow', async (t) => {
  const server = startServer({ port: 0, container: createContainer() });
  const port = server.address().port;
  t.after(() => server.close());

  // 1) Create
  const createRes = await req(port, 'POST', '/transactions', {
    totalFee: '100.00', listingAgentId: 'a1', sellingAgentId: 'a2', currency: 'GBP'
  });
  assert.strictEqual(createRes.status, 201);
  const txId = createRes.body.id;
  assert.ok(txId);

  // 2) Stage to EARNEST
  const s1 = await req(port, 'PATCH', '/transactions/stage', { id: txId, nextStage: 'EARNEST' });
  assert.strictEqual(s1.status, 204);

  // 3) Stage to TITLE_DEED
  const s2 = await req(port, 'PATCH', '/transactions/stage', { id: txId, nextStage: 'TITLE_DEED' });
  assert.strictEqual(s2.status, 204);

  // 4) Complete (distribute commissions)
  const comp = await req(port, 'POST', '/transactions/complete', { id: txId });
  assert.strictEqual(comp.status, 200);
  assert.strictEqual(comp.body.totalFee, '100.00');
  // agency 50, agents 25/25
  const agency = comp.body.shares.find(s=>s.type==='AGENCY');
  const agents = comp.body.shares.filter(s=>s.type==='AGENT');
  assert.strictEqual(agency.percent, 50);
  assert.strictEqual(agents.length, 2);

  // 5) Breakdown
  const bd = await req(port, 'GET', `/transactions/breakdown?id=${txId}`);
  assert.strictEqual(bd.status, 200);
  assert.strictEqual(bd.body.totalFee, '100.00');
});
