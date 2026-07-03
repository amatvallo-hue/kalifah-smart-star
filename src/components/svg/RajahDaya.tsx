interface Force {
  arah: "kiri" | "kanan" | "atas" | "bawah";
  label: string;
}

interface Props {
  forces: Force[];
}

const BG = "#F8FAFC";
const STROKE = "#374151";
const BOX_FILL = "#E2E8F0";
const ACCENT = "#DC2626";
const LABEL = "#1F2937";

function arrowHeadPoints(x: number, y: number, arah: Force["arah"], size = 8) {
  const h = size / 2;
  if (arah === "kiri") return `${x},${y - h} ${x - size},${y} ${x},${y + h}`;
  if (arah === "kanan") return `${x},${y - h} ${x + size},${y} ${x},${y + h}`;
  if (arah === "atas") return `${x - h},${y} ${x},${y - size} ${x + h},${y}`;
  return `${x - h},${y} ${x},${y + size} ${x + h},${y}`;
}

export function RajahDaya({ forces }: Props) {
  const W = 280;
  const H = 200;
  const objW = 64;
  const objH = 44;
  const cx = W / 2;
  const cy = H / 2;
  const objLeft = cx - objW / 2;
  const objRight = cx + objW / 2;
  const objTop = cy - objH / 2;
  const objBottom = cy + objH / 2;
  const arrowGap = 10;
  const arrowLen = 48;

  // Count duplicate directions to offset overlapping arrows
  const dirCounts = new Map<string, number>();
  forces.forEach((f) => dirCounts.set(f.arah, (dirCounts.get(f.arah) ?? 0) + 1));
  const dirSeen = new Map<string, number>();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      <rect x={objLeft} y={objTop} width={objW} height={objH} rx={8} fill={BOX_FILL} stroke={STROKE} strokeWidth={2} />
      {/* Simple crate cross detail */}
      <line x1={objLeft + 14} y1={objTop + 10} x2={objRight - 14} y2={objBottom - 10} stroke={STROKE} strokeWidth={1.5} opacity={0.35} />
      <line x1={objRight - 14} y1={objTop + 10} x2={objLeft + 14} y2={objBottom - 10} stroke={STROKE} strokeWidth={1.5} opacity={0.35} />

      {forces.map((force, i) => {
        const seen = dirSeen.get(force.arah) ?? 0;
        dirSeen.set(force.arah, seen + 1);

        let offset = 0;
        if ((dirCounts.get(force.arah) ?? 0) > 1) {
          offset = (seen % 2 === 0 ? -1 : 1) * 18;
        }

        let x1: number, y1: number, x2: number, y2: number;
        let lx: number, ly: number, anchor: "start" | "middle" | "end";

        if (force.arah === "kiri") {
          x1 = objLeft - arrowGap;
          y1 = cy + offset;
          x2 = objLeft - arrowGap - arrowLen;
          y2 = cy + offset;
          lx = x2 - 6;
          ly = y2 - 10;
          anchor = "end";
        } else if (force.arah === "kanan") {
          x1 = objRight + arrowGap;
          y1 = cy + offset;
          x2 = objRight + arrowGap + arrowLen;
          y2 = cy + offset;
          lx = x2 + 6;
          ly = y2 - 10;
          anchor = "start";
        } else if (force.arah === "atas") {
          x1 = cx + offset;
          y1 = objTop - arrowGap;
          x2 = cx + offset;
          y2 = objTop - arrowGap - arrowLen;
          lx = x2 + 8;
          ly = y2 - 6;
          anchor = "start";
        } else {
          x1 = cx + offset;
          y1 = objBottom + arrowGap;
          x2 = cx + offset;
          y2 = objBottom + arrowGap + arrowLen;
          lx = x2 + 8;
          ly = y2 + 14;
          anchor = "start";
        }

        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
            <polygon points={arrowHeadPoints(x2, y2, force.arah)} fill={ACCENT} />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fill={LABEL}
              fontFamily="sans-serif"
            >
              {force.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
