import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { formatNumber } from '../data.js';

function formatDate(value) {
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
}

function pct(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${formatNumber(Number(value) * 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export default function ApyTvlCharts({ history = [] }) {
  const data = history.map((h) => ({
    label: formatDate(h.date),
    apy: h.apy == null ? null : Number(h.apy) * 100,
    avgApy: h.avgApy == null ? null : Number(h.avgApy) * 100,
    tvlSol: h.tvlSol == null ? null : Number(h.tvlSol),
  }));

  return (
    <section className="mt-3 grid gap-3 lg:grid-cols-2" aria-label="APY and TVL history">
      <ChartCard title="APY history" eyebrow="daily">
        {data.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--chart-axis)' }} minTickGap={24} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--chart-axis)' }} tickFormatter={(v) => `${v}%`} width={42} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)', fontSize: 11 }} formatter={(v, name) => [pct(v), name === 'apy' ? 'APY' : 'Avg APY']} />
              <Line type="monotone" dataKey="apy" stroke="var(--chart-points)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgApy" stroke="var(--chart-axis)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="font-serif text-[12px] text-muted" role="status">Recording daily points…</div>
        )}
      </ChartCard>

      <ChartCard title="TVL history" eyebrow="SOL">
        {data.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="raiku-tvl-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop className="raiku-gradient-stop" offset="0%" stopOpacity={0.34} />
                  <stop className="raiku-gradient-stop" offset="100%" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--chart-axis)' }} minTickGap={24} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--chart-axis)' }} tickFormatter={(v) => `${formatNumber(v, { maximumFractionDigits: 0 })}`} width={48} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)', fontSize: 11 }} formatter={(v) => [`${formatNumber(v, { maximumFractionDigits: 0 })} SOL`, 'TVL']} />
              <Area type="monotone" dataKey="tvlSol" stroke="var(--chart-points)" strokeWidth={2} fill="url(#raiku-tvl-gradient)" fillOpacity={1} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="font-serif text-[12px] text-muted" role="status">Recording daily points…</div>
        )}
      </ChartCard>
    </section>
  );
}
