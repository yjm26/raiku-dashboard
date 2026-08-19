export default function MetricCard({ label, value, detail, tone = 'default', emphasis = false }) {
  const accent = tone === 'green' ? 'border-l-4 border-l-[#3458d4]' : tone === 'amber' ? 'border-l-4 border-l-[#111111]' : '';
  return <article className={`flex min-h-[108px] flex-col justify-between border border-rule bg-surface p-3 ${accent} ${emphasis ? 'bg-surface-muted' : ''}`}>
    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
    <p className="m-0 font-mono text-2xl font-bold tabular-nums tracking-[-0.06em] sm:text-3xl">{value}</p>
    {detail ? <p className="m-0 text-[11px] text-muted">{detail}</p> : null}
  </article>;
}
