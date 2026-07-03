interface Props {
  status: "lengkap" | "terputus";
  label?: string;
}

const STROKE = "#374151";
const WIRE = "#374151";
const BULB_ON = "#FCD34D";
const BULB_OFF = "#E5E7EB";
const FILL = "#BFDBFE";

export function LitarElektrik({ status, label }: Props) {
  const isComplete = status === "lengkap";

  // Loop dimensions
  const leftX = 50;
  const rightX = 230;
  const topY = 50;
  const bottomY = 150;

  // Battery on left side
  const batX = leftX;
  const batY = (topY + bottomY) / 2;

  // Bulb on right side
  const bulbCX = rightX;
  const bulbCY = (topY + bottomY) / 2;
  const bulbR = 18;

  // Break position (middle of top wire)
  const breakX = (leftX + rightX) / 2;
  const breakGap = 14;

  return (
    <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Wire segments */}
      {/* Bottom wire (always complete) */}
      <line x1={leftX} y1={bottomY} x2={rightX} y2={bottomY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />

      {/* Left wire (battery to top/bottom) */}
      <line x1={leftX} y1={topY} x2={leftX} y2={batY - 18} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />
      <line x1={leftX} y1={batY + 18} x2={leftX} y2={bottomY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />

      {/* Right wire (bulb to top/bottom) */}
      <line x1={rightX} y1={topY} x2={rightX} y2={bulbCY - bulbR - 4} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />
      <line x1={rightX} y1={bulbCY + bulbR + 4} x2={rightX} y2={bottomY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />

      {/* Top wire: either complete or broken */}
      {isComplete ? (
        <line x1={leftX} y1={topY} x2={rightX} y2={topY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />
      ) : (
        <g>
          <line x1={leftX} y1={topY} x2={breakX - breakGap / 2} y2={topY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />
          <line x1={breakX + breakGap / 2} y1={topY} x2={rightX} y2={topY} stroke={WIRE} strokeWidth={3} strokeLinecap="round" />
          {/* Small gap indicators */}
          <circle cx={breakX - breakGap / 2 - 2} cy={topY} r={2} fill={STROKE} />
          <circle cx={breakX + breakGap / 2 + 2} cy={topY} r={2} fill={STROKE} />
        </g>
      )}

      {/* Battery symbol (two parallel lines: long +, short -) */}
      <g>
        <line x1={batX - 10} y1={batY - 8} x2={batX + 10} y2={batY - 8} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
        <line x1={batX - 6} y1={batY + 8} x2={batX + 6} y2={batY + 8} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
        {/* Battery body outline */}
        <rect x={batX - 14} y={batY - 18} width={28} height={36} rx={3} fill={FILL} stroke={STROKE} strokeWidth={2} opacity={0.3} />
      </g>

      {/* Bulb symbol */}
      <g>
        {/* Bulb circle */}
        <circle cx={bulbCX} cy={bulbCY} r={bulbR} fill={isComplete ? BULB_ON : BULB_OFF} stroke={STROKE} strokeWidth={2.5} />
        {/* Filament zigzag */}
        <path
          d={`M ${bulbCX - 10} ${bulbCY + 6} L ${bulbCX - 6} ${bulbCY - 2} L ${bulbCX - 2} ${bulbCY + 6} L ${bulbCX + 2} ${bulbCY - 2} L ${bulbCX + 6} ${bulbCY + 6} L ${bulbCX + 10} ${bulbCY - 2}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow rays when on */}
        {isComplete && (
          <>
            <line x1={bulbCX - 24} y1={bulbCY} x2={bulbCX - 30} y2={bulbCY} stroke={BULB_ON} strokeWidth={2} strokeLinecap="round" />
            <line x1={bulbCX + 24} y1={bulbCY} x2={bulbCX + 30} y2={bulbCY} stroke={BULB_ON} strokeWidth={2} strokeLinecap="round" />
            <line x1={bulbCX} y1={bulbCY - 24} x2={bulbCX} y2={bulbCY - 30} stroke={BULB_ON} strokeWidth={2} strokeLinecap="round" />
            <line x1={bulbCX} y1={bulbCY + 24} x2={bulbCX} y2={bulbCY + 30} stroke={BULB_ON} strokeWidth={2} strokeLinecap="round" />
          </>
        )}
      </g>

      {/* Optional label near the top wire / break */}
      {label && (
        <text
          x={breakX}
          y={topY - 12}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
          fill={STROKE}
          fontFamily="sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
