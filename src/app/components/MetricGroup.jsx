import MetricCard from './MetricCard.jsx';

function MetricSection({ id, title, metrics }) {
  return <section aria-labelledby={id}><div className="mb-2 flex min-h-9 items-center border-b border-rule px-2 py-2"><h2 id={id} className="m-0 text-[15px] font-normal text-[#333]">{title}</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div></section>;
}
export default function MetricGroup({ primary = [], secondary = [] }) { return <div className="grid gap-5"> <MetricSection id="primary-metrics" title="Snapshot" metrics={primary} /><MetricSection id="secondary-metrics" title="Performance" metrics={secondary} /></div>; }
