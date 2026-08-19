export default function MetricCard({ label, value, detail, tone = 'default', emphasis = false }) {
  return (
    <article className={`metric-card metric-card--${tone}${emphasis ? ' metric-card--emphasis' : ''}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {detail ? <p className="metric-card__detail">{detail}</p> : null}
    </article>
  );
}
