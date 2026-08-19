import { useState } from 'react';

const Chevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FaqItem({ q, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <div className="border-b border-rule last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-${id}`}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span>{q}</span>
        <span className={`text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}><Chevron open={open} /></span>
      </button>
      <div id={`faq-${id}`} role="region" className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 text-[13px] leading-5 text-muted">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection({ coverage, snapshot }) {
  const stats = snapshot?.stats || {};
  const fmt = (v, opts) => (v == null || !Number.isFinite(Number(v))) ? '—' : new Intl.NumberFormat('en-US', opts || { maximumFractionDigits: 0 }).format(Number(v));
  const tvlSol = fmt(stats.tvlSol);
  const rate = stats.rateSolPerRkuSol != null ? Number(stats.rateSolPerRkuSol).toFixed(4) : '—';
  const solPrice = stats.solPriceUsd != null ? `$${fmt(stats.solPriceUsd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  const apy = stats.apyPct != null ? `${fmt(stats.apyPct, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '—';

  return (
    <section id="faq" className="mt-6 border border-rule bg-surface" aria-labelledby="faq-title">
      <header className="flex items-center justify-between border-b border-rule bg-surface-muted px-4 py-3">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">FAQ</p>
          <h2 id="faq-title" className="m-0 mt-0.5 font-serif text-[17px] font-normal text-ink">Questions &amp; sources</h2>
        </div>
        <span className="hidden font-mono text-[12px] text-muted sm:block">updated daily</span>
      </header>

      <div className="divide-y divide-rule">
        <FaqItem q="How are points calculated?" defaultOpen>
          <p className="m-0"><strong className="text-ink">Estimated points = balance × days held</strong> since first acquisition. Points track <strong className="text-ink">active holders only</strong> — unstaked wallets stop accruing. Coverage: {coverage?.found ?? 0}/{coverage?.total ?? 0} real wallets tracked.</p>
        </FaqItem>

        <FaqItem q="Where does the data come from?">
          <p className="m-0"><strong className="text-ink">On-chain balances</strong> via Solana RPC (getProgramAccounts + getMultipleAccounts). <strong className="text-ink">Official holders, APY &amp; TVL</strong> from the Raiku staking API. <strong className="text-ink">SOL price</strong> from CoinGecko. First acquisition per wallet from on-chain signature history.</p>
        </FaqItem>

        <FaqItem q="How is the rkuSOL rate calculated?">
          <p className="m-0"><strong className="text-ink">Rate = TVL (SOL) ÷ rkuSOL supply.</strong> TVL comes from the Raiku staking API (<code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px]">tvl_lamports</code>), supply from on-chain token accounts. Current: <strong className="text-ink">{rate} SOL/rkuSOL</strong> — so 1 SOL staked ≈ {(stats.rateSolPerRkuSol ? (1 / Number(stats.rateSolPerRkuSol)).toFixed(4) : '—')} rkuSOL. This is Raiku's own reported figure, not an estimate.</p>
        </FaqItem>

        <FaqItem q="Why are holders different from real wallets?">
          <p className="m-0"><strong className="text-ink">Holders</strong> counts every token account owner (including pools/programs). <strong className="text-ink">Real wallets</strong> only counts System-Program-owned accounts — pools and PDAs are separated. ~73% of supply sits in pool/program accounts, normal for an LST.</p>
        </FaqItem>

        <FaqItem q="What's in the snapshot?">
          <p className="m-0">TVL <strong className="text-ink">{tvlSol} SOL</strong> · rate <strong className="text-ink">{rate} SOL/rkuSOL</strong> · SOL price <strong className="text-ink">{solPrice}</strong> · APY <strong className="text-ink">{apy}</strong>. Data refreshed daily.</p>
        </FaqItem>
      </div>
    </section>
  );
}
