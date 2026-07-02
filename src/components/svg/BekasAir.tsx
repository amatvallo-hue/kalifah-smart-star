interface Item {
  label: string;
  volume: number;
  maxVolume: number;
}

interface Props {
  items: Item[];
}

const WATER = "#BFDBFE";
const STROKE = "#374151";

export function BekasAir({ items }: Props) {
  const list = items ?? [];
  const n = Math.max(1, list.length);

  const viewW = 280;
  const viewH = 200;
  const bekasH = 130;
  const topY = 30;
  const bottomY = topY + bekasH;
  const maxBekasW = 60;
  const bekasW = Math.min(maxBekasW, (viewW - 20) / n - 10);
  const gap = (viewW - bekasW * n) / (n + 1);

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {list.map((it, i) => {
        const x = gap + i * (bekasW + gap);
        const maxV = Math.max(1, it.maxVolume || 1);
        const ratio = Math.max(0, Math.min(1, (it.volume || 0) / maxV));
        const waterH = bekasH * ratio;
        const waterY = bottomY - waterH;
        const cx = x + bekasW / 2;

        // Scale ticks: 4 marks
        const ticks = [0.25, 0.5, 0.75, 1].map((f, k) => {
          const ty = bottomY - bekasH * f;
          return (
            <line key={k} x1={x + bekasW} y1={ty} x2={x + bekasW + 5} y2={ty} stroke={STROKE} strokeWidth={1.5} />
          );
        });

        return (
          <g key={i}>
            {/* Water */}
            {waterH > 0 && (
              <rect x={x + 1} y={waterY} width={bekasW - 2} height={waterH} fill={WATER} />
            )}
            {/* Container outline (U-shape) */}
            <path
              d={`M ${x} ${topY} L ${x} ${bottomY} L ${x + bekasW} ${bottomY} L ${x + bekasW} ${topY}`}
              fill="none"
              stroke={STROKE}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {/* Rim */}
            <line x1={x - 3} y1={topY} x2={x + bekasW + 3} y2={topY} stroke={STROKE} strokeWidth={2.5} />
            {ticks}
            {/* Water surface line */}
            {waterH > 0 && (
              <line x1={x + 1} y1={waterY} x2={x + bekasW - 1} y2={waterY} stroke={STROKE} strokeWidth={1.5} />
            )}
            {/* Label */}
            <text
              x={cx}
              y={bottomY + 14}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fill={STROKE}
              fontFamily="sans-serif"
            >
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
