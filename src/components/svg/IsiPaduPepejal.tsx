interface Props {
  shape: "kubus" | "kuboid";
  sisi?: number;
  panjang?: number;
  lebar?: number;
  tinggi?: number;
  unit?: string;
}

const STROKE = "#374151";
const FILL = "#BFDBFE";

function shade(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r * factor)},${clamp(g * factor)},${clamp(b * factor)})`;
}

export function IsiPaduPepejal({
  shape,
  sisi = 4,
  panjang = 6,
  lebar = 4,
  tinggi = 3,
  unit = "cm",
}: Props) {
  const W = 280;
  const H = 200;

  const isKubus = shape === "kubus";
  const pLabel = `${isKubus ? sisi : panjang} ${unit}`;
  const lLabel = `${isKubus ? sisi : lebar} ${unit}`;
  const tLabel = `${isKubus ? sisi : tinggi} ${unit}`;

  // Box dimensions (visual, not to scale with props)
  const w = isKubus ? 110 : 140; // front width (panjang)
  const h = isKubus ? 110 : 90;  // front height (tinggi)
  const d = 45;                   // depth offset (lebar)

  const x = (W - (w + d)) / 2;
  const y = (H - (h + d)) / 2 + d;

  const light = shade(FILL, 1.15);
  const mid = FILL;
  const dark = shade(FILL, 0.75);

  // Faces
  const front = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
  const top = `${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`;
  const side = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <polygon points={top} fill={light} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={side} fill={dark} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={front} fill={mid} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />

      {/* panjang label — bottom front edge */}
      <text
        x={x + w / 2}
        y={y + h + 16}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {pLabel}
      </text>

      {/* tinggi label — left front edge */}
      <text
        x={x - 8}
        y={y + h / 2}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {tLabel}
      </text>

      {/* lebar label — top-right depth edge */}
      <text
        x={x + w + d / 2 + 6}
        y={y - d / 2 - 4}
        textAnchor="start"
        fontSize={13}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {lLabel}
      </text>
    </svg>
  );
}
