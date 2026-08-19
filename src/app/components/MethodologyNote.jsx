export default function MethodologyNote({ coverage, snapshot }) {
  const stats = snapshot?.stats || {};
  const fmt = (v, opts) => (v == null || !Number.isFinite(Number(v))) ? '—' : new Intl.NumberFormat('en-US', opts || { maximumFractionDigits: 0 }).format(Number(v));
  const tvlSol = fmt(stats.tvlSol);
  const rate = stats.rateSolPerRkuSol != null ? Number(stats.rateSolPerRkuSol).toFixed(4) : '—';
  const solPrice = stats.solPriceUsd != null ? `$${fmt(stats.solPriceUsd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return <section id="methodology" className="mt-4 border-t-2 border-rule bg-surface-muted p-3 text-[13px] leading-5 text-muted" aria-labelledby="methodology-title">
    <h2 id="methodology-title" className="m-0 text-[15px] font-bold uppercase text-ink">Methodology &amp; sources</h2>
    <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
      <p className="m-0"><strong className="text-ink">Estimated points</strong></p>
      <p className="m-0">balance × days held since first acquisition. Points track active holders only; unstaked wallets stop accruing.</p>
      <p className="m-0"><strong className="text-ink">Data sources</strong></p>
      <p className="m-0">On-chain balances via Solana RPC (getProgramAccounts + getMultipleAccounts). Official holders, APY &amp; TVL from the Raiku staking API. SOL price from CoinGecko.</p>
      <p className="m-0"><strong className="text-ink">Coverage</strong></p>
      <p className="m-0">{coverage?.found ?? 0}/{coverage?.total ?? 0} real wallets tracked. First acquisition per wallet from on-chain signature history.</p>
      <p className="m-0"><strong className="text-ink">Snapshot</strong></p>
      <p className="m-0">TVL {tvlSol} SOL · rate {rate} SOL/rkuSOL · SOL price {solPrice}. Refreshed daily.</p>
    </div>
  </section>;
}
