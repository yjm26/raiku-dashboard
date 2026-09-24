export default function SectionHeader({ id, title, aside = null, children = null }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h2 id={id} className="m-0 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h2>
        {aside ? <p className="m-0 mt-1 text-[13px] text-muted">{aside}</p> : null}
      </div>
      {children}
    </div>
  );
}
