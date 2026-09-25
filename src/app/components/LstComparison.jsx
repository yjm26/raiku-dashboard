import ExternalLink from './ExternalLink.jsx';
import SectionHeader from './SectionHeader.jsx';
import Tooltip from './Tooltip.jsx';
import { OPTIONAL, TD, TH } from './table-styles.js';
import { formatAddress, formatCompact, formatNumber } from '../data.js';

const pct = (value) => (value == null ? '—' : `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);

// rkuSOL next to the largest stake-pool LSTs; every figure comes from the tokens' pool accounts.
export default function LstComparison({ comparison, mint }) {
  const rows = comparison?.rows || [];
  if (!rows.length) return null;
  const epochs = [...new Set(rows.map((row) => row.epoch).filter((epoch) => epoch != null))];
  const hours = epochs.length === 1 ? comparison.epochSeconds?.[epochs[0]] / 3600 : null;
  const measured = epochs.length === 1
    ? `in epoch ${epochs[0]}${hours ? ` (${formatNumber(hours, { maximumFractionDigits: 0 })} hours)` : ''}`
    : 'over its last epoch';
  const top = Math.max(...rows.map((row) => row.apyPct ?? 0));

  return <section className="mt-14" aria-labelledby="lst-title">
    <SectionHeader id="lst-title" title="Compared with other LSTs" aside="The five largest stake-pool LSTs by SOL staked, read from each token's pool account" />
    <div className="panel overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">rkuSOL compared with the largest stake-pool LSTs</caption>
        <thead className="text-left text-[12px] text-muted"><tr>
          <th className={`${TH} w-12 sm:w-16`}><Tooltip label="#" hint="Rank by SOL staked among all stake pools on the SPL stake-pool programs, read on-chain." placement="bottom" /></th>
          <th className={TH}>Token</th>
          <th className={`${TH} text-right`}>SOL staked</th>
          <th className={`${TH} ${OPTIONAL} text-right`}><Tooltip label="Fee" hint="Share of staking rewards the pool keeps. The APY is already after it." placement="bottom" align="end" /></th>
          <th className={`${TH} ${OPTIONAL} w-[28%]`}><span className="sr-only">APY bar</span></th>
          <th className={`${TH} text-right`}><Tooltip label="APY" hint={`Growth of each token's SOL rate ${measured}, annualized. It counts what reaches the rate: staking rewards and MEV, after the pool's fee. Points and other incentives aren't included.`} placement="bottom" align="end" /></th>
        </tr></thead>
        <tbody>{rows.map((row) => {
          const own = row.mint === mint;
          return <tr key={row.mint} className={`border-t border-rule ${own ? 'bg-accent-soft' : ''}`}>
            <td className={`${TD} tabular-nums text-muted`}>{row.rank}</td>
            <td className={TD}>
              <span className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
                <ExternalLink href={`https://solscan.io/token/${row.mint}`} icon={false} className={`font-medium text-ink underline-offset-4 hover:underline ${row.symbol ? '' : 'font-mono'}`}>{row.symbol ?? formatAddress(row.mint)}</ExternalLink>
                {row.name ? <span className="hidden truncate text-muted sm:inline">{row.name}</span> : null}
              </span>
            </td>
            <td className={`${TD} text-right tabular-nums`}>{formatCompact(row.tvlSol, 2)}</td>
            <td className={`${TD} ${OPTIONAL} text-right tabular-nums`}>{formatNumber(row.feePct, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%</td>
            <td className={`${TD} ${OPTIONAL}`} aria-hidden="true">
              {row.apyPct > 0 ? <span className="block h-1.5 rounded-full" style={{ width: `${row.apyPct / top * 100}%`, background: own ? 'var(--chart-line)' : 'var(--seg-rest)' }} /> : null}
            </td>
            <td className={`${TD} text-right tabular-nums ${own ? 'font-semibold text-ink' : 'text-ink'}`}>{pct(row.apyPct)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="m-0 mt-3 text-[12px] text-muted">One epoch&apos;s APY moves from epoch to epoch, so small gaps can flip. mSOL and INF run on other programs and aren&apos;t included.</p>
  </section>;
}
