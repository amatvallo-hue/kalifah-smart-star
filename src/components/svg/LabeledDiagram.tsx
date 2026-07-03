interface Label {
  text: string;
  x: number;
  y: number;
}

interface Props {
  diagramType: "human_body" | "plant_parts" | "teeth" | string;
  labels?: Label[];
}

const FILL = "#BFDBFE";
const STROKE = "#374151";
const LEAF = "#4ADE80";
const FLOWER = "#FCD34D";
const SKIN = "#FDE1D3";
const SOIL = "#8B5A2B";

// Anchor points for each known label to draw a leader line to.
const HUMAN_ANCHORS: Record<string, { x: number; y: number }> = {
  mata: { x: 128, y: 78 },
  telinga: { x: 168, y: 88 },
  hidung: { x: 140, y: 92 },
  mulut: { x: 140, y: 108 },
  lidah: { x: 140, y: 108 },
  kulit: { x: 108, y: 92 },
  rambut: { x: 140, y: 48 },
};

const PLANT_ANCHORS: Record<string, { x: number; y: number }> = {
  bunga: { x: 140, y: 55 },
  daun: { x: 105, y: 95 },
  batang: { x: 140, y: 115 },
  akar: { x: 140, y: 165 },
  tanah: { x: 140, y: 145 },
};

const TEETH_ANCHORS: Record<string, { x: number; y: number }> = {
  "gigi kacip": { x: 220, y: 105 },
  kacip: { x: 220, y: 105 },
  insisor: { x: 220, y: 105 },
  "gigi taring": { x: 178, y: 100 },
  taring: { x: 178, y: 100 },
  kanin: { x: 178, y: 100 },
  "gigi geraham": { x: 100, y: 100 },
  geraham: { x: 100, y: 100 },
  molar: { x: 100, y: 100 },
};

function anchorFor(diagramType: string, text: string): { x: number; y: number } | null {
  const key = text.trim().toLowerCase();
  if (diagramType === "human_body") return HUMAN_ANCHORS[key] ?? null;
  if (diagramType === "plant_parts") return PLANT_ANCHORS[key] ?? null;
  if (diagramType === "teeth") return TEETH_ANCHORS[key] ?? null;
  return null;
}

function HumanBody() {
  return (
    <g>
      {/* Shoulders */}
      <path
        d="M 60 175 Q 90 135 140 135 Q 190 135 220 175 L 220 200 L 60 200 Z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Neck */}
      <rect x={125} y={120} width={30} height={20} fill={SKIN} stroke={STROKE} strokeWidth={2} />
      {/* Head */}
      <ellipse cx={140} cy={80} rx={45} ry={52} fill={SKIN} stroke={STROKE} strokeWidth={2.5} />
      {/* Hair cap */}
      <path
        d="M 96 65 Q 100 32 140 30 Q 180 32 184 65 Q 178 50 140 48 Q 102 50 96 65 Z"
        fill={STROKE}
        stroke={STROKE}
        strokeWidth={1.5}
      />
      {/* Ears */}
      <ellipse cx={97} cy={85} rx={6} ry={10} fill={SKIN} stroke={STROKE} strokeWidth={2} />
      <ellipse cx={183} cy={85} rx={6} ry={10} fill={SKIN} stroke={STROKE} strokeWidth={2} />
      {/* Eyes */}
      <circle cx={124} cy={78} r={4} fill={STROKE} />
      <circle cx={156} cy={78} r={4} fill={STROKE} />
      {/* Nose */}
      <path d="M 140 82 L 136 96 L 144 96 Z" fill="none" stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
      {/* Mouth */}
      <path d="M 128 108 Q 140 116 152 108" fill="none" stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function PlantParts() {
  return (
    <g>
      {/* Soil line */}
      <path d="M 30 145 Q 140 135 250 145 L 250 155 Q 140 148 30 155 Z" fill={SOIL} stroke={STROKE} strokeWidth={2} />
      {/* Roots */}
      <path
        d="M 140 148 L 140 190 M 140 155 L 115 180 M 140 155 L 165 180 M 140 165 L 100 188 M 140 165 L 180 188"
        stroke={STROKE}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <path d="M 138 145 Q 140 100 140 70" stroke={LEAF} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* Leaves */}
      <path d="M 140 105 Q 90 90 78 105 Q 100 115 140 110 Z" fill={LEAF} stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 140 90 Q 190 75 202 90 Q 180 100 140 95 Z" fill={LEAF} stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
      {/* Flower */}
      <g>
        {[0, 72, 144, 216, 288].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 140 + 14 * Math.cos(rad);
          const cy = 55 + 14 * Math.sin(rad);
          return <circle key={deg} cx={cx} cy={cy} r={11} fill={FLOWER} stroke={STROKE} strokeWidth={2} />;
        })}
        <circle cx={140} cy={55} r={8} fill="#F97316" stroke={STROKE} strokeWidth={2} />
      </g>
    </g>
  );
}

const TOOTH = "#F9FAFB";
const GUM = "#F472B6";

function Teeth() {
  return (
    <g>
      {/* Jaw outline (side view of open mouth) */}
      <path
        d="M 40 130 Q 80 90 160 82 Q 220 82 250 100 L 250 118 Q 220 108 160 108 Q 90 112 45 148 Z"
        fill={GUM}
        stroke={STROKE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Molars (back / left) - broad, flat */}
      <rect x={70} y={88} width={18} height={16} rx={3} fill={TOOTH} stroke={STROKE} strokeWidth={1.8} />
      <rect x={92} y={87} width={18} height={16} rx={3} fill={TOOTH} stroke={STROKE} strokeWidth={1.8} />
      <rect x={114} y={86} width={16} height={15} rx={3} fill={TOOTH} stroke={STROKE} strokeWidth={1.8} />
      {/* Canine (middle) - pointed */}
      <path
        d="M 170 86 L 178 70 L 186 86 L 184 100 L 172 100 Z"
        fill={TOOTH}
        stroke={STROKE}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Incisors (front / right) - flat rectangular */}
      <rect x={200} y={84} width={12} height={20} rx={2} fill={TOOTH} stroke={STROKE} strokeWidth={1.8} />
      <rect x={214} y={83} width={12} height={20} rx={2} fill={TOOTH} stroke={STROKE} strokeWidth={1.8} />
    </g>
  );
}

export function LabeledDiagram({ diagramType, labels = [] }: Props) {
  return (
    <svg
      viewBox="0 0 280 200"
      width="280"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      {diagramType === "human_body" && <HumanBody />}
      {diagramType === "plant_parts" && <PlantParts />}
      {diagramType === "teeth" && <Teeth />}

      {labels.map((l, i) => {
        const anchor = anchorFor(diagramType, l.text);
        return (
          <g key={i}>
            {anchor && (
              <line
                x1={l.x}
                y1={l.y}
                x2={anchor.x}
                y2={anchor.y}
                stroke={STROKE}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}
            {anchor && <circle cx={anchor.x} cy={anchor.y} r={2.5} fill={STROKE} />}
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fill={STROKE}
              fontFamily="sans-serif"
              stroke="white"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {l.text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
