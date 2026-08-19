import { useMemo, useState } from 'react';
import { formatNumber } from '../data.js';

// APY playground: stake N SOL → how much rkuSOL you receive, daily yield,
// and estimated daily points (1 rkuSOL = 1 point/day).
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
    const dailyYieldRkuSol = dailyYieldSol != null && Number.isFinite(rate) && rate > 0 ? dailyYieldSol / rate : null;
    const dailyPoints = rkuSol != null ? rkuSol : null; // 1 rkuSOL = 1 point/day
    const dailyYieldUsd = dailyYieldSol != null && Number.isFinite(solPrice) ? dailyYieldSol * solPrice : null;
    return { sol, rkuSol, dailyYieldSol, dailyYieldRkuSol, dailyPoints, dailyYieldUsd };
  }, [solInput, rate, apyFraction, solPrice]);

  const fmt = (v, opts) => (v == null || !Number.isFinite(Number(v))) ? '—' : formatNumber(Number(v), opts || { maximumFractionDigits: 2 });

  return (
    <section className="mt-4 border border-rule bg-surface p-4" aria-labelledby="apy-calc-title">
      <div className="flex items-start justify-between">
        <div>
          <p className="m-0 text-[12px] text-muted">Playground</p>
          <h2 id="apy-calc-title" className="m-0 mt-0.5 text-[15px] font-normal text-ink">APY calculator</h2>
        </div>
        <span className="font-mono text-[13px] text-muted">{apy != null ? `${formatNumber(apy, { maximumFractionDigits: 2 })}% APY` : ''}</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block font-mono text-[12px] uppercase tracking-wide text-muted">Stake (SOL)</span>
          <input
            type="number"
            min="0"
            step="any"
            value={solInput}
            onChange={(e) => setSolInput(e.target.value)}
            className="w-full border border-rule bg-page px-3 py-2 font-mono text-[14px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
            placeholder="100"
            aria-label="Stake amount in SOL"
          />
        </label>
        <div className="flex items-end pb-1">
          <span className="font-mono text-[12px] text-muted">{solPrice != null ? `SOL ≈ $${formatNumber(solPrice, { maximumFractionDigits: 2 })}` : ''}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4" role="status" aria-live="polite">
        {[
          ['rkuSOL received', result ? `${fmt(result.rkuSol)} rkuSOL` : '—'],
          ['Daily yield', result ? `${fmt(result.dailyYieldSol)} SOL` : '—'],
          ['≈ USD/day', result && result.dailyYieldUsd != null ? `$${fmt(result.dailyYieldUsd)}` : '—'],
          ['Points / day', result ? fmt(result.dailyPoints, { maximumFractionDigits: 0 }) : '—'],
        ].map(([label, value]) => (
          <div className="bg-surface p-3" key={label}>
            <span className="block font-mono text-[12px] uppercase text-muted">{label}</span>
            <strong className="mt-1 block font-mono text-[15px] tabular-nums text-ink">{value}</strong>
          </div>
        ))}
      </div>

      <p className="mb-0 mt-2 text-[12px] text-muted">
        Estimate based on {apy != null ? `${formatNumber(apy, { maximumFractionDigits: 2 })}% APY` : 'reported APY'} and {rate != null ? `${rate.toFixed(4)} SOL/rkuSOL` : 'current rate'}. Yield compounds; daily figure is an approximation. Points assume 1 rkuSOL held = 1 point/day.
      </p>
    </section>
  );
}
