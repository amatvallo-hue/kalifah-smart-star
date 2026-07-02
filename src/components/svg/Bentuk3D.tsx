type Shape3D = "sfera" | "kubus" | "kuboid" | "silinder" | "kon" | "piramid";

interface Props {
  shape: Shape3D;
  color?: string;
  showLabel?: boolean;
}

const DEFAULT_FILL = "#BFDBFE";
const STROKE = "#374151";

const LABELS: Record<Shape3D, string> = {
  sfera: "Sfera",
  kubus: "Kubus",
  kuboid: "Kuboid",
  silinder: "Silinder",
  kon: "Kon",
  piramid: "Piramid",
};

// Convert #rrggbb to rgb and apply a brightness factor
function shade(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r * factor);
  const ng = clamp(g * factor);
  const nb = clamp(b * factor);
  return `rgb(${nr},${ng},${nb})`;
}

export function Bentuk3D({ shape, color = DEFAULT_FILL, showLabel = false }: Props) {
  const light = shade(color, 1.15); // top
  const mid = color; // front
  const dark = shade(color, 0.75); // side

  const cx = 140;
  const cy = showLabel ? 90 : 100;

  let el: React.ReactNode = null;

  if (shape === "sfera") {
    el = (
      <g>
        <defs>
          <radialGradient id="sferaGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={light} />
            <stop offset="60%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={70} fill="url(#sferaGrad)" stroke={STROKE} strokeWidth={3} />
      </g>
    );
  } else if (shape === "kubus" || shape === "kuboid") {
    // isometric box
    const w = shape === "kuboid" ? 110 : 80;
    const h = 80;
    const d = 40; // depth offset
    const x = cx - (w + d) / 2;
    const y = cy - (h + d) / 2 + d;
    // front face
    const front = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
    // top face
    const top = `${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`;
    // side face
    const side = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`;
    el = (
      <g>
        <polygon points={top} fill={light} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points={side} fill={dark} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points={front} fill={mid} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    );
  } else if (shape === "silinder") {
    const rx = 55;
    const ry = 15;
    const height = 90;
    const topY = cy - height / 2;
    const botY = cy + height / 2;
    el = (
      <g>
        {/* body */}
        <path
          d={`M ${cx - rx},${topY} L ${cx - rx},${botY} A ${rx} ${ry} 0 0 0 ${cx + rx},${botY} L ${cx + rx},${topY} Z`}
          fill={mid}
          stroke={STROKE}
          strokeWidth={2.5}
        />
        {/* back top curve (hidden edge, lighter) */}
        <path
          d={`M ${cx - rx},${topY} A ${rx} ${ry} 0 0 0 ${cx + rx},${topY}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* top ellipse */}
        <ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={light} stroke={STROKE} strokeWidth={2.5} />
      </g>
    );
  } else if (shape === "kon") {
    const rx = 55;
    const ry = 15;
    const apexY = cy - 70;
    const baseY = cy + 20;
    el = (
      <g>
        {/* base back (dashed) */}
        <path
          d={`M ${cx - rx},${baseY} A ${rx} ${ry} 0 0 1 ${cx + rx},${baseY}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* cone body */}
        <path
          d={`M ${cx - rx},${baseY} L ${cx},${apexY} L ${cx + rx},${baseY} A ${rx} ${ry} 0 0 1 ${cx - rx},${baseY} Z`}
          fill={mid}
          stroke={STROKE}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* base ellipse front curve */}
        <path
          d={`M ${cx - rx},${baseY} A ${rx} ${ry} 0 0 0 ${cx + rx},${baseY}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={2.5}
        />
      </g>
    );
  } else if (shape === "piramid") {
    const halfBase = 60;
    const depth = 25;
    const apexX = cx;
    const apexY = cy - 65;
    const baseY = cy + 25;
    // 4 base corners (front-left, front-right, back-right, back-left)
    const fl = { x: cx - halfBase, y: baseY };
    const fr = { x: cx + halfBase, y: baseY };
    const br = { x: cx + halfBase + depth, y: baseY - depth };
    const bl = { x: cx - halfBase + depth, y: baseY - depth };
    // Faces: front (visible), right (visible), back edges dashed
    const front = `${apexX},${apexY} ${fl.x},${fl.y} ${fr.x},${fr.y}`;
    const right = `${apexX},${apexY} ${fr.x},${fr.y} ${br.x},${br.y}`;
    el = (
      <g>
        {/* base back edges (dashed) */}
        <line x1={fl.x} y1={fl.y} x2={bl.x} y2={bl.y} stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
        <line x1={bl.x} y1={bl.y} x2={br.x} y2={br.y} stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
        <line x1={apexX} y1={apexY} x2={bl.x} y2={bl.y} stroke={STROKE} strokeWidth={1.5} strokeDasharray="3 3" />
        {/* right face */}
        <polygon points={right} fill={dark} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* front face */}
        <polygon points={front} fill={mid} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* front base edge */}
        <line x1={fl.x} y1={fl.y} x2={fr.x} y2={fr.y} stroke={STROKE} strokeWidth={2.5} />
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 280 200"
      width="280"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      {el}
      {showLabel && (
        <text
          x={140}
          y={182}
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
