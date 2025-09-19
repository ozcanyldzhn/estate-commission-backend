export default function EmptyState({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center text-gray-600">
      <h3 className="mb-1 text-base font-medium text-gray-900">{title}</h3>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}
