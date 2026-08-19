import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { formatNumber } from '../data.js';

export default function PointsAccrualChart({ data = [] }) {
  return (
    <ChartCard title="Points accrual" eyebrow="Cumulative estimate">
      {data.length ? <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <defs><linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#315efb" stopOpacity={0.2} /><stop offset="100%" stopColor="#315efb" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#e9edf4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#667085', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, { maximumFractionDigits: 0 })} width={58} />
          <Tooltip formatter={(v) => [formatNumber(v, { maximumFractionDigits: 0 }), 'Points']} labelFormatter={(v) => v} />
          <Area type="monotone" dataKey="points" stroke="#315efb" strokeWidth={2.5} fill="url(#pointsFill)" />
        </AreaChart>
      </ResponsiveContainer> : <div className="chart-empty">No points timeline available.</div>}
    </ChartCard>
  );
}
