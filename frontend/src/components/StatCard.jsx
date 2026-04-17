export default function StatCard({ icon, label, value, trend = '+0%' }) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-xl bg-app-accent/20 p-2 text-app-accent">{icon}</span>
        <span className="rounded-full border border-app-border bg-black/20 px-2 py-0.5 text-xs text-app-muted">
          {trend}
        </span>
      </div>
      <p className="text-xs uppercase tracking-widest text-app-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-app-text">{value}</p>
    </div>
  );
}
