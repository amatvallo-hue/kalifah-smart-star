interface Props {
  shape: "kotak" | "kon" | "piramid" | "segitiga";
  baseWidth: "luas" | "sempit";
  stable: boolean;
}

const W = 280;
const H = 200;
const GROUND_Y = 168;
const STROKE = "#374151";
const FILL = "#E2E8F0";
const BG = "#F8FAFC";
const CG_DOT = "#DC2626";
const GREEN = "#16A34A";
const RED = "#DC2626";
const LABEL = "#1F2937";

export function RajahKestabilan({ shape, baseWidth, stable }: Props) {
  const tilt = stable ? 0 : 22;
  const bw = baseWidth === "luas" ? 1 : 0;

  // Center horizontally
  const cx = W / 2;

  // Base dimensions per shape
  let baseW: number;
  let height: number;
  let cgX: number;
  let cgY: number;
  let pivotX: number;
  let pivotY: number;
  let body: React.ReactNode = null;

  if (shape === "kotak") {
    baseW = bw ? 84 : 42;
    height = 96;
    const x = cx - baseW / 2;
    const y = GROUND_Y - height;
    cgX = cx;
    cgY = y + height / 2;
    pivotX = x + baseW;
    pivotY = GROUND_Y;
    body = (
      <>
        <rect x={x} y={y} width={baseW} height={height} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        {/* crate cross detail */}
        <line x1={x + 14} y1={y + 14} x2={x + baseW - 14} y2={y + height - 14} stroke={STROKE} strokeWidth={1.5} opacity={0.35} />
        <line x1={x + baseW - 14} y1={y + 14} x2={x + 14} y2={y + height - 14} stroke={STROKE} strokeWidth={1.5} opacity={0.35} />
      </>
    );
  } else if (shape === "kon") {
    baseW = bw ? 100 : 50;
    height = 100;
    const left = cx - baseW / 2;
    const right = cx + baseW / 2;
    const top = GROUND_Y - height;
    cgX = cx;
    cgY = GROUND_Y - height / 3;
    pivotX = right;
    pivotY = GROUND_Y;
    body = (
      <>
        <polygon points={`${left},${GROUND_Y} ${cx},${top} ${right},${GROUND_Y}`} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* rounded base hint */}
        <ellipse cx={cx} cy={GROUND_Y} rx={baseW / 2} ry={6} fill={FILL} stroke={STROKE} strokeWidth={2} />
      </>
    );
  } else if (shape === "piramid") {
    baseW = bw ? 110 : 70;
    height = 90;
    const left = cx - baseW / 2;
    const right = cx + baseW / 2;
    const top = GROUND_Y - height;
    cgX = cx;
    cgY = GROUND_Y - height / 3;
    pivotX = right;
    pivotY = GROUND_Y;
    body = (
      <polygon points={`${left},${GROUND_Y} ${cx},${top} ${right},${GROUND_Y}`} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
    );
  } else {
    // segitiga (truss frame)
    baseW = bw ? 100 : 55;
    height = 90;
    const left = cx - baseW / 2;
    const right = cx + baseW / 2;
    const top = GROUND_Y - height;
    cgX = cx;
    cgY = GROUND_Y - height / 2;
    pivotX = right;
    pivotY = GROUND_Y;
    const midLeft = { x: (left + cx) / 2, y: (top + GROUND_Y) / 2 };
    const midRight = { x: (right + cx) / 2, y: (top + GROUND_Y) / 2 };
    body = (
      <>
        <polygon points={`${left},${GROUND_Y} ${cx},${top} ${right},${GROUND_Y}`} fill="none" stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* internal truss lines */}
        <line x1={left} y1={GROUND_Y} x2={cx} y2={top} stroke={STROKE} strokeWidth={2.5} />
        <line x1={right} y1={GROUND_Y} x2={cx} y2={top} stroke={STROKE} strokeWidth={2.5} />
        <line x1={left} y1={GROUND_Y} x2={right} y2={GROUND_Y} stroke={STROKE} strokeWidth={2.5} />
        <line x1={left} y1={GROUND_Y} x2={midRight.x} y2={midRight.y} stroke={STROKE} strokeWidth={1.5} opacity={0.6} />
        <line x1={right} y1={GROUND_Y} x2={midLeft.x} y2={midLeft.y} stroke={STROKE} strokeWidth={1.5} opacity={0.6} />
        <line x1={cx} y1={top} x2={cx} y2={GROUND_Y} stroke={STROKE} strokeWidth={1.5} opacity={0.6} />
      </>
    );
  }

  // CG line goes down to ground
  const cgGroundY = GROUND_Y;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />

      {/* Ground */}
      <line x1={20} y1={GROUND_Y} x2={W - 20} y2={GROUND_Y} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />

      {/* Shape group with optional tilt */}
      <g transform={`rotate(${tilt}, ${pivotX}, ${pivotY})`}>
        {body}

        {/* CG dot */}
        <circle cx={cgX} cy={cgY} r={3.5} fill={CG_DOT} />
        {/* Dashed vertical line from CG to ground */}
        <line x1={cgX} y1={cgY} x2={cgX} y2={cgGroundY} stroke={CG_DOT} strokeWidth={1.5} strokeDasharray="4 3" />
      </g>

      {/* Status icon near top-right of the shape area (outside rotate group so it stays upright) */}
      {stable ? (
        <g>
          <circle cx={W - 34} cy={28} r={14} fill="none" stroke={GREEN} strokeWidth={2} />
          <polyline points={`${W - 40},28 ${W - 32},36 ${W - 24},22`} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <circle cx={W - 34} cy={28} r={14} fill="none" stroke={RED} strokeWidth={2} />
          <line x1={W - 40} y1={22} x2={W - 28} y2={34} stroke={RED} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={W - 28} y1={22} x2={W - 40} y2={34} stroke={RED} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )}

      {/* Falling motion arcs when unstable */}
      {!stable && (
        <g>
          <path d={`M ${cx + 10} ${GROUND_Y - height - 20} Q ${cx + 40} ${GROUND_Y - height + 10} ${cx + 60} ${GROUND_Y - 30}`} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.35} strokeDasharray="5 4" />
          <path d={`M ${cx - 10} ${GROUND_Y - height - 10} Q ${cx + 20} ${GROUND_Y - height + 30} ${cx + 40} ${GROUND_Y - 20}`} fill="none" stroke={RED} strokeWidth={1.5} opacity={0.25} strokeDasharray="5 4" />
        </g>
      )}

      {/* Label below */}
      <text x={cx} y={GROUND_Y + 22} textAnchor="middle" fontSize={13} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
        {stable ? "Stabil" : "Tidak Stabil"}
      </text>
    </svg>
  );
}
