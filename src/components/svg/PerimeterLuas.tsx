interface Props {
  shape: "segiempat_sama" | "segiempat_tepat" | "segitiga_sama_sisi";
  sisi?: number;
  panjang?: number;
  lebar?: number;
  unit?: string;
}

const STROKE = "#374151";
const FILL = "#BFDBFE";

export function PerimeterLuas({ shape, sisi = 5, panjang = 8, lebar = 4, unit = "cm" }: Props) {
  const W = 280;
  const H = 200;

  if (shape === "segiempat_sama") {
    const size = 130;
    const x = (W - size) / 2;
    const y = (H - size) / 2;
    const label = `${sisi} ${unit}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={x} y={y} width={size} height={size} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <text x={W / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={W / 2} y={y + size + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={x - 8} y={H / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={x + size + 8} y={H / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
      </svg>
    );
  }

  if (shape === "segiempat_tepat") {
    const w = 180;
    const h = 100;
    const x = (W - w) / 2;
    const y = (H - h) / 2;
    const pL = `${panjang} ${unit}`;
    const lL = `${lebar} ${unit}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={x} y={y} width={w} height={h} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <text x={W / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{pL}</text>
        <text x={W / 2} y={y + h + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{pL}</text>
        <text x={x - 8} y={H / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{lL}</text>
        <text x={x + w + 8} y={H / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{lL}</text>
      </svg>
    );
  }

  // segitiga_sama_sisi
  const side = 140;
  const h = (Math.sqrt(3) / 2) * side;
  const cx = W / 2;
  const topY = (H - h) / 2;
  const botY = topY + h;
  const p1 = { x: cx, y: topY };
  const p2 = { x: cx - side / 2, y: botY };
  const p3 = { x: cx + side / 2, y: botY };
  const label = `${sisi} ${unit}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      {/* bottom */}
      <text x={cx} y={botY + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
      {/* left side midpoint */}
      <text x={(p1.x + p2.x) / 2 - 14} y={(p1.y + p2.y) / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
      {/* right side midpoint */}
      <text x={(p1.x + p3.x) / 2 + 14} y={(p1.y + p3.y) / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
    </svg>
  );
}
