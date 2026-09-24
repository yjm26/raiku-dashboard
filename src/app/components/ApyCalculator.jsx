import { useMemo, useState } from 'react';
import SectionHeader from './SectionHeader.jsx';
import { formatNumber } from '../data.js';

// Staking projection: stake N SOL → how much rkuSOL you receive, daily yield,
// points per day, and projected points over 30/90 days (1 rkuSOL = 1 point/day).
export default function ApyCalculator({ snapshot }) {
  const stats = snapshot?.stats || {};
  const [solInput, setSolInput] = useState('100');

  const apy = Number(stats.apyPct);
  const apyFraction = Number.isFinite(apy) ? apy / 100 : null;
  const rate = Number(stats.rateSolPerRkuSol);
  const solPrice = Number(stats.solPriceUsd);

  const result = useMemo(() => {
    const sol = Number(solInput);
    if (!Number.isFinite(sol) || sol <= 0) return null;
    const rkuSol = Number.isFinite(rate) && rate > 0 ? sol / rate : null;
    const dailyYieldSol = apyFraction != null ? (sol * apyFraction) / 365 : null;
    const dailyPoints = rkuSol != null ? rkuSol : null; // 1 rkuSOL = 1 point/day
    const dailyYieldUsd = dailyYieldSol != null && Number.isFinite(solPrice) ? dailyYieldSol * solPrice : null;
    const proj30 = dailyPoints != null ? dailyPoints * 30 : null;
    const proj90 = dailyPoints != null ? dailyPoints * 90 : null;
    const proj365 = dailyPoints != null ? dailyPoints * 365 : null;
    return { sol, rkuSol, dailyYieldSol, dailyPoints, dailyYieldUsd, proj30, proj90, proj365 };
  }, [solInput, rate, apyFraction, solPrice]);

  const fmt = (v, opts) => (v == null || !Number.isFinite(Number(v))) ? '—' : formatNumber(Number(v), opts || { maximumFractionDigits: 2 });
  // Small SOL amounts need more decimals to stay meaningful.
  const fmtSol = (v) => (v == null ? '—' : `${fmt(v, { maximumFractionDigits: Math.abs(v) < 1 ? 4 : 2 })} SOL`);
  const apyLabel = Number.isFinite(apy) ? `${formatNumber(apy, { maximumFractionDigits: 2 })}%` : 'the reported';
  const rateLabel = Number.isFinite(rate) && rate > 0 ? rate.toFixed(4) : 'the current';
  const points = (v) => (result ? fmt(v, { maximumFractionDigits: 0 }) : '—');

  const cells = [
    ['rkuSOL received', result ? fmt(result.rkuSol) : '—'],
    ['Daily yield', result ? fmtSol(result.dailyYieldSol) : '—'],
    ['Daily yield in USD', result && result.dailyYieldUsd != null ? `$${fmt(result.dailyYieldUsd)}` : '—'],
    ['Yield in a year', result && result.dailyYieldSol != null ? fmtSol(result.dailyYieldSol * 365) : '—'],
    ['Points per day', points(result?.dailyPoints)],
    ['Points in 30 days', points(result?.proj30)],
    ['Points in 90 days', points(result?.proj90)],
    ['Points in a year', points(result?.proj365)],
  ];

  return (
    <section className="mt-14" aria-labelledby="apy-calc-title">
      <SectionHeader id="apy-calc-title" title="Staking projection" aside={Number.isFinite(solPrice) ? `SOL at $${formatNumber(solPrice, { maximumFractionDigits: 2 })}` : null} />
      <div className="panel grid overflow-hidden lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="border-b border-rule p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <label htmlFor="stake-input" className="block text-[13px] text-muted">Stake amount</label>
          <div className="relative mt-2">
            <input
              id="stake-input"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={solInput}
              onChange={(e) => setSolInput(e.target.value)}
              className="field h-12 pr-14 text-[20px] font-medium tabular-nums"
              placeholder="100"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[13px] font-medium text-muted">SOL</span>
          </div>
          <p className="m-0 mt-4 text-[13px] leading-relaxed text-muted">
            Assumes {apyLabel} APY, {rateLabel} SOL per rkuSOL, a constant balance and 1 point per rkuSOL held per day. Yield compounds, so daily figures are approximate.
          </p>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4" role="status" aria-live="polite">
          {cells.map(([label, value]) => (
            <div className="min-w-0 bg-surface px-4 py-4 sm:px-5" key={label}>
              <dt className="text-[12px] text-muted">{label}</dt>
              <dd className="m-0 mt-1.5 truncate text-[17px] font-medium tabular-nums tracking-[-0.01em] text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
