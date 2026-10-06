import MetricCard from './MetricCard.jsx';
import Tooltip from './Tooltip.jsx';

export default function MetricGroup({ primary = [], secondary = [] }) {
  return <section aria-label="Key figures">
    <div className="crop grid grid-cols-2 gap-px border border-rule-strong bg-rule lg:grid-cols-4">
      {primary.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </div>
    <dl className="m-0 mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
      {secondary.map((metric) => <div key={metric.label} className="min-w-0">
        <dt className="label">{metric.hint ? <Tooltip label={metric.label} hint={metric.hint} /> : metric.label}</dt>
        <dd className="m-0 mt-1.5 text-[20px] font-medium tracking-[-0.012em] text-ink">{metric.value}</dd>
      </div>)}
    </dl>
  </section>;
}
