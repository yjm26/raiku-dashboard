import Tooltip from './Tooltip.jsx';
import { HolderName } from './HoldersTable.jsx';
import { OPTIONAL, TD, TH } from './table-styles.js';
import { formatNumber } from '../data.js';

export default function PointsTable({ rows = [], startRank = 0, exact = false }) {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const hint = (label, text) => <Tooltip label={label} hint={text} placement="bottom" align="end" />;
  return <div className="panel mt-4 overflow-x-auto"><table className="w-full border-collapse text-[13px] sm:min-w-[680px]"><caption className="sr-only">Estimated points leaderboard</caption>
    <thead className="text-left text-[12px] text-muted"><tr>
      <th className={`${TH} w-12 sm:w-16`}>#</th>
      <th className={TH}>Wallet</th>
      <th className={`${TH} text-right`}>Balance</th>
      <th className={`${TH} ${OPTIONAL} text-right`}>{hint('Days held', "Days the wallet has held rkuSOL, from its on-chain history. Gaps when it held none don't count.")}</th>
      <th className={`${TH} text-right`}>{hint('Estimated points', exact ? "1 point per rkuSOL per day, counted from the wallet's actual balance each day. An estimate, not an official Raiku figure." : 'Balance × days held. An analytical estimate, not an official Raiku figure.')}</th>
      <th className={`${TH} ${OPTIONAL} text-right`}>{hint('Daily', 'Points this wallet earns per day at its current balance (1 rkuSOL = 1 point/day).')}</th>
    </tr></thead>
    <tbody>{sorted.map((r, i) => <tr className="border-t border-rule transition-colors hover:bg-surface-muted" key={r.owner}>
      <td className={`${TD} tabular-nums text-muted`}>{startRank + i + 1}</td>
      <td className={TD}>
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <HolderName row={r} />
          {r.exitMs ? <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-muted" title="Sold out; keeps the points it earned">left</span> : null}
        </span>
      </td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.amount)}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(r.daysHeld, { maximumFractionDigits: 1 })}</td>
      <td className={`${TD} text-right tabular-nums`}>{formatNumber(r.score, { maximumFractionDigits: 0 })}</td>
      <td className={`${TD} ${OPTIONAL} text-right tabular-nums text-muted`}>{r.exitMs ? '—' : `+${formatNumber(r.amount)}`}</td>
    </tr>)}</tbody>
  </table></div>;
}
