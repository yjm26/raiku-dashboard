import Sparkline from './Sparkline.jsx';
import Tooltip from './Tooltip.jsx';
import { formatNumber } from '../data.js';

// Latest one-day change; hidden when it rounds to zero.
function Change({ value, digits = 0 }) {
  if (value == null || !Number.isFinite(value)) return null;
  const size = Math.abs(value);
  if (size < 0.5 * 10 ** -digits) return null;
  return <span className="whitespace-nowrap tabular-nums text-muted" title="Change over the latest day on record">
    <span aria-hidden="true">{value > 0 ? '↑' : '↓'} </span><span className="sr-only">{value > 0 ? 'up ' : 'down '}</span>
    {formatNumber(size, { minimumFractionDigits: digits, maximumFractionDigits: digits })}<span className="text-faint"> 1d</span>
  </span>;
}

export default function MetricCard({ label, value, unit = null, detail = null, hint, change = null, changeDigits = 0, trend = [] }) {
  return <article className="flex min-w-0 flex-col bg-surface p-4 sm:p-5">
    <p className="m-0 text-[13px] text-muted">{hint ? <Tooltip label={label} hint={hint} placement="bottom" /> : label}</p>
    <p className="m-0 mt-3 flex flex-wrap items-baseline gap-x-1.5 text-ink">
      <span className="text-[26px] font-semibold leading-none tracking-[-0.035em] sm:text-[34px]">{value}</span>
      {unit ? <span className="text-[13px] font-medium text-muted">{unit}</span> : null}
    </p>
    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px]">
      {detail ? <span className="text-muted">{detail}</span> : <span />}
      <Change value={change} digits={changeDigits} />
    </div>
    <div className="mt-auto pt-5"><Sparkline values={trend} className="h-8 w-full" label={`${label} trend`} /></div>
  </article>;
}
