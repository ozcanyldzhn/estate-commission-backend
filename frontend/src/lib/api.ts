import axios from "axios";
import type { Transaction, Agent, TxStatus } from "@/lib/domain";

// Tüm istekler Next.js proxy'si üzerinden gider; proxy de BACKEND_URL'e yönlendirir.
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// transactions
export async function listTransactions() {
  const { data } = await api.get(`/transactions`, { headers: { "Cache-Control": "no-store" } });
  return data;
}

export async function createTransaction(input: any) {
  const { data } = await api.post(`/transactions`, input);
  return data;
}

export async function advanceTransaction(id: string) {
  const { data } = await api.post(`/transactions/${id}/advance`);
  return data;
}

// optional helpers
export async function listAgents(): Promise<Agent[]> {
  const { data } = await api.get(`/agents`, { headers: { "Cache-Control": "no-store" } });
  return data;
}

export async function listUsers(params?: { page?: number; pageSize?: number }) {
  const { data } = await api.get(`/users`, { params });
  return data;
}

export async function createUser(body: any) {
  return (await api.post("/users", body)).data;
}

// agent earnings
export async function getAgentEarnings(agentId: string, from?: string, to?: string) {
  const params: any = {}
  if (from) params.from = from
  if (to)   params.to = to
  const { data } = await api.get(`/agents/${agentId}/earnings`, { params })
  return data
}

export default api;