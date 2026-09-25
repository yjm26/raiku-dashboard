import { useEffect, useId, useState } from 'react';

const BOX = 'pointer-events-none z-30 w-64 max-w-[75vw] rounded-lg border border-rule bg-surface px-3 py-2 text-left text-[12px] font-normal normal-case leading-[1.45] tracking-normal text-muted shadow-[0_8px_24px_rgb(0_0_0/0.16)]';

// Hover/focus hint for a label. Usage:
// <Tooltip label="Days" hint="Days since first acquisition" />
// Use placement="bottom" inside scroll containers (tables) so the hint isn't clipped.
// Use `floating` inside containers that clip their content: the hint is placed on the page itself.
export default function Tooltip({ label, hint, children, placement = 'top', align = 'start', focusable = true, floating = false }) {
  const id = useId();
  const [spot, setSpot] = useState(null);
  const show = (event) => {
    if (!floating) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot({ top: rect.bottom + 8, left: Math.max(8, Math.min(rect.left, window.innerWidth - 272)) });
  };
  const hide = () => setSpot(null);
  useEffect(() => {
    if (!spot) return undefined;
    window.addEventListener('scroll', hide, { passive: true, once: true });
    return () => window.removeEventListener('scroll', hide);
  }, [spot]);

  const position = `${placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} ${align === 'end' ? 'right-0' : 'left-0'}`;
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={focusable ? 0 : undefined}
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="cursor-help underline decoration-faint decoration-dotted decoration-1 underline-offset-[5px]"
      >
        {children ?? label}
      </span>
      {floating
        ? <span id={id} role="tooltip" className={`fixed ${spot ? 'block' : 'hidden'} ${BOX}`} style={spot ?? undefined}>{hint}</span>
        : <span id={id} role="tooltip" className={`absolute hidden group-focus-within:block group-hover:block ${position} ${BOX}`}>{hint}</span>}
    </span>
  );
}
