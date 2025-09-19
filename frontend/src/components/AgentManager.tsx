"use client";

import { useState } from "react";
import type { Agent } from "@/lib/domain";

export default function AgentManager({
  agents,
  onAdd
}: {
  agents: Agent[];
  onAdd: (name: string, email?: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          placeholder="Ad Soyad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          placeholder="E-posta (opsiyonel)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          onClick={() => {
            if (!name) return;
            onAdd(name, email || undefined);
            setName("");
            setEmail("");
          }}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          Ajan Ekle
        </button>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {agents.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-lg border p-2 text-sm"
          >
            <span>{a.name}</span>
            {a.email && <span className="text-gray-500">{a.email}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
