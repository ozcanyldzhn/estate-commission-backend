"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api"; // aşağıdaki api.ts örneğine göre export edilmiş olmalı
import AgentEarningsModal from "@/components/AgentEarningsModal";

type Agent = { id: string; name?: string; email?: string };

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name?: string } | null>(null);

  async function fetchAgents() {
    try {
      const res = await api.get("/users", { params: { page: 1, pageSize: 100 } });
      const raw = res.data;
      const items: any[] = raw?.data?.items ?? raw?.items ?? (Array.isArray(raw) ? raw : []);
      setAgents(items.map((u: any) => ({ id: u.id, name: u.name ?? u.email ?? u.id, email: u.email })));
    } catch (e) {
      console.error("list users failed", e);
      setAgents([]); // mock’a düşME – boş göster
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email && !name) return;
    try {
      const body = { email: email || `${crypto.randomUUID()}@example.com`, name: name || undefined };
      const res = await api.post("/users", body);
      // Başarılıysa listeyi tazele
      if (res.data?.success) {
        await fetchAgents();
        setName("");
        setEmail("");
      } else {
        alert("Ajan eklenemedi");
      }
    } catch (e) {
      console.error("create user failed", e);
      alert("Ajan ekleme sırasında hata oluştu.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ajanlar</h1>

      <form onSubmit={onCreate} className="space-y-3 rounded-2xl border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Ad Soyad (Zorunlu)</label>
            <input
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ajan adı"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">E-posta (Zorunlu)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2"
              placeholder="agent@example.com"
            />
          </div>
        </div>
        <button className="rounded-xl bg-black px-4 py-2 text-white" disabled={!email || !name.trim().length}>Ajan Ekle</button>
      </form>

      <div className="rounded-2xl border bg-white">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3 w-1/3">ID</th>
              <th className="p-3 w-1/3">Ad</th>
              <th className="p-3 w-1/3">E-posta</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Kayıt yok
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer border-b last:border-none hover:bg-gray-50"
                  onClick={() => { setSelected({ id: a.id, name: a.name }); setModalOpen(true); }}
                >
                  <td className="p-3 font-mono">{a.id}</td>
                  <td className="p-3">{a.name || "-"}</td>
                  <td className="p-3">{a.email || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AgentEarningsModal
        agentId={selected?.id ?? null}
        agentName={selected?.name}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        // İstersen zaman aralığını burada sabitleyebilir ya da UI ekleyebilirsin
        // from="2025-01-01"
        // to="2025-12-31"
      />
    </div>
  );
}
