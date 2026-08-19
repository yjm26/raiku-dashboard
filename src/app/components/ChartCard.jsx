export default function ChartCard({ title, eyebrow, children, className = '' }) {
  const id = `${title.replace(/\s+/g, '-').toLowerCase()}-title`;
  return <section className={`flex min-h-[280px] flex-col border border-rule bg-surface p-2 ${className}`} aria-labelledby={id}><header className="flex items-start justify-between pb-1.5"><div><p className="m-0 text-[12px] text-[#3c3c3c]">{title}</p></div><span className="font-mono text-[13px] text-[#999]">{eyebrow}</span></header><div className="flex min-h-[245px] flex-1 items-center justify-center">{children}</div></section>;
}
