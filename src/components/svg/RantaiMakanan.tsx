interface Props {
  chain: string[];
  highlightIndex?: number;
}

const BG = "#F8FAFC";
const STROKE = "#374151";
const CARD_FILL = "#E2E8F0";
const ACCENT_ARROW = "#16A34A";
const LABEL = "#1F2937";
const HIGHLIGHT_STROKE = "#F59E0B";
const HIGHLIGHT_FILL = "#FEF3C7";

export function RantaiMakanan({ chain, highlightIndex }: Props) {
  const W = 360;
  const H = 180;
  const n = Math.max(2, Math.min(4, chain.length));
  const marginX = 20;
  const cardH = 52;
  const gap = 28;
  const avail = W - marginX * 2;
  const cardW = Math.max(56, (avail - (n - 1) * gap) / n);
  const startX = (W - (n * cardW + (n - 1) * gap)) / 2;
  const cardY = (H - cardH) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      {chain.slice(0, n).map((item, i) => {
        const x = startX + i * (cardW + gap);
        const isHighlight = highlightIndex === i;
        const fontSize = item.length > 10 ? 10 : item.length > 7 ? 11 : 12;
        return (
          <g key={i}>
            <rect
              x={x}
              y={cardY}
              width={cardW}
              height={cardH}
              rx={10}
              fill={isHighlight ? HIGHLIGHT_FILL : CARD_FILL}
              stroke={isHighlight ? HIGHLIGHT_STROKE : STROKE}
              strokeWidth={isHighlight ? 3 : 2}
            />
            <text
              x={x + cardW / 2}
              y={cardY + cardH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight={700}
              fill={LABEL}
              fontFamily="sans-serif"
            >
              {item}
            </text>
          </g>
        );
      })}
      {/* Arrows between consecutive cards */}
      {Array.from({ length: n - 1 }).map((_, i) => {
        const leftCardRight = startX + i * (cardW + gap) + cardW;
        const rightCardLeft = startX + (i + 1) * (cardW + gap);
        const y = H / 2;
        const arrowSize = 7;
        return (
          <g key={`arrow-${i}`}>
            <line
              x1={leftCardRight + 4}
              y1={y}
              x2={rightCardLeft - 4}
              y2={y}
              stroke={ACCENT_ARROW}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <polygon
              points={`${rightCardLeft - 4},${y - arrowSize / 2} ${rightCardLeft - 4 + arrowSize},${y} ${rightCardLeft - 4},${y + arrowSize / 2}`}
              fill={ACCENT_ARROW}
            />
          </g>
        );
      })}
    </svg>
  );
}
