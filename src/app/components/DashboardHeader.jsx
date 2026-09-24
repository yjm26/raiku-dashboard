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
  return <section className="pb-7 pt-10 sm:pb-8 sm:pt-14" aria-labelledby="dashboard-title">
    <h1 id="dashboard-title" className="m-0 text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[48px]">rkuSOL Holder &amp; Points</h1>
    <p className="m-0 mt-3 text-[14px] text-muted">{updated ? `Data as of ${updated}. Refreshed daily.` : 'Refreshed daily.'}</p>
  </section>;
}
