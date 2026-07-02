interface Item {
  label: string;
  length: number;
}

interface Props {
  items: Item[];
}

const BAR = "#93C5FD";
const STROKE = "#374151";

export function BarisanPanjang({ items }: Props) {
  const list = items ?? [];
  const n = Math.max(1, list.length);
  const max = Math.max(1, ...list.map((i) => i.length || 0));

  const viewW = 280;
  const viewH = 200;
  const labelW = 70;
  const padX = 10;
  const padY = 14;
  const availableW = viewW - labelW - padX - 10;
  const rowH = (viewH - padY * 2) / n;
  const barH = Math.min(24, rowH - 6);

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {list.map((it, i) => {
        const cy = padY + rowH * i + rowH / 2;
        const w = Math.max(2, ((it.length || 0) / max) * availableW);
        const x = labelW + padX;
        return (
          <g key={i}>
            <text
              x={labelW}
              y={cy}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fill={STROKE}
              fontFamily="sans-serif"
            >
              {it.label}
            </text>
            <rect
              x={x}
              y={cy - barH / 2}
              width={w}
              height={barH}
              fill={BAR}
              stroke={STROKE}
              strokeWidth={2}
              rx={3}
            />
            <text
              x={x + w + 6}
              y={cy}
              dominantBaseline="central"
              fontSize={11}
              fontWeight={600}
              fill={STROKE}
              fontFamily="sans-serif"
            >
              {it.length}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
