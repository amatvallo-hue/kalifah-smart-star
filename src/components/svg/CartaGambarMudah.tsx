interface Item {
  nama: string;
  bilangan: number;
}

interface Props {
  setiap_gambar?: number;
  items: Item[];
  bahasa?: "bm" | "en";
}

const BG = "#F8FAFC";
const ICON = "#60A5FA";
const STROKE = "#374151";
const LABEL = "#1F2937";

const MAX_PER_ROW = 5;
const MAX_ICONS = 10;

export function CartaGambarMudah({ setiap_gambar = 1, items, bahasa = "bm" }: Props) {
  const list = Array.isArray(items) ? items : [];
  const unit = Math.max(1, setiap_gambar || 1);

  const PAD = 14;
  const LABEL_W = 90;
  const ROW_H = 56;
  const ICON_R = 10;
  const ICON_GAP = 6;
  const iconCellW = ICON_R * 2 + ICON_GAP;

  const W = 320;
  const H = PAD * 2 + Math.max(1, list.length) * ROW_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent", maxWidth: W }}
    >
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      {list.map((it, i) => {
        const rowTop = PAD + i * ROW_H;
        const cy = rowTop + ROW_H / 2;
        const total = Math.max(0, it.bilangan || 0);
        const iconCount = Math.ceil(total / unit);
        const capped = Math.min(iconCount, MAX_ICONS);
        const overflow = iconCount > MAX_ICONS;

        return (
          <g key={i}>
            <text
              x={PAD}
              y={cy}
              dominantBaseline="central"
              fontSize={13}
              fontWeight={700}
              fill={LABEL}
              fontFamily="sans-serif"
            >
              {it.nama}
            </text>
            {Array.from({ length: capped }).map((_, k) => {
              const col = k % MAX_PER_ROW;
              const row = Math.floor(k / MAX_PER_ROW);
              const numRows = Math.ceil(capped / MAX_PER_ROW);
              const iy = cy + (row - (numRows - 1) / 2) * (ICON_R * 2 + 4);
              const ix = LABEL_W + PAD + col * iconCellW + ICON_R;
              return (
                <circle
                  key={k}
                  cx={ix}
                  cy={iy}
                  r={ICON_R}
                  fill={ICON}
                  stroke={STROKE}
                  strokeWidth={1.5}
                />
              );
            })}
            {overflow && (
              <text
                x={LABEL_W + PAD + MAX_PER_ROW * iconCellW + 4}
                y={cy}
                dominantBaseline="central"
                fontSize={12}
                fontWeight={700}
                fill={LABEL}
                fontFamily="sans-serif"
              >
                …
              </text>
            )}
            <text
              x={W - PAD}
              y={cy}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={800}
              fill={LABEL}
              fontFamily="sans-serif"
            >
              {total}
            </text>
          </g>
        );
      })}
      {list.length === 0 && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fill={LABEL}
          fontFamily="sans-serif"
        >
          {bahasa === "en" ? "No data" : "Tiada data"}
        </text>
      )}
    </svg>
  );
}
