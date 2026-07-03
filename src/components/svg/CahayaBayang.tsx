interface Props {
  sumber: "matahari" | "lampu";
  objek: "legap" | "lutsinar";
  bayang: "jelas" | "tiada";
}

const FLOOR = "#374151";
const OBJ_FILL = "#BFDBFE";
const OBJ_STROKE = "#374151";
const SUN = "#FCD34D";
const RAY = "#FCD34D";
const SHADOW = "#4B5563";

export function CahayaBayang({ sumber, objek, bayang }: Props) {
  const isSun = sumber === "matahari";
  const opaque = objek === "legap";
  const hasShadow = bayang === "jelas";

  // Light direction: from top-left
  const sx = 40;
  const sy = 40;

  // Floor line
  const floorY = 170;

  // Object standing on floor
  const objX = 130;
  const objY = 110;
  const objW = 40;
  const objH = 60;

  // Shadow on floor to the right (opposite light)
  const shadowX = objX + objW + 8;
  const shadowY = floorY - 2;
  const shadowW = 70;
  const shadowH = 10;

  const rays = isSun
    ? Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 5) * 60 + 30; // spread from 30deg to 90deg
        const rad = (angle * Math.PI) / 180;
        const len = 70;
        const x2 = sx + len * Math.cos(rad);
        const y2 = sy + len * Math.sin(rad);
        return <line key={i} x1={sx} y1={sy} x2={x2} y2={y2} stroke={RAY} strokeWidth={2} strokeLinecap="round" opacity={0.6} />;
      })
    : null;

  return (
    <svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Light source */}
      {isSun ? (
        <g>
          <circle cx={sx} cy={sy} r={22} fill={SUN} stroke={OBJ_STROKE} strokeWidth={2} />
          {rays}
        </g>
      ) : (
        <g>
          {/* Lamp base */}
          <rect x={sx - 16} y={sy + 18} width={32} height={8} rx={2} fill={OBJ_FILL} stroke={OBJ_STROKE} strokeWidth={2} />
          {/* Lamp neck */}
          <line x1={sx} y1={sy + 18} x2={sx} y2={sy + 6} stroke={OBJ_STROKE} strokeWidth={3} strokeLinecap="round" />
          {/* Lamp bulb */}
          <circle cx={sx} cy={sy} r={14} fill={SUN} stroke={OBJ_STROKE} strokeWidth={2} />
          {/* Lamp shade */}
          <path d={`M ${sx - 24} ${sy - 4} Q ${sx} ${sy - 28} ${sx + 24} ${sy - 4} L ${sx + 16} ${sy + 6} L ${sx - 16} ${sy + 6} Z`} fill={OBJ_FILL} stroke={OBJ_STROKE} strokeWidth={2} />
          {/* Light rays from lamp */}
          <line x1={sx} y1={sy + 14} x2={objX} y2={objY} stroke={RAY} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} />
          <line x1={sx} y1={sy + 14} x2={objX + objW} y2={objY} stroke={RAY} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} />
        </g>
      )}

      {/* Floor line */}
      <line x1={20} y1={floorY} x2={260} y2={floorY} stroke={FLOOR} strokeWidth={3} strokeLinecap="round" />

      {/* Shadow */}
      {hasShadow && (
        <ellipse cx={shadowX + shadowW / 2} cy={shadowY + shadowH / 2} rx={shadowW / 2} ry={shadowH / 2} fill={SHADOW} opacity={0.85} />
      )}

      {/* Object */}
      {opaque ? (
        <rect x={objX} y={objY} width={objW} height={objH} rx={4} fill={OBJ_FILL} stroke={OBJ_STROKE} strokeWidth={2.5} />
      ) : (
        <g>
          <rect x={objX} y={objY} width={objW} height={objH} rx={4} fill={OBJ_FILL} stroke={OBJ_STROKE} strokeWidth={2.5} opacity={0.45} />
          {/* Transparency indicator: dashed outline */}
          <rect x={objX} y={objY} width={objW} height={objH} rx={4} fill="none" stroke={OBJ_STROKE} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} />
        </g>
      )}
    </svg>
  );
}
