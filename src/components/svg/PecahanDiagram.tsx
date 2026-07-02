interface Props {
  shape: "bulatan" | "segiempat";
  total: number;
  shaded: number;
}

const FILL = "#BFDBFE";
const STROKE = "#374151";

export function PecahanDiagram({ shape, total, shaded }: Props) {
  const t = Math.max(2, Math.min(4, Math.floor(total)));
  const s = Math.max(0, Math.min(t, Math.floor(shaded)));

  const cx = 140;
  const cy = 100;

  if (shape === "bulatan") {
    const r = 75;
    const slices = [];
    for (let i = 0; i < t; i++) {
      const a1 = (i / t) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / t) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      const largeArc = a2 - a1 > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      slices.push(
        <path key={i} d={d} fill={i < s ? FILL : "#FFFFFF"} stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
      );
    }
    return (
      <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
        {slices}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={STROKE} strokeWidth={2.5} />
      </svg>
    );
  }

  // segiempat: vertical strips
  const w = 200;
  const h = 120;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const stripW = w / t;
  const strips = [];
  for (let i = 0; i < t; i++) {
    strips.push(
      <rect
        key={i}
        x={x0 + i * stripW}
        y={y0}
        width={stripW}
        height={h}
        fill={i < s ? FILL : "#FFFFFF"}
        stroke={STROKE}
        strokeWidth={2}
      />
    );
  }
  return (
    <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {strips}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={STROKE} strokeWidth={2.5} />
    </svg>
  );
}
