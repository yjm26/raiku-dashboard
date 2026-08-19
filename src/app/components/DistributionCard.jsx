import { formatNumber } from '../data.js';

export default function DistributionCard({ snapshot }) {
  const top = Number(snapshot?.stats?.top10Share || 0);
  const others = Math.max(0, 100 - top);
  return (
    <section className="insight-card distribution-card" aria-labelledby="distribution-title">
      <header className="insight-card__header"><div><p className="insight-card__eyebrow">Concentration</p><h2 id="distribution-title">Holder distribution</h2></div><span className="insight-card__badge">Top 10 vs others</span></header>
      <div className="distribution-card__summary"><strong>{formatNumber(top, { maximumFractionDigits: 1 })}%</strong><span>of supply held by the top 10</span></div>
      <div className="distribution-bar" role="img" aria-label={`${formatNumber(top, { maximumFractionDigits: 1 })}% top ten, ${formatNumber(others, { maximumFractionDigits: 1 })}% others`}><span style={{ width: `${Math.min(100, top)}%` }} /><span style={{ width: `${Math.min(100, others)}%` }} /></div>
      <div className="distribution-legend"><span><i className="legend-dot legend-dot--blue" />Top 10 <b>{formatNumber(top, { maximumFractionDigits: 1 })}%</b></span><span><i className="legend-dot legend-dot--gray" />Others <b>{formatNumber(others, { maximumFractionDigits: 1 })}%</b></span></div>
    </section>
  );
}
