import { HolderName, SortableTh } from './HoldersTable.jsx';
import { OPTIONAL, TD, TH } from './table-styles.js';
import { formatNumber } from '../data.js';

const date = (ms) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(ms));

export default function FormerHoldersTable({ rows = [], startRank = 0, sortKey = null, sortDir = 'desc', onSort = () => {} }) {
  const sortProps = (key) => ({ sortKey: key, onSort, active: sortKey === key, dir: sortDir });
  return <div className="panel mt-4 overflow-x-auto"><table className="w-full border-collapse text-[13px] sm:min-w-[720px]"><caption className="sr-only">Former rkuSOL holders</caption>
    <thead className="text-left text-[12px] text-muted"><tr>
      <th className={`${TH} w-12 sm:w-16`}>#</th>
      <th className={TH}>Wallet</th>
      <SortableTh label="Points earned" hint="1 point per rkuSOL per day while the wallet held it. It stopped growing once the wallet sold out." {...sortProps('points')} className="text-right" />
      <SortableTh label="Days held" hint="Total days the wallet held any rkuSOL." {...sortProps('daysHeld')} className={`text-right ${OPTIONAL}`} />
      <SortableTh label="Peak balance" hint="The most rkuSOL the wallet held at one time." {...sortProps('peak')} className={`text-right ${OPTIONAL}`} />
      <SortableTh label="Left on" hint="When the wallet's rkuSOL balance last went to zero (UTC)." {...sortProps('exitMs')} className="text-right" />
    </tr></thead>
    <tbody>{rows.length ? rows.map((r, i) => <tr className="border-t border-rule transition-colors hover:bg-surface-muted" key={r.owner}>
      <td className={`${TD} tabular-nums text-muted`}>{startRank + i + 1}</td>
      <td className={TD}><HolderName row={r} /></td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.points, { maximumFractionDigits: 0 })}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(r.daysHeld, { maximumFractionDigits: 1 })}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(r.peak)}</td>
      <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{date(r.exitMs)}</td>
    </tr>) : <tr><td colSpan={6} className="px-4 py-6 text-center text-[13px] text-muted">No former holders match.</td></tr>}</tbody>
  </table></div>;
}
