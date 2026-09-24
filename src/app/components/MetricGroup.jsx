import MetricCard from './MetricCard.jsx';
import Tooltip from './Tooltip.jsx';

export default function MetricGroup({ primary = [], secondary = [] }) {
  return <section aria-label="Key figures">
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule lg:grid-cols-4">
      {primary.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </div>
    <dl className="m-0 mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 lg:px-5">
      {secondary.map((metric) => <div key={metric.label} className="min-w-0">
        <dt className="text-[13px] text-muted">{metric.hint ? <Tooltip label={metric.label} hint={metric.hint} /> : metric.label}</dt>
        <dd className="m-0 mt-1 text-[18px] font-medium tracking-[-0.015em] text-ink">{metric.value}</dd>
      </div>)}
    </dl>
  </section>;
}
