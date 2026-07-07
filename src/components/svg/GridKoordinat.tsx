interface Item {
  label: string;
  x: number;
  y: number;
}

interface Props {
  saizX: number;
  saizY: number;
  items: Item[];
}

const AXIS = "#374151";
const GRID = "#94A3B8";
const DOT = "#3B82F6";

export function GridKoordinat({ saizX, saizY, items }: Props) {
  const nX = Math.max(1, Math.floor(saizX));
  const nY = Math.max(1, Math.floor(saizY));

  const marginL = 32;
  const marginB = 28;
  const marginT = 12;
  const marginR = 12;
  const plotW = 260;
  const plotH = 260;
  const cellW = plotW / nX;
  const cellH = plotH / nY;
  const W = marginL + plotW + marginR;
  const H = marginT + plotH + marginB;

  const originX = marginL;
  const originY = marginT + plotH;

  const gridLines: React.ReactNode[] = [];
  gridLines.push(
    <rect key="bg" x={originX} y={marginT} width={plotW} height={plotH} fill="#F0F9FF" stroke="#BFDBFE" strokeWidth={1} />
  );
  for (let i = 0; i <= nX; i++) {
    const x = originX + i * cellW;
    gridLines.push(
      <line key={`vx-${i}`} x1={x} y1={marginT} x2={x} y2={originY} stroke={GRID} strokeWidth={1} />
    );
    gridLines.push(
      <text key={`vt-${i}`} x={x} y={originY + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{i}</text>
    );
  }
  for (let j = 0; j <= nY; j++) {
    const y = originY - j * cellH;
    gridLines.push(
      <line key={`hy-${j}`} x1={originX} y1={y} x2={originX + plotW} y2={y} stroke={GRID} strokeWidth={1} />
    );
    gridLines.push(
      <text key={`ht-${j}`} x={originX - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize={11} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{j}</text>
    );
  }

  const dots = (items ?? []).map((it, i) => {
    const cx = originX + it.x * cellW;
    const cy = originY - it.y * cellH;
    return (
      <g key={i}>
        <circle cx={cx} cy={cy} r={7} fill={DOT} stroke={AXIS} strokeWidth={2} />
        <text x={cx + 8} y={cy - 8} fontSize={12} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{it.label}</text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 380)} height={Math.min(H, 380)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {gridLines}
      {/* axes */}
      <line x1={originX} y1={marginT} x2={originX} y2={originY} stroke={AXIS} strokeWidth={2} />
      <line x1={originX} y1={originY} x2={originX + plotW} y2={originY} stroke={AXIS} strokeWidth={2} />
      {dots}
    </svg>
  );
}
