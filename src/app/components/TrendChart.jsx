import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact, formatNumber } from '../data.js';

function shortDate(label) {
  const date = new Date(`${label}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(label);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

const wholeNumber = (value) => formatNumber(value, { maximumFractionDigits: 0 });

function ChartTooltip({ active, payload, label, unit, format }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-rule bg-surface px-3 py-2 text-[12px] shadow-[0_8px_24px_rgb(0_0_0/0.16)]">
    <p className="m-0 text-muted">{shortDate(label)}</p>
    <p className="m-0 mt-0.5 font-medium tabular-nums text-ink">{format(payload[0].value)}{unit ? ` ${unit}` : ''}</p>
  </div>;
}

// Single-series chart over the snapshot timeline (labels are YYYY-MM-DD).
// "area" fills down from zero for counts; "step" is a bare line for rates that change in steps.
export default function TrendChart({ data, dataKey, unit, gradientId, variant = 'area', format = wholeNumber, tickFormat = formatCompact, domain }) {
  const tick = { fill: 'var(--chart-tick)', fontSize: 11 };
  const activeDot = { r: 4, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 };
  const axes = [
    <CartesianGrid key="grid" stroke="var(--chart-grid)" vertical={false} />,
    <XAxis key="x" dataKey="label" tickFormatter={shortDate} tick={tick} tickLine={false} axisLine={{ stroke: 'var(--rule)' }} tickMargin={10} minTickGap={48} />,
    <YAxis key="y" tickFormatter={tickFormat} domain={domain} tick={tick} tickLine={false} axisLine={false} width={44} tickMargin={6} />,
    <Tooltip key="tip" cursor={{ stroke: 'var(--rule-strong)', strokeWidth: 1 }} content={<ChartTooltip unit={unit} format={format} />} />,
  ];
  return <ResponsiveContainer width="100%" height={240}>
    {variant === 'step'
      ? <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {axes}
        <Line type="stepAfter" dataKey={dataKey} stroke="var(--chart-line)" strokeWidth={2} dot={false} activeDot={activeDot} isAnimationActive={false} />
      </LineChart>
      : <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop className="chart-fill-top" offset="0%" />
            <stop className="chart-fill-bottom" offset="100%" />
          </linearGradient>
        </defs>
        {axes}
        <Area type="monotone" dataKey={dataKey} stroke="var(--chart-line)" strokeWidth={2} fill={`url(#${gradientId})`} fillOpacity={1} activeDot={activeDot} isAnimationActive={false} />
      </AreaChart>}
  </ResponsiveContainer>;
}
