export default function Badge({
  children,
  tone = "gray"
}: {
  children: React.ReactNode;
  tone?: "gray" | "blue" | "green" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
