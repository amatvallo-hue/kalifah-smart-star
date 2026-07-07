interface Props {
  lokasi: string[];
  jarak: number[];
  unit?: string;
}

const STROKE = "#374151";
const FILL = "#BFDBFE";
const ACCENT = "#3B82F6";

export function RajahJarak({ lokasi, jarak, unit = "m" }: Props) {
  const items = lokasi ?? [];
  const n = Math.max(1, items.length);
  const gap = 140;
  const padL = 40;
  const padR = 40;
  const W = Math.min(700, padL + padR + (n - 1) * gap);
  const step = n > 1 ? (W - padL - padR) / (n - 1) : 0;
  const H = 180;
  const cy = 80;
  const r = 14;

  const circles: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];

  for (let i = 0; i < n; i++) {
    const x = padL + i * step;
    circles.push(
      <g key={`c-${i}`}>
        <circle cx={x} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth={2} />
        <text x={x} y={cy + r + 20} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{items[i]}</text>
      </g>
    );
  }

  for (let i = 0; i < n - 1; i++) {
    const x1 = padL + i * step + r;
    const x2 = padL + (i + 1) * step - r;
    const mx = (x1 + x2) / 2;
    const jarakVal = (jarak ?? [])[i];
    lines.push(
      <g key={`l-${i}`}>
        <line x1={x1} y1={cy} x2={x2} y2={cy} stroke={STROKE} strokeWidth={2} />
        {/* double arrow */}
        <path d={`M ${x1 + 4} ${cy - 5} L ${x1} ${cy} L ${x1 + 4} ${cy + 5}`} stroke={ACCENT} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${x2 - 4} ${cy - 5} L ${x2} ${cy} L ${x2 - 4} ${cy + 5}`} stroke={ACCENT} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={mx} y={cy - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
          {jarakVal ?? ""} {unit}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {lines}
      {circles}
    </svg>
  );
}
