interface Props {
  jenis: "matahari" | "bulan";
  labelZon?: boolean;
}

const SKY = "#0F172A";
const SUN = "#FBBF24";
const SUN_GLOW = "#FDE68A";
const EARTH = "#3B82F6";
const EARTH_LAND = "#22C55E";
const MOON = "#94A3B8";
const STROKE = "#94A3B8";
const LABEL = "#E2E8F0";
const UMBRA = "#1E293B";
const PENUMBRA = "#334155";

export function GerhanaDiagram({ jenis, labelZon }: Props) {
  const viewW = 360;
  const viewH = 200;
  const cy = viewH / 2 - 10;

  // Sun on the left
  const sunCx = 40;
  const sunR = 26;

  // Rays from Sun
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x1: sunCx + Math.cos(rad) * (sunR + 3),
      y1: cy + Math.sin(rad) * (sunR + 3),
      x2: sunCx + Math.cos(rad) * (sunR + 10),
      y2: cy + Math.sin(rad) * (sunR + 10),
    };
  });

  // Positions of the middle & right bodies depend on eclipse type
  let middle: { cx: number; r: number; fill: string; label: string; land?: boolean };
  let right: { cx: number; r: number; fill: string; label: string; land?: boolean };
  let casterCx: number; // body casting the shadow
  let casterR: number;
  let targetCx: number; // body receiving shadow

  if (jenis === "matahari") {
    // Sun — Moon — Earth
    middle = { cx: 170, r: 10, fill: MOON, label: "Bulan" };
    right = { cx: 280, r: 22, fill: EARTH, label: "Bumi", land: true };
    casterCx = middle.cx;
    casterR = middle.r;
    targetCx = right.cx;
  } else {
    // Sun — Earth — Moon
    middle = { cx: 190, r: 22, fill: EARTH, label: "Bumi", land: true };
    right = { cx: 305, r: 10, fill: MOON, label: "Bulan" };
    casterCx = middle.cx;
    casterR = middle.r;
    targetCx = right.cx;
  }

  // Shadow cone: starts at caster (wider), narrows toward target
  const coneLen = targetCx - casterCx + 20;
  const startX = casterCx;
  const endX = casterCx + coneLen;
  const umbraStartH = casterR * 0.9;
  const umbraEndH = casterR * 0.15;
  const penumbraStartH = casterR * 1.15;
  const penumbraEndH = casterR * 0.5;

  const umbraPath = `M ${startX} ${cy - umbraStartH} L ${endX} ${cy - umbraEndH} L ${endX} ${cy + umbraEndH} L ${startX} ${cy + umbraStartH} Z`;
  const penumbraPath = `M ${startX} ${cy - penumbraStartH} L ${endX} ${cy - penumbraEndH} L ${endX} ${cy + penumbraEndH} L ${startX} ${cy + penumbraStartH} Z`;

  function bodyLabelY(r: number) {
    return cy + r + 16;
  }

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={viewW} height={viewH} rx={16} fill={SKY} />

      {/* Penumbra (below umbra) */}
      <path d={penumbraPath} fill={PENUMBRA} opacity={0.55} />
      {/* Umbra */}
      <path d={umbraPath} fill={UMBRA} opacity={0.95} />

      {/* Sun glow */}
      <circle cx={sunCx} cy={cy} r={sunR + 5} fill={SUN_GLOW} opacity={0.25} />
      {/* Sun */}
      <circle cx={sunCx} cy={cy} r={sunR} fill={SUN} stroke={STROKE} strokeWidth={1.5} />
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={SUN} strokeWidth={2} />
      ))}
      <text x={sunCx} y={bodyLabelY(sunR)} textAnchor="middle" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
        Matahari
      </text>

      {/* Middle body */}
      <circle cx={middle.cx} cy={cy} r={middle.r} fill={middle.fill} stroke={STROKE} strokeWidth={1.5} />
      {middle.land && (
        <>
          <ellipse cx={middle.cx - 6} cy={cy - 3} rx={5} ry={3} fill={EARTH_LAND} />
          <ellipse cx={middle.cx + 5} cy={cy + 5} rx={6} ry={3} fill={EARTH_LAND} />
        </>
      )}
      <text x={middle.cx} y={bodyLabelY(middle.r)} textAnchor="middle" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
        {middle.label}
      </text>

      {/* Right body */}
      <circle cx={right.cx} cy={cy} r={right.r} fill={right.fill} stroke={STROKE} strokeWidth={1.5} />
      {right.land && (
        <>
          <ellipse cx={right.cx - 6} cy={cy - 3} rx={5} ry={3} fill={EARTH_LAND} />
          <ellipse cx={right.cx + 5} cy={cy + 5} rx={6} ry={3} fill={EARTH_LAND} />
        </>
      )}
      <text x={right.cx} y={bodyLabelY(right.r)} textAnchor="middle" fontSize={11} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
        {right.label}
      </text>

      {/* Zone labels */}
      {labelZon && (
        <g>
          {/* Umbra label */}
          <line
            x1={(startX + endX) / 2}
            y1={cy - 2}
            x2={(startX + endX) / 2 - 10}
            y2={cy - 55}
            stroke={LABEL}
            strokeWidth={1}
          />
          <text x={(startX + endX) / 2 - 12} y={cy - 60} textAnchor="middle" fontSize={10} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
            Umbra
          </text>
          {/* Penumbra label */}
          <line
            x1={(startX + endX) / 2 + 20}
            y1={cy + penumbraStartH / 2 + 4}
            x2={(startX + endX) / 2 + 40}
            y2={cy + 70}
            stroke={LABEL}
            strokeWidth={1}
          />
          <text x={(startX + endX) / 2 + 42} y={cy + 82} textAnchor="middle" fontSize={10} fontWeight={700} fill={LABEL} fontFamily="sans-serif">
            Penumbra
          </text>
        </g>
      )}
    </svg>
  );
}
