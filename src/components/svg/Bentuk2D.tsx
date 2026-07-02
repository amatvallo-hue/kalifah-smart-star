type Shape2D = "segitiga" | "bulatan" | "segiempat_sama" | "segiempat_tepat";

interface Props {
  shape: Shape2D;
  color?: string;
  showLabel?: boolean;
}

const DEFAULT_FILL = "#BFDBFE";
const STROKE = "#374151";

const LABELS: Record<Shape2D, string> = {
  segitiga: "Segitiga",
  bulatan: "Bulatan",
  segiempat_sama: "Segiempat Sama",
  segiempat_tepat: "Segiempat Tepat",
};

export function Bentuk2D({ shape, color = DEFAULT_FILL, showLabel = false }: Props) {
  const cx = 140;
  const cy = showLabel ? 90 : 100;

  let shapeEl: React.ReactNode = null;
  if (shape === "segitiga") {
    const size = 120;
    const h = (Math.sqrt(3) / 2) * size;
    const p1 = `${cx},${cy - h * 0.6}`;
    const p2 = `${cx - size / 2},${cy + h * 0.4}`;
    const p3 = `${cx + size / 2},${cy + h * 0.4}`;
    shapeEl = <polygon points={`${p1} ${p2} ${p3}`} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
  } else if (shape === "bulatan") {
    shapeEl = <circle cx={cx} cy={cy} r={70} fill={color} stroke={STROKE} strokeWidth={3} />;
  } else if (shape === "segiempat_sama") {
    const size = 130;
    shapeEl = <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
  } else if (shape === "segiempat_tepat") {
    const w = 180;
    const h = 110;
    shapeEl = <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
  }

  return (
    <svg
      viewBox="0 0 280 200"
      width="280"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      {shapeEl}
      {showLabel && (
        <text
          x={140}
          y={180}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fill={STROKE}
          fontFamily="sans-serif"
        >
          {LABELS[shape]}
        </text>
      )}
    </svg>
  );
}
