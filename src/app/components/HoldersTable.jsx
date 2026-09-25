import ExternalLink from './ExternalLink.jsx';
import Tooltip from './Tooltip.jsx';
import { OPTIONAL, TD, TH } from './table-styles.js';
import { formatAddress, formatNumber } from '../data.js';

const SortArrow = ({ active, dir }) => (
  <span className={`ml-1 inline-block w-2.5 ${active ? 'text-ink' : 'text-faint'}`} aria-hidden="true">{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
);

export function SortableTh({ label, sortKey, onSort, active, dir, hint, className = '' }) {
  return (
    <th className={`${TH} ${className}`} aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center font-medium transition-colors hover:text-ink">
        {hint ? <Tooltip label={label} hint={hint} placement="bottom" align="end" focusable={false} /> : label}<SortArrow active={active} dir={dir} />
      </button>
    </th>
  );
}

export function HolderName({ row }) {
  if (!row.isPda) return <ExternalLink href={`https://solscan.io/account/${row.owner}`} icon={false} className="whitespace-nowrap font-mono text-ink underline-offset-4 hover:underline">{formatAddress(row.owner)}</ExternalLink>;
  return <span className="inline-flex items-center gap-2 whitespace-nowrap">
    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--seg-pool)]" aria-hidden="true" />
    <ExternalLink href={`https://solscan.io/account/${row.owner}`} icon={false} className="text-ink underline-offset-4 hover:underline">{row.pdaLabel || 'Pool or program'}</ExternalLink>
  </span>;
}

export default function HoldersTable({ rows = [], startRank = 0, sortKey = null, sortDir = 'desc', onSort = () => {} }) {
  const sortProps = (key) => ({ sortKey: key, onSort, active: sortKey === key, dir: sortDir });
  return <div className="panel mt-4 overflow-x-auto"><table className="w-full border-collapse text-[13px] sm:min-w-[720px]"><caption className="sr-only">All rkuSOL holders</caption>
    <thead className="text-left text-[12px] text-muted"><tr>
      <SortableTh label="#" {...sortProps('rank')} className="w-12 sm:w-16" />
      <th className={TH}>Wallet</th>
      <SortableTh label="rkuSOL" {...sortProps('amount')} className="text-right" />
      <SortableTh label="Share" {...sortProps('sharePct')} className={`text-right ${OPTIONAL}`} />
      <SortableTh label="Days held" hint="Days the wallet has held rkuSOL, from its on-chain history. Gaps when it held none don't count." {...sortProps('daysHeld')} className={`text-right ${OPTIONAL}`} />
      <SortableTh label="Points" {...sortProps('score')} className="text-right" />
    </tr></thead>
    <tbody>{rows.map((r, i) => <tr className="border-t border-rule transition-colors hover:bg-surface-muted" key={r.owner}>
      <td className={`${TD} tabular-nums text-muted`}>{startRank + i + 1}</td>
      <td className={TD}><HolderName row={r} /></td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.amount)}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(r.sharePct, { maximumFractionDigits: 2 })}%</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(r.daysHeld, { maximumFractionDigits: 1 })}</td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.score, { maximumFractionDigits: 0 })}</td>
    </tr>)}</tbody>
  </table></div>;
}
