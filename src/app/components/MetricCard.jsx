import Tooltip from './Tooltip.jsx';

export default function MetricCard({ label, value, detail, tone = 'default', emphasis = false, hint, delta = null, deltaTone = null }) {
  const accent = tone === 'green' || tone === 'blue' || tone === 'amber' ? 'border-l-2 border-l-accent' : '';
  const deltaColor = deltaTone === 'up' ? 'text-emerald-500' : deltaTone === 'down' ? 'text-red-500' : 'text-muted';
  return <article className={`flex min-h-[108px] flex-col justify-between border border-rule bg-surface p-3 ${accent} ${emphasis ? 'bg-surface-muted' : ''}`}>
    <p className="m-0 text-[12px] text-ink">{hint ? <Tooltip label={label} hint={hint}>{label}</Tooltip> : label}</p>
    <p className="m-0 font-mono text-2xl font-normal tabular-nums tracking-[-0.04em] text-ink sm:text-3xl">{value}</p>
    <div className="flex items-end justify-between gap-2">
      {detail ? <p className="m-0 text-[12px] text-muted">{detail}</p> : <span />}
      {delta != null ? <span className={`whitespace-nowrap font-mono text-[12px] tabular-nums ${deltaColor}`}>{delta}</span> : null}
    </div>
  </article>;
}
