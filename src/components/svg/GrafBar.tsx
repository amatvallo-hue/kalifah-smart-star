interface Item {
  nama: string;
  nilai: number;
}

interface Props {
  items: Item[];
  unit?: string;
  orientasi?: "menegak" | "melintang";
}

const BAR = "#3B82F6";
const AXIS = "#374151";

function niceMax(v: number): number {
  if (v <= 0) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  let m = 1;
  if (n <= 1) m = 1;
  else if (n <= 2) m = 2;
  else if (n <= 5) m = 5;
  else m = 10;
  return m * pow;
}

export function GrafBar({ items, unit, orientasi = "menegak" }: Props) {
  const list = items ?? [];
  const maxV = Math.max(1, ...list.map((x) => x.nilai || 0));
  const scale = niceMax(maxV);
  const ticks = 5;

  if (orientasi === "melintang") {
    const rowH = 34;
    const gap = 8;
    const labelW = 90;
    const valW = 44;
    const chartW = 220;
    const width = labelW + chartW + valW + 20;
    const height = list.length * (rowH + gap) + 30;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={Math.min(width, 420)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
        {/* axis */}
        <line x1={labelW} y1={10} x2={labelW} y2={height - 20} stroke={AXIS} strokeWidth={2} />
        <line x1={labelW} y1={height - 20} x2={labelW + chartW} y2={height - 20} stroke={AXIS} strokeWidth={2} />
        {list.map((it, i) => {
          const y = 10 + i * (rowH + gap);
          const w = ((it.nilai || 0) / scale) * chartW;
          return (
            <g key={i}>
              <text x={labelW - 6} y={y + rowH / 2} textAnchor="end" dominantBaseline="central" fontSize={12} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{it.nama}</text>
              <rect x={labelW} y={y} width={Math.max(0, w)} height={rowH} fill={BAR} stroke={AXIS} strokeWidth={1.5} />
              <text x={labelW + w + 6} y={y + rowH / 2} dominantBaseline="central" fontSize={12} fontWeight={700} fill={AXIS} fontFamily="sans-serif">
                {it.nilai}{unit ? ` ${unit}` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // menegak
  const barW = 42;
  const labelFontSize = 12;
  const maxLabelLen = Math.max(1, ...list.map((x) => (x.nama ?? "").length));
  // Rough character-width estimate for sans-serif at labelFontSize
  const approxLabelPx = maxLabelLen * (labelFontSize * 0.58);
  const cellW = barW + 18;
  // Rotate labels when horizontal text would overflow the cell width
  const rotateLabels = approxLabelPx > cellW - 4;
  const gap = rotateLabels ? 28 : 18;
  const chartH = 180;
  const paddingL = 44;
  const paddingR = 16;
  const paddingT = 16;
  // Extra bottom padding when labels are rotated to fit diagonal text
  const paddingB = rotateLabels ? Math.min(96, 30 + Math.ceil(approxLabelPx * 0.55)) : 40;
  const width = paddingL + paddingR + list.length * (barW + gap);
  const height = paddingT + chartH + paddingB;
  const maxRenderW = Math.max(420, width); // don't downscale when we deliberately widened for long labels

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={Math.min(width, maxRenderW)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {/* y ticks */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (scale / ticks) * i;
        const y = paddingT + chartH - (i / ticks) * chartH;
        return (
          <g key={i}>
            <line x1={paddingL} y1={y} x2={width - paddingR} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <text x={paddingL - 6} y={y} textAnchor="end" dominantBaseline="central" fontSize={11} fill={AXIS} fontFamily="sans-serif">{Math.round(v)}</text>
          </g>
        );
      })}
      {/* axes */}
      <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + chartH} stroke={AXIS} strokeWidth={2} />
      <line x1={paddingL} y1={paddingT + chartH} x2={width - paddingR} y2={paddingT + chartH} stroke={AXIS} strokeWidth={2} />
      {list.map((it, i) => {
        const h = ((it.nilai || 0) / scale) * chartH;
        const x = paddingL + gap / 2 + i * (barW + gap);
        const y = paddingT + chartH - h;
        const labelCx = x + barW / 2;
        const labelBaseY = paddingT + chartH + (rotateLabels ? 12 : 16);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(0, h)} fill={BAR} stroke={AXIS} strokeWidth={1.5} />
            <text x={labelCx} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{it.nilai}</text>
            {rotateLabels ? (
              <text
                x={labelCx}
                y={labelBaseY}
                textAnchor="end"
                fontSize={labelFontSize}
                fontWeight={700}
                fill={AXIS}
                fontFamily="sans-serif"
                transform={`rotate(-35 ${labelCx} ${labelBaseY})`}
              >
                {it.nama}
              </text>
            ) : (
              <text x={labelCx} y={labelBaseY} textAnchor="middle" fontSize={labelFontSize} fontWeight={700} fill={AXIS} fontFamily="sans-serif">{it.nama}</text>
            )}
          </g>
        );
      })}
      {unit && (
        <text x={paddingL} y={paddingT - 4} fontSize={11} fill={AXIS} fontFamily="sans-serif">({unit})</text>
      )}
    </svg>
  );
}
