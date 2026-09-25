import SectionHeader from './SectionHeader.jsx';
import TrendChart from './TrendChart.jsx';
import { EmptyChart } from './ChartCard.jsx';
import { apySeries, formatNumber } from '../data.js';

const pct = (value) => `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const tickPct = (value) => `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export default function ApyHistory({ history = [] }) {
  const data = apySeries(history);
  const latest = data.at(-1)?.apy;
  const average = data.length ? data.reduce((sum, point) => sum + point.apy, 0) / data.length : null;
  const figures = [['Latest', latest], [`${data.length}-day average`, average]];

  return <section className="mt-14" aria-labelledby="apy-history-title">
    <SectionHeader id="apy-history-title" title="APY history" aside="Daily APY reported by the Raiku staking API" />
    <div className="panel p-4 sm:p-5">
      <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3">
        {figures.map(([label, value]) => <div key={label}>
          <dt className="text-[13px] text-muted">{label}</dt>
          <dd className="m-0 mt-1 text-[20px] font-semibold tracking-[-0.02em] text-ink">{value == null ? '—' : pct(value)}</dd>
        </div>)}
      </dl>
      <div className="mt-5">
        {data.length > 1 ? <TrendChart data={data} dataKey="apy" variant="step" format={pct} tickFormat={tickPct} domain={['auto', 'auto']} /> : <EmptyChart />}
      </div>
    </div>
  </section>;
}
