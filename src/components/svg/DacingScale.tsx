interface Props {
  leftLabel: string;
  rightCount: number;
  tilt: "left" | "right" | "balance";
}

const FILL = "#BFDBFE";
const STROKE = "#374151";
const UNIT = "#FCD34D";

export function DacingScale({ leftLabel, rightCount, tilt }: Props) {
  const cx = 140;
  const pivotY = 70;
  const beamLen = 100;

  const angleDeg = tilt === "left" ? 15 : tilt === "right" ? -15 : 0;
  const angle = (angleDeg * Math.PI) / 180;

  const lx = cx - beamLen * Math.cos(angle);
  const ly = pivotY + beamLen * Math.sin(angle);
  const rx = cx + beamLen * Math.cos(angle);
  const ry = pivotY - beamLen * Math.sin(angle);

  // Plate positions (hang below beam ends)
  const plateDrop = 30;
  const plateW = 60;
  const plateH = 8;
  const lpx = lx;
  const lpy = ly + plateDrop;
  const rpx = rx;
  const rpy = ry + plateDrop;

  // Right units: small stacked squares
  const count = Math.max(0, Math.min(20, Math.floor(rightCount)));
  const cols = count <= 5 ? count : 5;
  const rows = Math.ceil(count / 5);
  const unitSize = 8;
  const unitGap = 2;
  const gridW = cols * unitSize + Math.max(0, cols - 1) * unitGap;
  const gridStartX = rpx - gridW / 2;
  const gridBaseY = rpy - plateH / 2 - 2;

  const units = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / 5);
    const c = i % 5;
    const ux = gridStartX + c * (unitSize + unitGap);
    const uy = gridBaseY - (r + 1) * (unitSize + unitGap);
    units.push(
      <rect key={i} x={ux} y={uy} width={unitSize} height={unitSize} fill={UNIT} stroke={STROKE} strokeWidth={1} />
    );
  }

  return (
    <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Base */}
      <rect x={cx - 40} y={175} width={80} height={10} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* Pillar */}
      <rect x={cx - 4} y={pivotY} width={8} height={105} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* Pivot dot */}
      <circle cx={cx} cy={pivotY} r={5} fill={STROKE} />
      {/* Beam */}
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />
      {/* Left hanger */}
      <line x1={lx} y1={ly} x2={lpx} y2={lpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
      {/* Right hanger */}
      <line x1={rx} y1={ry} x2={rpx} y2={rpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
      {/* Left plate */}
      <rect x={lpx - plateW / 2} y={lpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
      {/* Right plate */}
      <rect x={rpx - plateW / 2} y={rpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
      {/* Left label */}
      <text
        x={lpx}
        y={lpy - plateH / 2 - 10}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {leftLabel}
      </text>
      {/* Right units */}
      {units}
    </svg>
  );
}
