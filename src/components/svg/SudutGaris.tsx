interface Props {
  mode: "sudut" | "garis" | "garis_lurus";
  darjah?: number;
  jenisGaris?: "selari" | "serenjang";
  a?: number;
  jumlah?: number;
}

const STROKE = "#374151";
const ACCENT = "#3B82F6";

function ArrowMark({ x, y, angle }: { x: number; y: number; angle: number }) {
  // draw ">>" marks along a line
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M -4 -4 L 0 0 L -4 4" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 2 -4 L 6 0 L 2 4" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function SudutGaris({ mode, darjah = 90, jenisGaris = "selari" }: Props) {
  const W = 280;
  const H = 200;

  if (mode === "sudut") {
    const vx = 70;
    const vy = 150;
    const length = 130;
    // base ray horizontal to the right
    const bx = vx + length;
    const by = vy;
    // second ray rotated counter-clockwise by `darjah`
    const rad = (darjah * Math.PI) / 180;
    const rx = vx + length * Math.cos(-rad);
    const ry = vy + length * Math.sin(-rad);
    // arc radius
    const arcR = 32;
    // Arc from base ray (angle 0) to second ray (angle -darjah in svg coords)
    const startX = vx + arcR;
    const startY = vy;
    const endX = vx + arcR * Math.cos(-rad);
    const endY = vy + arcR * Math.sin(-rad);
    const largeArc = darjah > 180 ? 1 : 0;
    // sweep flag: 0 for counter-clockwise in svg (which visually goes up)
    const sweep = 0;
    // label position: middle angle
    const midRad = (darjah / 2 * Math.PI) / 180;
    const labelR = arcR + 18;
    const lx = vx + labelR * Math.cos(-midRad);
    const ly = vy + labelR * Math.sin(-midRad);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <line x1={vx} y1={vy} x2={bx} y2={by} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={rx} y2={ry} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <path
          d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${endX} ${endY}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
        />
        <circle cx={vx} cy={vy} r={3} fill={STROKE} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
          {darjah}°
        </text>
      </svg>
    );
  }

  // mode === "garis"
  if (jenisGaris === "selari") {
    const y1 = 70;
    const y2 = 130;
    const x1 = 30;
    const x2 = 250;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <ArrowMark x={(x1 + x2) / 2} y={y1} angle={0} />
        <ArrowMark x={(x1 + x2) / 2} y={y2} angle={0} />
      </svg>
    );
  }

  // serenjang
  const cx = W / 2;
  const cy = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <line x1={30} y1={cy} x2={250} y2={cy} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={30} x2={cx} y2={170} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={cx} y={cy - 14} width={14} height={14} fill="none" stroke={ACCENT} strokeWidth={2} />
    </svg>
  );
}
