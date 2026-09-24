export function EmptyChart() {
  return <div className="grid h-[240px] place-items-center text-[13px] text-muted" role="status">No timeline in this snapshot.</div>;
}

export default function ChartCard({ title, caption, children }) {
  const id = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  return <section className="panel flex min-w-0 flex-col p-4 sm:p-5" aria-labelledby={id}>
    <header className="mb-4">
      <h3 id={id} className="m-0 text-[15px] font-semibold text-ink">{title}</h3>
      {caption ? <p className="m-0 mt-0.5 text-[13px] text-muted">{caption}</p> : null}
    </header>
    <div className="min-h-[240px] w-full">{children}</div>
  </section>;
}
