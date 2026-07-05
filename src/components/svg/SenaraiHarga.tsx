interface Item {
  nama: string;
  harga: number;
}

interface Props {
  unit: "sen" | "RM";
  items: Item[];
  bahasa?: "bm" | "en";
}

const BG = "#F8FAFC";
const STROKE = "#374151";
const LABEL = "#1F2937";
const PRICE = "#0F766E";
const DIVIDER = "#E5E7EB";

function formatPrice(harga: number, unit: "sen" | "RM") {
  if (unit === "sen") return `${Math.round(harga)} sen`;
  return `RM ${harga.toFixed(2)}`;
}

export function SenaraiHarga({ unit, items, bahasa = "bm" }: Props) {
  const list = Array.isArray(items) ? items : [];

  const PAD = 14;
  const ROW_H = 34;
  const HEADER_H = 32;

  const W = 300;
  const H = PAD * 2 + HEADER_H + Math.max(1, list.length) * ROW_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent", maxWidth: W }}
    >
      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        rx={12}
        fill={BG}
        stroke={STROKE}
        strokeWidth={1.5}
      />
      <text
        x={PAD}
        y={PAD + HEADER_H / 2}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={800}
        fill={LABEL}
        fontFamily="sans-serif"
      >
        {bahasa === "en" ? "Price List" : "Senarai Harga"}
      </text>
      <line
        x1={PAD}
        y1={PAD + HEADER_H}
        x2={W - PAD}
        y2={PAD + HEADER_H}
        stroke={STROKE}
        strokeWidth={1.5}
      />
      {list.map((it, i) => {
        const y = PAD + HEADER_H + i * ROW_H + ROW_H / 2;
        return (
          <g key={i}>
            {i > 0 && (
              <line
                x1={PAD}
                y1={y - ROW_H / 2}
                x2={W - PAD}
                y2={y - ROW_H / 2}
                stroke={DIVIDER}
                strokeWidth={1}
              />
            )}
            <text
              x={PAD}
              y={y}
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fill={LABEL}
              fontFamily="sans-serif"
            >
              {it.nama}
            </text>
            <text
              x={W - PAD}
              y={y}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={800}
              fill={PRICE}
              fontFamily="sans-serif"
            >
              {formatPrice(it.harga || 0, unit)}
            </text>
          </g>
        );
      })}
      {list.length === 0 && (
        <text
          x={W / 2}
          y={PAD + HEADER_H + ROW_H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fill={LABEL}
          fontFamily="sans-serif"
        >
          Tiada item
        </text>
      )}
    </svg>
  );
}
