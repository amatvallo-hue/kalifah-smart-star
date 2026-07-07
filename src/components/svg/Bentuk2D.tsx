type Shape2D = "segitiga" | "bulatan" | "segiempat_sama" | "segiempat_tepat" | "pentagon" | "heksagon";

interface Props {
  shape: Shape2D;
  color?: string;
  showLabel?: boolean;
  paksiSimetri?: number;
}

const DEFAULT_FILL = "#BFDBFE";
const STROKE = "#374151";
const AXIS = "#C62828";

const LABELS: Record<Shape2D, string> = {
  segitiga: "Segitiga",
  bulatan: "Bulatan",
  segiempat_sama: "Segiempat Sama",
  segiempat_tepat: "Segiempat Tepat",
  pentagon: "Pentagon",
  heksagon: "Heksagon",
};

function regularPolygonPoints(cx: number, cy: number, r: number, sides: number, rotation = -Math.PI / 2): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

export function Bentuk2D({ shape, color = DEFAULT_FILL, showLabel = false, paksiSimetri }: Props) {
  const cx = 140;
  const cy = showLabel ? 90 : 100;

  let shapeEl: React.ReactNode = null;
  const axes: React.ReactNode[] = [];

  if (shape === "segitiga") {
    const size = 120;
    const h = (Math.sqrt(3) / 2) * size;
    const top = { x: cx, y: cy - h * 0.6 };
    const bl = { x: cx - size / 2, y: cy + h * 0.4 };
    const br = { x: cx + size / 2, y: cy + h * 0.4 };
    shapeEl = <polygon points={`${top.x},${top.y} ${bl.x},${bl.y} ${br.x},${br.y}`} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
    if (paksiSimetri && paksiSimetri > 0) {
      // 3 axes from each vertex to midpoint of opposite side
      const midBottom = { x: (bl.x + br.x) / 2, y: (bl.y + br.y) / 2 };
      const midRight = { x: (top.x + br.x) / 2, y: (top.y + br.y) / 2 };
      const midLeft = { x: (top.x + bl.x) / 2, y: (top.y + bl.y) / 2 };
      const lines = [
        [top, midBottom],
        [bl, midRight],
        [br, midLeft],
      ];
      for (let i = 0; i < Math.min(paksiSimetri, 3); i++) {
        const [a, b] = lines[i];
        axes.push(<line key={`ax-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AXIS} strokeWidth={2} strokeDasharray="6 4" />);
      }
    }
  } else if (shape === "bulatan") {
    const r = 70;
    shapeEl = <circle cx={cx} cy={cy} r={r} fill={color} stroke={STROKE} strokeWidth={3} />;
    if (paksiSimetri && paksiSimetri > 0) {
      const n = Math.min(paksiSimetri, 12);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI;
        const dx = r * Math.cos(a);
        const dy = r * Math.sin(a);
        axes.push(<line key={`ax-${i}`} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke={AXIS} strokeWidth={2} strokeDasharray="6 4" />);
      }
    }
  } else if (shape === "segiempat_sama") {
    const size = 130;
    const x = cx - size / 2;
    const y = cy - size / 2;
    shapeEl = <rect x={x} y={y} width={size} height={size} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
    if (paksiSimetri && paksiSimetri > 0) {
      const lines = [
        [{ x: cx, y }, { x: cx, y: y + size }], // vertical
        [{ x, y: cy }, { x: x + size, y: cy }], // horizontal
        [{ x, y }, { x: x + size, y: y + size }], // diag
        [{ x: x + size, y }, { x, y: y + size }], // diag
      ];
      for (let i = 0; i < Math.min(paksiSimetri, 4); i++) {
        const [a, b] = lines[i];
        axes.push(<line key={`ax-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AXIS} strokeWidth={2} strokeDasharray="6 4" />);
      }
    }
  } else if (shape === "segiempat_tepat") {
    const w = 180;
    const h = 110;
    const x = cx - w / 2;
    const y = cy - h / 2;
    shapeEl = <rect x={x} y={y} width={w} height={h} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
    if (paksiSimetri && paksiSimetri > 0) {
      const lines = [
        [{ x: cx, y }, { x: cx, y: y + h }],
        [{ x, y: cy }, { x: x + w, y: cy }],
      ];
      for (let i = 0; i < Math.min(paksiSimetri, 2); i++) {
        const [a, b] = lines[i];
        axes.push(<line key={`ax-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AXIS} strokeWidth={2} strokeDasharray="6 4" />);
      }
    }
  } else if (shape === "pentagon" || shape === "heksagon") {
    const sides = shape === "pentagon" ? 5 : 6;
    const r = 70;
    const pts = regularPolygonPoints(cx, cy, r, sides);
    shapeEl = <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={color} stroke={STROKE} strokeWidth={3} strokeLinejoin="round" />;
    if (paksiSimetri && paksiSimetri > 0) {
      const n = Math.min(paksiSimetri, sides);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / sides) * Math.PI * 2;
        // axis passes through vertex and centre, extended to opposite side
        const x1 = cx + r * Math.cos(a);
        const y1 = cy + r * Math.sin(a);
        const x2 = cx - r * Math.cos(a);
        const y2 = cy - r * Math.sin(a);
        axes.push(<line key={`ax-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AXIS} strokeWidth={2} strokeDasharray="6 4" />);
      }
    }
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
      {axes}
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
