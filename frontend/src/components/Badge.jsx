const styles = {
  sent: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-400 border border-red-500/30',
  running: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  draft: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  stopped: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  unsubscribed: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
};

export default function Badge({ status = 'draft' }) {
  const normalized = String(status).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[normalized] || styles.draft
      }`}
    >
      {normalized}
    </span>
  );
}
