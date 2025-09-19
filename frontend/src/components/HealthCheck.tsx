"use client";
import { useEffect, useState } from "react";

export default function HealthCheck() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then(async (r) => {
        const t = await r.text();
        try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled) setError(String(e?.message || e)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 text-sm font-medium">Client Health (Browser Fetch)</div>
      {error ? (
        <pre className="overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</pre>
      ) : (
        <pre className="overflow-auto rounded-lg bg-gray-50 p-3 text-xs">{JSON.stringify(data ?? { loading: true }, null, 2)}</pre>
      )}
      <div className="mt-2 text-xs text-gray-500">Bu kutu tarayıcıdan /api/health çağrısı yapar.</div>
    </div>
  );
}


