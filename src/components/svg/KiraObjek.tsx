interface Kumpulan {
  bilangan: number;
  bentuk?: "bulatan" | "bintang" | "segitiga" | "hati";
  warna?: string;
  label?: string;
}

interface Props {
  kumpulan: Kumpulan[];
  labelKumpulan?: boolean;
}

const BG = "#F8FAFC";
const LABEL = "#1F2937";
const BOX_BORDER = "#DDDDDD";
const DEFAULT_WARNA = "#1565C0";

const SHAPE_SIZE = 24;
const GAP = 4;
const SPACING = SHAPE_SIZE + GAP; // 28
const BOX_W = 160;
const BOX_PAD_X = 12;
const BOX_PAD_Y = 16;
const COLS = 5;
const INTER_BOX_GAP = 24;
const OUTER_PAD = 20;
const LABEL_H = 22;

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const arr: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    arr.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return arr.join(" ");
}

function ShapeAt({
  x,
  y,
  bentuk,
  warna,
}: {
  x: number;
  y: number;
  bentuk: Kumpulan["bentuk"];
  warna: string;
}) {
  const cx = x + SHAPE_SIZE / 2;
  const cy = y + SHAPE_SIZE / 2;
  switch (bentuk) {
    case "bintang":
      return (
        <polygon
          points={starPoints(cx, cy, 11, 5, 5)}
          fill={warna}
        />
      );
    case "segitiga":
      return (
        <polygon
          points={`${cx},${y + 2} ${x + 22},${y + 22} ${x + 2},${y + 22}`}
          fill={warna}
        />
      );
    case "hati":
      return (
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={warna}
          transform={`translate(${x}, ${y}) scale(1)`}
        />
      );
    case "bulatan":
    default:
      return <circle cx={cx} cy={cy} r={11} fill={warna} />;
  }
}

export function KiraObjek({ kumpulan, labelKumpulan = false }: Props) {
  const safeGroups = Array.isArray(kumpulan) ? kumpulan : [];
  const groups = safeGroups.slice(0, 4);

  const maxBilangan = groups.length > 0 ? Math.max(...groups.map((g) => g.bilangan)) : 0;
  const maxRows = Math.max(1, Math.ceil(maxBilangan / COLS));
  const contentH = maxRows * SHAPE_SIZE + (maxRows - 1) * GAP;
  const boxH = BOX_PAD_Y * 2 + contentH;

  const W = OUTER_PAD * 2 + groups.length * BOX_W + Math.max(0, groups.length - 1) * INTER_BOX_GAP;
  const H = OUTER_PAD * 2 + boxH + LABEL_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      {groups.map((group, gi) => {
        const boxX = OUTER_PAD + gi * (BOX_W + INTER_BOX_GAP);
        const boxY = OUTER_PAD;
        const bil = Math.max(0, Math.min(20, group.bilangan));
        const groupRows = Math.max(1, Math.ceil(bil / COLS));
        const groupContentH = groupRows * SHAPE_SIZE + (groupRows - 1) * GAP;
        const offsetY = (boxH - groupContentH) / 2;
        const warna = group.warna || DEFAULT_WARNA;
        const bentuk = group.bentuk || "bulatan";
        const showLabel = labelKumpulan || !!group.label;
        const labelText = group.label || `Kumpulan ${String.fromCharCode(65 + gi)}`;

        return (
          <g key={gi}>
            <rect
              x={boxX}
              y={boxY}
              width={BOX_W}
              height={boxH}
              rx={8}
              fill="none"
              stroke={BOX_BORDER}
              strokeWidth={1}
            />
            {Array.from({ length: bil }).map((_, si) => {
              const row = Math.floor(si / COLS);
              const col = si % COLS;
              const sx = boxX + BOX_PAD_X + col * SPACING;
              const sy = boxY + offsetY + row * SPACING;
              return (
                <ShapeAt
                  key={si}
                  x={sx}
                  y={sy}
                  bentuk={bentuk}
                  warna={warna}
                />
              );
            })}
            {showLabel && (
              <text
                x={boxX + BOX_W / 2}
                y={boxY + boxH + 18}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
                fill={LABEL}
                fontFamily="sans-serif"
              >
                {labelText}
              </text>
            )}
          </g>
        );
      })}
      {groups.length === 0 && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fill={LABEL}
          fontFamily="sans-serif"
        >
          Tiada kumpulan
        </text>
      )}
    </svg>
  );
}
