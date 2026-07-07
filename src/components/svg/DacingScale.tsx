interface OldProps {
  leftLabel?: string;
  rightCount?: number;
  tilt?: "left" | "right" | "balance";
}

interface NewProps {
  kiriObjek?: string;
  kiriBilangan?: number;
  kananBacaan?: number;
  unit?: string;
}

type Props = OldProps & NewProps;

const FILL = "#BFDBFE";
const STROKE = "#374151";
const UNIT = "#FCD34D";
const WEIGHT = "#9CA3AF";

function formatBacaan(nilai: number, unit: string): string {
  if (unit === "g" && nilai >= 1000) {
    const kg = Math.floor(nilai / 1000);
    const g = nilai - kg * 1000;
    return g === 0 ? `${kg} kg` : `${kg} kg ${g} g`;
  }
  if (unit === "ml" && nilai >= 1000) {
    const l = Math.floor(nilai / 1000);
    const ml = nilai - l * 1000;
    return ml === 0 ? `${l} L` : `${l} L ${ml} ml`;
  }
  return `${nilai} ${unit}`.trim();
}

export function DacingScale(props: Props) {
  const isNew =
    props.kiriObjek !== undefined ||
    props.kiriBilangan !== undefined ||
    props.kananBacaan !== undefined ||
    props.unit !== undefined;

  const cx = 140;
  const pivotY = 70;
  const beamLen = 100;

  // OLD mode: keep original behaviour
  if (!isNew) {
    const tilt = props.tilt ?? "balance";
    const rightCount = props.rightCount ?? 0;
    const leftLabel = props.leftLabel ?? "";
    const angleDeg = tilt === "left" ? 15 : tilt === "right" ? -15 : 0;
    const angle = (angleDeg * Math.PI) / 180;
    const lx = cx - beamLen * Math.cos(angle);
    const ly = pivotY + beamLen * Math.sin(angle);
    const rx = cx + beamLen * Math.cos(angle);
    const ry = pivotY - beamLen * Math.sin(angle);
    const plateDrop = 30;
    const plateW = 60;
    const plateH = 8;
    const lpx = lx;
    const lpy = ly + plateDrop;
    const rpx = rx;
    const rpy = ry + plateDrop;
    const count = Math.max(0, Math.min(20, Math.floor(rightCount)));
    const cols = count <= 5 ? count : 5;
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
      units.push(<rect key={i} x={ux} y={uy} width={unitSize} height={unitSize} fill={UNIT} stroke={STROKE} strokeWidth={1} />);
    }
    return (
      <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
        <rect x={cx - 40} y={175} width={80} height={10} fill={FILL} stroke={STROKE} strokeWidth={2} />
        <rect x={cx - 4} y={pivotY} width={8} height={105} fill={FILL} stroke={STROKE} strokeWidth={2} />
        <circle cx={cx} cy={pivotY} r={5} fill={STROKE} />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />
        <line x1={lx} y1={ly} x2={lpx} y2={lpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
        <line x1={rx} y1={ry} x2={rpx} y2={rpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
        <rect x={lpx - plateW / 2} y={lpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
        <rect x={rpx - plateW / 2} y={rpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
        <text x={lpx} y={lpy - plateH / 2 - 10} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{leftLabel}</text>
        {units}
      </svg>
    );
  }

  // NEW mode — always balanced
  const kiriObjek = props.kiriObjek ?? "Item";
  const kiriBilangan = Math.max(0, Math.floor(props.kiriBilangan ?? 0));
  const kananBacaan = props.kananBacaan ?? 0;
  const unit = props.unit ?? "";

  const lx = cx - beamLen;
  const ly = pivotY;
  const rx = cx + beamLen;
  const ry = pivotY;
  const plateDrop = 30;
  const plateW = 70;
  const plateH = 8;
  const lpx = lx;
  const lpy = ly + plateDrop;
  const rpx = rx;
  const rpy = ry + plateDrop;

  // Left plate: stack up to 10 small boxes
  const maxShow = 10;
  const showCount = Math.min(kiriBilangan, maxShow);
  const overflow = kiriBilangan > maxShow;
  const bxW = 10;
  const bxH = 10;
  const bxGap = 2;
  const cols = Math.min(5, Math.max(1, showCount));
  const rows = Math.ceil(showCount / 5);
  const gridW = cols * bxW + Math.max(0, cols - 1) * bxGap;
  const gridStartX = lpx - gridW / 2;
  const baseY = lpy - plateH / 2 - 2;
  const boxes: React.ReactNode[] = [];
  for (let i = 0; i < showCount; i++) {
    const r = Math.floor(i / 5);
    const c = i % 5;
    const ux = gridStartX + c * (bxW + bxGap);
    const uy = baseY - (r + 1) * (bxH + bxGap);
    boxes.push(<rect key={i} x={ux} y={uy} width={bxW} height={bxH} fill={UNIT} stroke={STROKE} strokeWidth={1} />);
  }

  const bacaanText = formatBacaan(kananBacaan, unit);

  return (
    <svg viewBox="0 0 300 210" width="300" height="210" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Base */}
      <rect x={cx - 40} y={185} width={80} height={10} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* Pillar */}
      <rect x={cx - 4} y={pivotY} width={8} height={115} fill={FILL} stroke={STROKE} strokeWidth={2} />
      {/* Pivot */}
      <circle cx={cx} cy={pivotY} r={5} fill={STROKE} />
      {/* Beam (level) */}
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />
      {/* Hangers */}
      <line x1={lx} y1={ly} x2={lpx} y2={lpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
      <line x1={rx} y1={ry} x2={rpx} y2={rpy - plateH / 2} stroke={STROKE} strokeWidth={1.5} />
      {/* Plates */}
      <rect x={lpx - plateW / 2} y={lpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
      <rect x={rpx - plateW / 2} y={rpy - plateH / 2} width={plateW} height={plateH} fill={FILL} stroke={STROKE} strokeWidth={2} rx={2} />
      {/* Left objects */}
      {boxes}
      {/* Left label */}
      <text x={lpx} y={lpy + 18} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
        {kiriObjek} ×{kiriBilangan}
      </text>
      {overflow && (
        <text x={lpx} y={baseY - 6} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
          +{kiriBilangan - maxShow}
        </text>
      )}
      {/* Right weight */}
      <rect
        x={rpx - 22}
        y={rpy - plateH / 2 - 30}
        width={44}
        height={28}
        rx={4}
        fill={WEIGHT}
        stroke={STROKE}
        strokeWidth={2}
      />
      <text x={rpx} y={rpy - plateH / 2 - 16} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
        {bacaanText}
      </text>
      <text x={rpx} y={rpy + 18} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
        {bacaanText}
      </text>
    </svg>
  );
}
