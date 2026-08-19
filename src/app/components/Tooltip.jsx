// Pure-CSS hover tooltip (no JS state). Usage:
// <Tooltip label="Days" hint="Days since first acquisition">…</Tooltip>
export default function Tooltip({ label, hint, children }) {
  return (
    <span className="group relative inline-flex">
      {children ?? label}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-56 -translate-x-1/2 rounded border border-rule bg-page px-2.5 py-1.5 text-[11px] font-normal leading-4 text-muted opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100" role="tooltip">
        {hint}
      </span>
    </span>
  );
}
