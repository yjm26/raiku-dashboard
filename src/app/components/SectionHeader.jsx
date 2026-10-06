// Raiku-style section head: title on the left, description or controls on the right.
export default function SectionHeader({ id, title, aside = null, children = null }) {
  return (
    <div className="mb-7 grid gap-x-8 gap-y-3 lg:grid-cols-2 lg:items-end">
      <h2 id={id} className="m-0 text-[28px] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-[36px]">{title}</h2>
      {children
        ? <div className="min-w-0 lg:justify-self-end">{children}</div>
        : aside ? <p className="m-0 max-w-[520px] text-[15px] leading-[1.6] tracking-[-0.011em] text-muted">{aside}</p> : null}
    </div>
  );
}
