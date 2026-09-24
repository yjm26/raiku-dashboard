import { useState } from 'react';

const Chevron = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FaqItem({ q, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <div className="border-t border-rule">
      <button
        type="button"
        id={`faq-${id}-button`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-${id}`}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-[14px] font-medium text-ink transition-colors duration-150 hover:bg-surface-muted sm:px-5"
      >
        <span>{q}</span>
        <span className="shrink-0 text-muted"><Chevron open={open} /></span>
      </button>
      <div id={`faq-${id}`} role="region" aria-labelledby={`faq-${id}-button`} inert={!open} className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-5 text-[14px] leading-relaxed text-muted sm:px-5">{children}</div>
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
  const poolShare = Number.isFinite(Number(stats.pdaShare)) ? `About ${fmt(stats.pdaShare)}%` : 'A large share';

  return (
    <section id="faq" className="panel min-w-0 overflow-hidden" aria-labelledby="faq-title">
      <header className="px-4 py-5 sm:px-5">
        <h2 id="faq-title" className="m-0 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">Questions</h2>
      </header>

      <div>
        <FaqItem q="How are points calculated?" defaultOpen>
          <p className="m-0"><strong className="font-medium text-ink">Estimated points = balance × days held</strong> since first acquisition. Points track <strong className="font-medium text-ink">active holders only</strong>, so unstaked wallets stop accruing. Coverage: {coverage?.found ?? 0} of {coverage?.total ?? 0} real wallets tracked.</p>
        </FaqItem>

        <FaqItem q="Where does the data come from?">
          <p className="m-0"><strong className="font-medium text-ink">On-chain balances</strong> via Solana RPC (getProgramAccounts + getMultipleAccounts). <strong className="font-medium text-ink">Official holders, APY and TVL</strong> from the Raiku staking API. <strong className="font-medium text-ink">SOL price</strong> from CoinGecko. First acquisition per wallet from on-chain signature history.</p>
        </FaqItem>

        <FaqItem q="How is the rkuSOL rate calculated?">
          <p className="m-0"><strong className="font-medium text-ink">Rate = TVL (SOL) ÷ rkuSOL supply.</strong> TVL comes from the Raiku staking API (<code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[12px]">tvl_lamports</code>), supply from on-chain token accounts. Current: <strong className="font-medium text-ink">{rate} SOL per rkuSOL</strong>, so 1 SOL staked ≈ {(stats.rateSolPerRkuSol ? (1 / Number(stats.rateSolPerRkuSol)).toFixed(4) : '—')} rkuSOL. This is Raiku&apos;s own reported figure, not an estimate.</p>
        </FaqItem>

        <FaqItem q="Why are holders different from real wallets?">
          <p className="m-0"><strong className="font-medium text-ink">Holders</strong> counts every token account owner, including pools and programs. <strong className="font-medium text-ink">Real wallets</strong> only counts System-Program-owned accounts. {poolShare} of supply sits in pool and program accounts, which is normal for an LST.</p>
        </FaqItem>

        <FaqItem q="What's in the snapshot?">
          <p className="m-0">TVL <strong className="font-medium text-ink">{tvlSol} SOL</strong>, rate <strong className="font-medium text-ink">{rate} SOL per rkuSOL</strong>, SOL price <strong className="font-medium text-ink">{solPrice}</strong> and APY <strong className="font-medium text-ink">{apy}</strong>. Data is refreshed daily.</p>
        </FaqItem>
      </div>
    </section>
  );
}
