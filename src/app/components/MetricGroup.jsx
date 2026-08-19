import MetricCard from './MetricCard.jsx';

function MetricSection({ id, title, metrics, className }) {
  return (
    <section className={`metric-section ${className}`} aria-labelledby={id}>
      <div className="metric-section__heading">
        <h2 id={id}>{title}</h2>
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}

export default function MetricGroup({ primary = [], secondary = [] }) {
  return (
    <div className="metric-groups">
      <MetricSection
        id="primary-metrics"
        title="At a glance"
        metrics={primary}
        className="metric-section--primary"
      />
      <MetricSection
        id="secondary-metrics"
        title="More context"
        metrics={secondary}
        className="metric-section--secondary"
      />
    </div>
  );
}
