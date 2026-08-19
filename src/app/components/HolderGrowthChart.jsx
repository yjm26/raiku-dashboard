import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { formatNumber } from '../data.js';

export default function HolderGrowthChart({ data = [] }) {
  return (
    <ChartCard title="Holder growth" eyebrow="Real wallets since launch">
      {data.length ? <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <defs><linearGradient id="holderFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#17824b" stopOpacity={0.18} /><stop offset="100%" stopColor="#17824b" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#e9edf4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, { maximumFractionDigits: 0 })} width={42} />
          <Tooltip formatter={(v) => [formatNumber(v, { maximumFractionDigits: 0 }), 'Wallets']} />
          <Area type="monotone" dataKey="holders" stroke="#17824b" strokeWidth={2.5} fill="url(#holderFill)" />
        </AreaChart>
      </ResponsiveContainer> : <div className="chart-empty">No holder timeline available.</div>}
    </ChartCard>
  );
}
