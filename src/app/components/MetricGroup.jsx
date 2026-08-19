import MetricCard from './MetricCard.jsx';

function MetricSection({ id, title, metrics }) {
  return <section aria-labelledby={id}><div className="mb-2 flex items-center justify-between border-b-2 border-rule bg-surface-muted px-2 py-2"><h2 id={id} className="m-0 text-sm font-bold uppercase tracking-[0.08em]">{title}</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div></section>;
}
export default function MetricGroup({ primary = [], secondary = [] }) { return <div className="grid gap-4"> <MetricSection id="primary-metrics" title="Snapshot" metrics={primary} /><MetricSection id="secondary-metrics" title="Performance" metrics={secondary} /></div>; }
