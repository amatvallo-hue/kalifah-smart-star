interface Props {
  machineType: "tuas" | "takal" | "satah_condong" | "baji" | "skru" | "roda_gandar";
  labels?: string[];
}

const BG = "#F8FAFC";
const STROKE = "#374151";
const FILL = "#E2E8F0";
const ACCENT = "#2563EB";
const LABEL = "#1F2937";

const nameMap: Record<string, string> = {
  tuas: "Tuas",
  takal: "Takal",
  satah_condong: "Satah Condong",
  baji: "Baji",
  skru: "Skru",
  roda_gandar: "Roda dan Gandar",
};

function hasLabel(labels: string[] | undefined, key: string) {
  if (!labels) return false;
  return labels.some((l) => l.toLowerCase() === key.toLowerCase());
}

function arrowDown(x: number, y: number, len: number) {
  const h = 5;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + len} stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
      <polygon points={`${x - h},${y + len - h} ${x},${y + len + h} ${x + h},${y + len - h}`} fill={ACCENT} />
    </g>
  );
}

function Tuas({ labels }: { labels?: string[] }) {
  const cx = 140;
  const cy = 90;
  // rotated bar: 15 degrees
  const barLen = 160;
  const barW = 10;
  // bar corners before rotation
  const halfL = barLen / 2;
  const halfW = barW / 2;
  // rotate points around (cx,cy) by 15deg
  function rot(x0: number, y0: number) {
    const rad = (15 * Math.PI) / 180;
    const dx = x0 - cx;
    const dy = y0 - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }
  const p1 = rot(cx - halfL, cy - halfW);
  const p2 = rot(cx + halfL, cy - halfW);
  const p3 = rot(cx + halfL, cy + halfW);
  const p4 = rot(cx - halfL, cy + halfW);

  // load box on left end
  const leftEnd = rot(cx - halfL, cy);
  const rightEnd = rot(cx + halfL, cy);

  return (
    <g>
      {/* fulcrum triangle */}
      <polygon
        points={`${cx},${cy + 8} ${cx - 14},${cy + 36} ${cx + 14},${cy + 36}`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2}
      />
      {/* bar */}
      <polygon
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2}
      />
      {/* load box on left end */}
      <rect x={leftEnd.x - 16} y={leftEnd.y - 16} width={32} height={32} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* arrow on right end */}
      {arrowDown(rightEnd.x, rightEnd.y + 6, 28)}
      {hasLabel(labels, "Beban") && (
        <text x={leftEnd.x - 28} y={leftEnd.y - 22} textAnchor="end" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
          Beban
        </text>
      )}
      {hasLabel(labels, "Daya") && (
        <text x={rightEnd.x + 8} y={rightEnd.y + 22} textAnchor="start" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
          Daya
        </text>
      )}
      {hasLabel(labels, "Fulkrum") && (
        <text x={cx} y={cy + 50} textAnchor="middle" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
          Fulkrum
        </text>
      )}
    </g>
  );
}

function Takal() {
  const cx = 140;
  const cy = 70;
  const r = 28;
  const topY = 18;
  return (
    <g>
      {/* bracket */}
      <line x1={cx} y1={topY} x2={cx} y2={cy - r} stroke={STROKE} strokeWidth={2} />
      <line x1={cx - 10} y1={topY} x2={cx + 10} y2={topY} stroke={STROKE} strokeWidth={2} />
      {/* pulley wheel */}
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={4} fill={STROKE} />
      {/* rope going over wheel */}
      <path
        d={`M${cx - r - 2},${cy + 36} L${cx - r - 2},${cy} Q${cx - r - 2},${cy - r - 4} ${cx},${cy - r - 4} Q${cx + r + 2},${cy - r - 4} ${cx + r + 2},${cy} L${cx + r + 2},${cy + 36}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.5}
      />
      {/* load box left side */}
      <rect x={cx - r - 20} y={cy + 36} width={36} height={28} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* pull arrow right side */}
      {arrowDown(cx + r + 2, cy + 36 + 28 + 6, 22)}
    </g>
  );
}

function SatahCondong() {
  const baseX = 60;
  const baseY = 150;
  const topX = 220;
  const topY = 70;
  const endX = 220;
  return (
    <g>
      {/* ramp triangle */}
      <polygon points={`${baseX},${baseY} ${endX},${baseY} ${topX},${topY}`} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* box partway up the slope (roughly 40% along) */}
      <rect x={118} y={106} width={28} height={22} rx={3} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* curved arrow showing motion up slope */}
      <path
        d="M130,135 Q150,145 160,125"
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <polygon points="158,120 164,126 156,128" fill={ACCENT} />
    </g>
  );
}

function Baji() {
  const wedgeX = 140;
  const topY = 60;
  const bottomY = 150;
  const blockLeft = 148;
  const blockRight = 240;
  return (
    <g>
      {/* wedge triangle */}
      <polygon points={`${wedgeX - 24},${bottomY} ${wedgeX + 24},${bottomY} ${wedgeX},${topY}`} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* block of wood right side */}
      <rect x={blockLeft + 2} y={topY + 16} width={blockRight - blockLeft - 2} height={bottomY - topY - 16} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* gap line where wedge meets block */}
      <line x1={blockLeft + 2} y1={topY + 20} x2={blockLeft + 2} y2={bottomY - 4} stroke={STROKE} strokeWidth={1.5} strokeDasharray="4 3" />
    </g>
  );
}

function Skru() {
  const cx = 140;
  const cy = 100;
  const w = 36;
  const h = 90;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  return (
    <g>
      {/* cylinder body */}
      <rect x={left} y={top} width={w} height={h} rx={6} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* tip (triangle) */}
      <polygon points={`${left + 4},${bottom} ${right - 4},${bottom} ${cx},${bottom + 20}`} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* spiral threads as a sine-wave ribbon */}
      <path
        d={`M${left + 6},${top + 12} Q${cx + 10},${top + 24} ${left + 6},${top + 36} Q${cx + 10},${top + 48} ${left + 6},${top + 60} Q${cx + 10},${top + 72} ${left + 6},${top + 84}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d={`M${right - 6},${top + 18} Q${cx - 10},${top + 30} ${right - 6},${top + 42} Q${cx - 10},${top + 54} ${right - 6},${top + 66} Q${cx - 10},${top + 78} ${right - 6},${top + 90}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* top cap */}
      <ellipse cx={cx} cy={top} rx={w / 2} ry={5} fill={FILL} stroke={STROKE} strokeWidth={2} />
    </g>
  );
}

function RodaGandar() {
  const cx = 140;
  const cy = 90;
  const R = 46;
  const r = 14;
  return (
    <g>
      {/* wheel */}
      <circle cx={cx} cy={cy} r={R} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* axle */}
      <circle cx={cx} cy={cy} r={r} fill={STROKE} />
      {/* spoke / handle from center outward */}
      <line x1={cx} y1={cy} x2={cx + R - 4} y2={cy} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
      {/* small knob at end of handle */}
      <circle cx={cx + R - 2} cy={cy} r={5} fill={ACCENT} stroke={STROKE} strokeWidth={1.5} />
    </g>
  );
}

export function MesinRingkas({ machineType, labels }: Props) {
  const W = 280;
  const H = 200;

  const machineNames: Record<string, React.ReactNode> = {
    tuas: <Tuas labels={labels} />,
    takal: <Takal />,
    satah_condong: <SatahCondong />,
    baji: <Baji />,
    skru: <Skru />,
    roda_gandar: <RodaGandar />,
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      {machineNames[machineType] ?? null}
      <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={13} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
        {nameMap[machineType] ?? machineType}
      </text>
    </svg>
  );
}
