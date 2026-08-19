import { useEffect, useState } from 'react';
import { formatNumber } from '../data.js';

// LST comparison table — APY + TVL from DefiLlama yields API (client-side fetch).
// rkuSOL row is computed from the live snapshot.
const LST_MAP = [
  { id: 'jito-liquid-staking', symbol: 'jitoSOL' },
  { id: 'jupiter-staked-sol', symbol: 'jupSOL' },
  { id: 'marinade-liquid-staking', symbol: 'mSOL' },
  { id: 'sanctum-infinity', symbol: 'INF' },
  { id: 'blazestake', symbol: 'bSOL' },
  { id: 'bonk-staked-sol', symbol: 'BONKSOL' },
  { id: 'helius-staked-sol', symbol: 'hSOL' },
  { id: 'bybit-staked-sol', symbol: 'BBSOL' },
];

export default function LstCompare({ snapshot }) {
  const stats = snapshot?.stats || {};
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('https://yields.llama.fi/pools')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const pools = d?.data || [];
        const result = [];
        for (const lst of LST_MAP) {
          const best = pools
            .filter((p) => p.project === lst.id && (p.symbol || '').toLowerCase() === lst.symbol.toLowerCase())
            .sort((a, b) => (b.apy || 0) - (a.apy || 0))[0];
          if (best) {
            result.push({
              symbol: lst.symbol,
              project: lst.id.replace(/-/g, ' '),
              apy: best.apy || 0,
              tvlUsd: best.tvlUsd || 0,
            });
          }
        }
        // rkuSOL row from snapshot
        const apy = Number(stats.apyPct);
        const tvlSol = Number(stats.tvlSol);
        result.push({
          symbol: 'rkuSOL',
          project: 'Raiku',
          apy: Number.isFinite(apy) ? apy : null,
          tvlUsd: Number.isFinite(tvlSol) && Number.isFinite(Number(stats.solPriceUsd)) ? tvlSol * Number(stats.solPriceUsd) : null,
          isOurs: true,
        });
        result.sort((a, b) => (b.apy ?? -1) - (a.apy ?? -1));
        setRows(result);
        setStatus('ok');
      })
      .catch(() => { setStatus('error'); });
    return () => { cancelled = true; };
  }, [stats.apyPct, stats.tvlSol, stats.solPriceUsd]);

  return (
    <section className="mt-4 border border-rule bg-surface" aria-labelledby="lst-compare-title">
      <header className="flex items-center justify-between border-b border-rule bg-surface-muted px-4 py-3">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Liquid staking</p>
          <h2 id="lst-compare-title" className="m-0 mt-0.5 font-serif text-[17px] font-normal text-ink">LST comparison</h2>
        </div>
        {status === 'loading' ? <span className="font-mono text-[12px] text-muted">loading…</span> : status === 'error' ? <span className="font-mono text-[12px] text-muted">offline</span> : <span className="hidden font-mono text-[12px] text-muted sm:block">via DefiLlama</span>}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[13px]">
          <thead className="bg-surface-muted text-left font-mono text-[12px] uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">LST</th>
              <th className="px-4 py-2.5 text-right">APY</th>
              <th className="px-4 py-2.5 text-right">TVL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className={`border-t border-rule ${r.isOurs ? 'bg-surface-muted' : ''}`}>
                <td className="px-4 py-2.5">
                  <span className="font-mono font-medium text-ink">{r.symbol}</span>
                  {r.isOurs ? <span className="ml-2 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] uppercase text-page">this project</span> : null}
                  <span className="ml-2 text-[12px] text-muted">{r.project}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {r.apy == null ? '—' : <span className={r.isOurs ? 'font-semibold text-ink' : ''}>{formatNumber(r.apy, { maximumFractionDigits: 2 })}%</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted">
                  {r.tvlUsd == null ? '—' : `$${formatNumber(r.tvlUsd / 1e6, { maximumFractionDigits: 1 })}M`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-0 border-t border-rule px-4 py-2 text-[12px] text-muted">APY &amp; TVL from DefiLlama yields API. rkuSOL from live snapshot. Comparisons are indicative, not financial advice.</p>
    </section>
  );
}
