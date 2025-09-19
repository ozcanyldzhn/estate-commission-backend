import type { Agent } from "@/lib/domain";

export default function AgentPicker({
  agents,
  value,
  onChange
}: {
  agents: Agent[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2"
    >
      <option value="">Ajan seçin</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
