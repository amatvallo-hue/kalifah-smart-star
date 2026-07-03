interface Props {
  substance: string;
  litmusColor: "merah" | "biru";
  result: "asid" | "neutral" | "alkali";
}

const BG = "#F8FAFC";
const STROKE = "#374151";
const LABEL = "#1F2937";
const RED = "#DC2626";
const BLUE = "#2563EB";
const LIQUID = "#DBEAFE";
const ARROW = "#6B7280";

function computeAfterColor(litmusColor: "merah" | "biru", result: "asid" | "neutral" | "alkali") {
  if (litmusColor === "merah" && result === "alkali") return BLUE;
  if (litmusColor === "biru" && result === "asid") return RED;
  if (litmusColor === "merah") return RED;
  return BLUE;
}

export function UjianLitmus({ substance, litmusColor, result }: Props) {
  const W = 280;
  const H = 200;

  const beakerLeft = 96;
  const beakerTop = 44;
  const beakerW = 88;
  const beakerH = 90;

  const afterColor = computeAfterColor(litmusColor, result);
  const beforeColor = litmusColor === "merah" ? RED : BLUE;

  const resultLabels: Record<string, string> = {
    asid: "Asid",
    neutral: "Neutral",
    alkali: "Alkali",
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />

      {/* Beaker */}
      <path
        d={`M ${beakerLeft + 6} ${beakerTop} L ${beakerLeft} ${beakerTop + beakerH - 10} Q ${beakerLeft} ${beakerTop + beakerH} ${beakerLeft + 10} ${beakerTop + beakerH} L ${beakerLeft + beakerW - 10} ${beakerTop + beakerH} Q ${beakerLeft + beakerW} ${beakerTop + beakerH} ${beakerLeft + beakerW} ${beakerTop + beakerH - 10} L ${beakerLeft + beakerW - 6} ${beakerTop}`}
        fill={LIQUID}
        stroke={STROKE}
        strokeWidth={2}
      />
      {/* Liquid surface line */}
      <line
        x1={beakerLeft + 8}
        y1={beakerTop + 28}
        x2={beakerLeft + beakerW - 8}
        y2={beakerTop + 28}
        stroke={STROKE}
        strokeWidth={1.5}
        opacity={0.4}
      />
      {/* Substance label below beaker */}
      <text
        x={beakerLeft + beakerW / 2}
        y={beakerTop + beakerH + 18}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
        fill={LABEL}
        fontFamily="sans-serif"
      >
        {substance}
      </text>

      {/* Before strip */}
      <text
        x={36}
        y={70}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
        fill={LABEL}
        fontFamily="sans-serif"
      >
        Sebelum
      </text>
      <rect x={26} y={80} width={20} height={44} rx={4} fill={beforeColor} stroke={STROKE} strokeWidth={1.5} />

      {/* Arrow */}
      <line x1={56} y1={102} x2={76} y2={102} stroke={ARROW} strokeWidth={2} strokeLinecap="round" />
      <polygon points={`76,98 84,102 76,106`} fill={ARROW} />

      {/* After strip */}
      <text
        x={104}
        y={70}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
        fill={LABEL}
        fontFamily="sans-serif"
      >
        Selepas
      </text>
      <rect x={94} y={80} width={20} height={44} rx={4} fill={afterColor} stroke={STROKE} strokeWidth={1.5} />

      {/* Result label */}
      <text
        x={W / 2}
        y={H - 18}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={LABEL}
        fontFamily="sans-serif"
      >
        {resultLabels[result]}
      </text>
    </svg>
  );
}
