/** Draws the lit part of the moon from illumination + waxing/waning. Shared by every View. */
export function MoonDisc({ illumination, waxing, size = 132 }: { illumination: number; waxing: boolean; size?: number }) {
  const r = size / 2 - 2;
  const c = size / 2;
  // x-radius of the terminator ellipse: +r at new moon, 0 at quarter, -r at full
  const k = r * (1 - 2 * illumination);
  const sweepOuter = waxing ? 1 : 0;
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A ${Math.abs(k)} ${r} 0 0 ${k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0} ${c} ${c - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(illumination * 100)}% illuminated`}>
      <circle cx={c} cy={c} r={r} className="moon-dark" />
      <path d={d} className="moon-lit" />
      <circle cx={c} cy={c} r={r} fill="none" className="moon-rim" />
    </svg>
  );
}
