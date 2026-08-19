export default function ChartCard({ title, eyebrow, children, className = '' }) {
  const id = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  return <section className={`min-h-[280px] border border-rule bg-surface p-2 ${className}`} aria-labelledby={id}><header className="flex items-start justify-between border-b border-rule pb-2"><div><p className="m-0 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{eyebrow}</p><h2 id={id} className="m-0 mt-1 text-xs font-bold uppercase tracking-[0.05em]">{title}</h2></div><span className="font-mono text-[10px] text-muted">analysis</span></header><div className="flex min-h-[245px] flex-1 items-center justify-center pt-2">{children}</div></section>;
}
