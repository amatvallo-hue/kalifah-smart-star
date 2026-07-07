interface Item {
  label: string;
  darjah: number;
}

interface Props {
  items: Item[];
  paparNilai?: boolean;
}

const STROKE = "#374151";
const ACCENT = "#3B82F6";

function AngleCell({ cx, cy, darjah, label, paparNilai }: { cx: number; cy: number; darjah: number; label: string; paparNilai: boolean }) {
  const length = 46;
  const vx = cx - 20;
  const vy = cy + 22;
  const bx = vx + length;
  const by = vy;
  const rad = (darjah * Math.PI) / 180;
  const rx = vx + length * Math.cos(-rad);
  const ry = vy + length * Math.sin(-rad);

  const rightAngle = Math.abs(darjah - 90) < 0.5;
  const arcR = 18;
  const startX = vx + arcR;
  const startY = vy;
  const endX = vx + arcR * Math.cos(-rad);
  const endY = vy + arcR * Math.sin(-rad);
  const largeArc = darjah > 180 ? 1 : 0;

  const midRad = ((darjah / 2) * Math.PI) / 180;
  const labelR = arcR + 14;
  const lx = vx + labelR * Math.cos(-midRad);
  const ly = vy + labelR * Math.sin(-midRad);

  const displayText = paparNilai ? `${label} = ${darjah}°` : label;

  return (
    <g>
      <line x1={vx} y1={vy} x2={bx} y2={by} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={vx} y1={vy} x2={rx} y2={ry} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      {rightAngle ? (
        <path d={`M ${vx + 12} ${vy} L ${vx + 12} ${vy - 12} L ${vx} ${vy - 12}`} stroke={ACCENT} strokeWidth={1.8} fill="none" />
      ) : (
        <>
          <path
            d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArc} 0 ${endX} ${endY}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.8}
          />
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
            {darjah}°
          </text>
        </>
      )}
      <circle cx={vx} cy={vy} r={2.5} fill={STROKE} />
      <text x={cx} y={cy + 62} textAnchor="middle" fontSize={13} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
        {displayText}
      </text>
    </g>
  );
}

export function RajahSudut({ items, paparNilai = true }: Props) {
  const list = items ?? [];
  const perRow = 3;
  const cellW = 130;
  const cellH = 140;
  const rows = Math.max(1, Math.ceil(list.length / perRow));
  const cols = Math.min(perRow, list.length || 1);
  const W = cols * cellW + 20;
  const H = rows * cellH + 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 500)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {list.map((it, i) => {
        const r = Math.floor(i / perRow);
        const c = i % perRow;
        const cx = 10 + c * cellW + cellW / 2;
        const cy = 10 + r * cellH + cellH / 2 - 20;
        return <AngleCell key={i} cx={cx} cy={cy} darjah={it.darjah} label={it.label} paparNilai={paparNilai} />;
      })}
    </svg>
  );
}
