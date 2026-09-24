import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact, formatNumber } from '../data.js';

function shortDate(label) {
  const date = new Date(`${label}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(label);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-rule bg-surface px-3 py-2 text-[12px] shadow-[0_8px_24px_rgb(0_0_0/0.16)]">
    <p className="m-0 text-muted">{shortDate(label)}</p>
    <p className="m-0 mt-0.5 font-medium tabular-nums text-ink">{formatNumber(payload[0].value, { maximumFractionDigits: 0 })} {unit}</p>
  </div>;
}

// Single-series area chart over the snapshot timeline (labels are YYYY-MM-DD).
export default function TrendChart({ data, dataKey, unit, gradientId }) {
  const tick = { fill: 'var(--chart-tick)', fontSize: 11 };
  return <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop className="chart-fill-top" offset="0%" />
          <stop className="chart-fill-bottom" offset="100%" />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
      <XAxis dataKey="label" tickFormatter={shortDate} tick={tick} tickLine={false} axisLine={{ stroke: 'var(--rule)' }} tickMargin={10} minTickGap={48} />
      <YAxis tickFormatter={(value) => formatCompact(value)} tick={tick} tickLine={false} axisLine={false} width={44} tickMargin={6} />
      <Tooltip cursor={{ stroke: 'var(--rule-strong)', strokeWidth: 1 }} content={<ChartTooltip unit={unit} />} />
      <Area type="monotone" dataKey={dataKey} stroke="var(--chart-line)" strokeWidth={2} fill={`url(#${gradientId})`} fillOpacity={1} activeDot={{ r: 4, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={false} />
    </AreaChart>
  </ResponsiveContainer>;
}
