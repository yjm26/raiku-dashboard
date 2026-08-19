import ExternalLink from './ExternalLink.jsx';
import Tooltip from './Tooltip.jsx';
import { formatAddress, formatNumber } from '../data.js';

const SortArrow = ({ active, dir }) => (
  <span className={`ml-1 inline-block ${active ? 'text-ink' : 'text-muted opacity-40'}`} aria-hidden="true">{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
);

function SortableTh({ label, sortKey, onSort, active, dir, hint, className = '' }) {
  const content = hint ? <Tooltip label={label} hint={hint}>{label}</Tooltip> : label;
  return (
    <th className={`${className} cursor-pointer select-none`} onClick={() => onSort(sortKey)} aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
      {content}<SortArrow active={active} dir={dir} />
    </th>
  );
}

export default function HoldersTable({ rows = [], startRank = 0, sortKey = null, sortDir = 'desc', onSort = () => {} }) {
  return <div className="mt-2 overflow-x-auto border border-rule bg-surface"><table className="w-full min-w-[760px] border-collapse text-[13px]"><caption className="sr-only">All rkuSOL holders</caption><thead className="bg-surface-muted text-left font-mono text-[12px] uppercase text-muted"><tr>
    <th className="px-3 py-3" onClick={() => onSort('rank')}>#<SortArrow active={sortKey === 'rank'} dir={sortDir} /></th>
    <th className="px-3 py-3">Wallet</th>
    <th className="px-3 py-3">Type</th>
    <SortableTh label="rkuSOL" sortKey="amount" onSort={onSort} active={sortKey === 'amount'} dir={sortDir} className="text-right" />
    <SortableTh label="Share" sortKey="sharePct" onSort={onSort} active={sortKey === 'sharePct'} dir={sortDir} className="text-right" />
    <SortableTh label="Days" hint="Days since the wallet first acquired rkuSOL (first on-chain acquisition). Fractional days include hours." sortKey="daysHeld" onSort={onSort} active={sortKey === 'daysHeld'} dir={sortDir} className="text-right" />
    <SortableTh label="Points" sortKey="score" onSort={onSort} active={sortKey === 'score'} dir={sortDir} className="text-right" />
  </tr></thead><tbody>{rows.map((r, i) => <tr className="border-t border-rule" key={r.owner}><td className="px-3 py-3 font-mono text-muted">{startRank + i + 1}</td><td className="px-3 py-3"><ExternalLink href={`https://solscan.io/account/${r.owner}`}><span className="font-mono text-ink underline underline-offset-4">{formatAddress(r.owner)}</span></ExternalLink></td><td className="px-3 py-3 text-muted">{r.isPda ? r.pdaLabel || 'Pool / program' : 'Wallet'}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatNumber(r.amount)}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatNumber(r.sharePct, { maximumFractionDigits: 2 })}%</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatNumber(r.daysHeld, { maximumFractionDigits: 1 })}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatNumber(r.score, { maximumFractionDigits: 0 })}</td></tr>)}</tbody></table></div>;
}
