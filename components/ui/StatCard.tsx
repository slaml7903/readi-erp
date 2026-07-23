interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-white p-4 shadow-[0_1px_2px_rgba(0,55,85,0.04)]">
      <p className="text-sm font-semibold text-[var(--text-secondary)]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--brand-primary)]">{value}</p>
      {description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>}
    </div>
  );
}
