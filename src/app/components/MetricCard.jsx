export default function MetricCard({ label, value, detail, tone = 'default', emphasis = false }) {
  const accent = tone === 'green' ? 'border-l-2 border-l-accent' : tone === 'amber' ? 'border-l-2 border-l-[#b0a99a]' : '';
  return <article className={`flex min-h-[108px] flex-col justify-between border border-rule bg-surface p-3 ${accent} ${emphasis ? 'bg-surface-muted' : ''}`}>
    <p className="m-0 text-[10px] font-normal text-[#3c3c3c]">{label}</p>
    <p className="m-0 font-mono text-2xl font-normal tabular-nums tracking-[-0.04em] text-[#222] sm:text-3xl">{value}</p>
    {detail ? <p className="m-0 text-[10px] text-muted">{detail}</p> : null}
  </article>;
}
