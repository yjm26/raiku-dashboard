function formatSnapshotTime(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date);
  return `${day}, ${time} UTC`;
}

export default function DashboardHeader({ snapshot }) {
  const updated = formatSnapshotTime(snapshot?.ts);
  return <section className="pb-12 pt-12 sm:pb-14 sm:pt-16" aria-labelledby="dashboard-title">
    <h1 id="dashboard-title" className="m-0 text-[38px] font-medium leading-none tracking-[-0.03em] text-ink sm:text-[64px]"><em className="font-normal">rkuSOL</em> Holder &amp; Points</h1>
    <p className="m-0 mt-6 max-w-[620px] text-[17px] leading-[1.6] tracking-[-0.011em] text-muted">Holders, balances and estimated points for Raiku&apos;s liquid staking token, rebuilt every day from on-chain data.</p>
    <p className="label m-0 mt-5">{updated ? `Data as of ${updated}` : 'Refreshed daily'}</p>
  </section>;
}
