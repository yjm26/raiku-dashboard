export default function ChartCard({ title, eyebrow, children, className = '' }) {
  return (
    <section className={`insight-card chart-card ${className}`} aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <header className="insight-card__header">
        <div>
          <p className="insight-card__eyebrow">{eyebrow}</p>
          <h2 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h2>
        </div>
      </header>
      <div className="chart-card__body">{children}</div>
    </section>
  );
}
