import ExternalLink from './ExternalLink.jsx';

const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;

const GlobeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;

export default function ProtocolInfo() {
  return <aside aria-label="Raiku protocol information" className="grid content-start gap-3">
    <section className="flex min-h-[160px] items-center justify-center border border-rule bg-transparent px-4 py-6">
      <img src="/raiku-logo.jpg" alt="Raiku" className="h-12 w-auto max-w-[300px] object-contain dark:hidden" />
      <img src="/raiku-logo-dark.png" alt="Raiku" className="hidden h-12 w-auto max-w-[300px] object-contain dark:block" />
    </section>
    <section className="border border-rule bg-surface-muted p-5 text-[13px] leading-6 text-justify text-[#303030] dark:text-muted">
      <p className="mt-0">Raiku is a lightweight Solana validator client built for speed. It handles Ahead-Of-Time (AOT) compute reservations and Just-In-Time (JIT) MEV bundle processing, tuned for low latency and high throughput.</p>
      <p className="mb-0">rkuSOL is Raiku's liquid staking token. It routes SOL to validators running the Raiku client, and stakers earn a share of validator rewards proportional to their stakeweight. Validators generate income from AOT and JIT transaction types, plus MEV and network rewards.</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-medium">
        <ExternalLink aria-label="Raiku on X" className="inline-flex items-center gap-1.5 text-ink underline underline-offset-2" href="https://x.com/raikucom"><XIcon />X Account</ExternalLink>
        <ExternalLink aria-label="Raiku website" className="inline-flex items-center gap-1.5 text-ink underline underline-offset-2" href="https://raiku.com/stake"><GlobeIcon />Website</ExternalLink>
      </div>
    </section>
  </aside>;
}
