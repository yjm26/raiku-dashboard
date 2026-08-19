import { formatAddress, formatNumber } from '../data.js';

export default function TopHoldersCard({ rows = [] }) {
  return <section className="insight-card mini-table-card" aria-labelledby="top-holders-title"><header className="insight-card__header"><div><p className="insight-card__eyebrow">Distribution</p><h2 id="top-holders-title">Top holders</h2></div><span className="insight-card__badge">By balance</span></header><div className="mini-table">{rows.slice(0, 5).map((row) => <div className="mini-row" key={row.owner}><span className="rank">{row.rank}</span><span className="mini-address mono">{formatAddress(row.owner)}</span><span className="mini-value">{formatNumber(row.amount)}</span></div>)}</div></section>;
}
