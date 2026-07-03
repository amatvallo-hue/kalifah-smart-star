interface Props {
  objek: string;
  hasil: "terapung" | "tenggelam";
}

const WATER = "#BFDBFE";
const STROKE = "#374151";
const OBJ = "#FCD34D";

export function KetumpatanDiagram({ objek, hasil }: Props) {
  const viewW = 280;
  const viewH = 200;
  const tankX = 60;
  const tankY = 40;
  const tankW = 160;
  const tankH = 130;
  const waterTop = tankY + 30;
  const waterBottom = tankY + tankH;

  const objW = 44;
  const objH = 26;
  const objX = tankX + tankW / 2 - objW / 2;
  const objY =
    hasil === "terapung"
      ? waterTop - objH / 2
      : waterBottom - objH - 4;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Water */}
      <rect x={tankX + 1} y={waterTop} width={tankW - 2} height={waterBottom - waterTop} fill={WATER} />
      {/* Water surface line */}
      <line x1={tankX + 1} y1={waterTop} x2={tankX + tankW - 1} y2={waterTop} stroke={STROKE} strokeWidth={1.5} />
      {/* Tank outline (U shape) */}
      <path
        d={`M ${tankX} ${tankY} L ${tankX} ${tankY + tankH} L ${tankX + tankW} ${tankY + tankH} L ${tankX + tankW} ${tankY}`}
        fill="none"
        stroke={STROKE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Rim */}
      <line x1={tankX - 4} y1={tankY} x2={tankX + tankW + 4} y2={tankY} stroke={STROKE} strokeWidth={2.5} />

      {/* Object */}
      <rect
        x={objX}
        y={objY}
        width={objW}
        height={objH}
        fill={OBJ}
        stroke={STROKE}
        strokeWidth={2}
        rx={4}
      />
      <text
        x={objX + objW / 2}
        y={objY + objH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {objek}
      </text>

      {/* Result label */}
      <text
        x={viewW / 2}
        y={viewH - 8}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {hasil === "terapung" ? "Terapung" : "Tenggelam"}
      </text>
    </svg>
  );
}
