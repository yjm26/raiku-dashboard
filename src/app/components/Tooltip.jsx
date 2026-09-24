import { useId } from 'react';

// Hover/focus hint for a label. Usage:
// <Tooltip label="Days" hint="Days since first acquisition" />
// Use placement="bottom" inside scroll containers (tables) so the hint isn't clipped.
export default function Tooltip({ label, hint, children, placement = 'top', align = 'start', focusable = true }) {
  const id = useId();
  const position = `${placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} ${align === 'end' ? 'right-0' : 'left-0'}`;
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={focusable ? 0 : undefined}
        aria-describedby={id}
        className="cursor-help underline decoration-faint decoration-dotted decoration-1 underline-offset-[5px]"
      >
        {children ?? label}
      </span>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-30 hidden w-64 max-w-[75vw] rounded-lg border border-rule bg-surface px-3 py-2 text-left text-[12px] font-normal normal-case leading-[1.45] tracking-normal text-muted shadow-[0_8px_24px_rgb(0_0_0/0.16)] group-focus-within:block group-hover:block ${position}`}
      >
        {hint}
      </span>
    </span>
  );
}
