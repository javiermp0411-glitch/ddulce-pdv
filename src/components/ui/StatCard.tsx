interface StatCardProps {
  label: string;
  value: string;
  change: string;
  hint: string;
  icon: string;
  tone: string;
}

export function StatCard({ label, value, change, hint, icon, tone }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`} aria-hidden="true">{icon}</span>
      </div>
      <strong>{value}</strong>
      <div className="stat-bottom">
        <span className="stat-change">{change}</span>
        <span>{hint}</span>
      </div>
    </article>
  );
}
