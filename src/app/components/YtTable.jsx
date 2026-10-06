import { HolderName, SortableTh } from './HoldersTable.jsx';
import Tooltip from './Tooltip.jsx';
import { OPTIONAL, TD, TH } from './table-styles.js';
import { formatNumber } from '../data.js';

const date = (ms) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(ms));

// Personal wallets with YT-rkuSOL staked on Exponent, now or before.
export default function YtTable({ rows = [], startRank = 0, sortKey = null, sortDir = 'desc', onSort = () => {}, pointsPerDay = 3, matured = false }) {
  const sortProps = (key) => ({ sortKey: key, onSort, active: sortKey === key, dir: sortDir });
  return <div className="panel mt-4 overflow-x-auto"><table className="w-full border-collapse text-[13px] sm:min-w-[720px]"><caption className="sr-only">YT-rkuSOL staked on Exponent</caption>
    <thead className="label text-left text-muted"><tr>
      <th className={`${TH} w-12 sm:w-16`}>#</th>
      <th className={TH}>Wallet</th>
      <SortableTh label="YT staked" hint="YT-rkuSOL the wallet has staked on Exponent now." {...sortProps('yt')} className="text-right" />
      <SortableTh label="Since" hint="When the wallet first staked YT (UTC)." {...sortProps('firstMs')} className={`text-right ${OPTIONAL}`} />
      <SortableTh label="YT points" hint={`Estimate: ${pointsPerDay} points per staked YT per day, the Raiku boost Exponent lists for YT. Raiku hasn't published how it counts YT.`} {...sortProps('points')} className="text-right" />
      <th className={`${TH} ${OPTIONAL} text-right`}><Tooltip label="Daily" hint="YT points a day at the current stake. YT stops earning when it matures." placement="bottom" align="end" focusable={false} /></th>
    </tr></thead>
    <tbody>{rows.length ? rows.map((r, i) => <tr className="border-t border-rule transition-colors hover:bg-surface-muted" key={r.owner}>
      <td className={`${TD} tabular-nums text-muted`}>{startRank + i + 1}</td>
      <td className={TD}><HolderName row={{ owner: r.owner, isPda: false }} /></td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.yt)}</td>
      <td className={`${TD} ${OPTIONAL} whitespace-nowrap text-right tabular-nums`}>{date(r.firstMs)}</td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.points, { maximumFractionDigits: 0 })}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums text-muted`}>{r.yt > 0 && !matured ? `+${formatNumber(r.yt * pointsPerDay)}` : '—'}</td>
    </tr>) : <tr><td colSpan={6} className="px-4 py-6 text-center text-[13px] text-muted">No wallets match.</td></tr>}</tbody>
  </table></div>;
}
