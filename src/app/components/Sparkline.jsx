// Small trend line for a stat tile. Scales to its own min/max; shape only, no axes.
const W = 120;
const H = 32;

export default function Sparkline({ values = [], className = '', label }) {
  const points = values.map(Number).filter(Number.isFinite);
  if (points.length < 2) return <div className={className} aria-hidden="true" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const y = (v) => (max === min ? H / 2 : H - 2 - ((v - min) / (max - min)) * (H - 4));
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${((i / (points.length - 1)) * W).toFixed(2)},${y(v).toFixed(2)}`).join('');
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--chart-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
