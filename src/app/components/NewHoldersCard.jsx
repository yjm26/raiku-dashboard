import { formatAddress, formatNumber } from '../data.js';

function date(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d); }
export default function NewHoldersCard({ rows = [] }) {
  return <section className="insight-card mini-table-card" aria-labelledby="new-holders-title"><header className="insight-card__header"><div><p className="insight-card__eyebrow">Recent cohort</p><h2 id="new-holders-title">New holders</h2></div><span className="insight-card__badge">{rows.length} in 7d</span></header><div className="mini-table">{rows.slice(0, 5).map((row) => <div className="mini-row" key={row.owner}><span className="mini-address mono">{formatAddress(row.owner)}</span><span className="mini-value">{formatNumber(row.amount)}</span><span className="mini-date">{date(row.firstMs)}</span></div>)}</div></section>;
}
