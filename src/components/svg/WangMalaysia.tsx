interface MoneyItem {
  jenis: "syiling" | "kertas";
  nilai: "10sen" | "20sen" | "50sen" | "RM1" | "RM5" | "RM10" | "RM50" | "RM100";
  bilangan?: number;
}

interface Props {
  items: MoneyItem[];
  susun?: "baris" | "grid";
  bahasa?: "bm" | "en";
}

const BG = "#F8FAFC";
const LABEL = "#1F2937";

const COLOR_MAP: Record<
  MoneyItem["nilai"],
  { fill: string; text: string; border: string }
> = {
  "10sen": { fill: "#C0C0C0", text: "#000000", border: "#8A8A8A" },
  "20sen": { fill: "#C0C0C0", text: "#000000", border: "#8A8A8A" },
  "50sen": { fill: "#C0C0C0", text: "#000000", border: "#8A8A8A" },
  RM1: { fill: "#D4AF37", text: "#000000", border: "#8A7A20" },
  RM5: { fill: "#2E7D32", text: "#FFFFFF", border: "#1B5E20" },
  RM10: { fill: "#C62828", text: "#FFFFFF", border: "#8E1B1B" },
  RM50: { fill: "#00796B", text: "#FFFFFF", border: "#004D40" },
  RM100: { fill: "#6A1B9A", text: "#FFFFFF", border: "#4A148C" },
};

function labelFor(nilai: MoneyItem["nilai"]) {
  return nilai;
}

function Coin({
  cx,
  cy,
  nilai,
  bilangan,
}: {
  cx: number;
  cy: number;
  nilai: MoneyItem["nilai"];
  bilangan: number;
}) {
  const c = COLOR_MAP[nilai];
  const r = nilai === "50sen" ? 40 : 36;
  const stacks = Math.min(3, Math.max(0, bilangan - 1));
  const label = labelFor(nilai);
  const fs = label.length >= 5 ? 12 : 14;
  return (
    <g>
      {Array.from({ length: stacks }).map((_, i) => {
        const off = (stacks - i) * 3;
        return (
          <circle
            key={i}
            cx={cx + off}
            cy={cy + off}
            r={r}
            fill={c.fill}
            stroke={c.border}
            strokeWidth={1.5}
            opacity={0.85}
          />
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={c.fill}
        stroke={c.border}
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r - 5}
        fill="none"
        stroke={c.border}
        strokeWidth={1}
        opacity={0.5}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fs}
        fontWeight={800}
        fill={c.text}
        fontFamily="sans-serif"
      >
        {label}
      </text>
      {bilangan > 1 && (
        <g>
          <rect
            x={cx + r - 8}
            y={cy - r - 12}
            width={28}
            height={18}
            rx={9}
            fill="#111827"
          />
          <text
            x={cx + r + 6}
            y={cy - r - 3}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill="#FFFFFF"
            fontFamily="sans-serif"
          >
            ×{bilangan}
          </text>
        </g>
      )}
    </g>
  );
}

function Note({
  cx,
  cy,
  nilai,
  bilangan,
}: {
  cx: number;
  cy: number;
  nilai: MoneyItem["nilai"];
  bilangan: number;
}) {
  const c = COLOR_MAP[nilai];
  const w = 160;
  const h = 80;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const stacks = Math.min(3, Math.max(0, bilangan - 1));
  const label = labelFor(nilai);
  return (
    <g>
      {Array.from({ length: stacks }).map((_, i) => {
        const off = (stacks - i) * 3;
        return (
          <rect
            key={i}
            x={x + off}
            y={y + off}
            width={w}
            height={h}
            rx={8}
            fill={c.fill}
            stroke={c.border}
            strokeWidth={1.5}
            opacity={0.85}
          />
        );
      })}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={c.fill}
        stroke={c.border}
        strokeWidth={2}
      />
      <rect
        x={x + 6}
        y={y + 6}
        width={w - 12}
        height={h - 12}
        rx={5}
        fill="none"
        stroke={c.border}
        strokeWidth={1}
        opacity={0.5}
      />
      <text
        x={x + 12}
        y={y + 18}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={800}
        fill={c.text}
        fontFamily="sans-serif"
      >
        {label}
      </text>
      <text
        x={x + w - 12}
        y={y + h - 12}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={800}
        fill={c.text}
        fontFamily="sans-serif"
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={800}
        fill={c.text}
        fontFamily="sans-serif"
        opacity={0.9}
      >
        {label}
      </text>
      {bilangan > 1 && (
        <g>
          <rect
            x={x + w - 14}
            y={y - 12}
            width={30}
            height={18}
            rx={9}
            fill="#111827"
          />
          <text
            x={x + w + 1}
            y={y - 3}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill="#FFFFFF"
            fontFamily="sans-serif"
          >
            ×{bilangan}
          </text>
        </g>
      )}
    </g>
  );
}

export function WangMalaysia({ items, susun = "baris", bahasa = "bm" }: Props) {
  const safeItems = Array.isArray(items) ? items : [];
  const CELL_W = 180;
  const CELL_H = 120;
  const PAD = 16;

  const cols =
    susun === "grid" && safeItems.length > 2
      ? Math.min(2, safeItems.length)
      : safeItems.length || 1;
  const rows = Math.ceil((safeItems.length || 1) / cols);

  const W = PAD * 2 + cols * CELL_W;
  const H = PAD * 2 + rows * CELL_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      <rect x={0} y={0} width={W} height={H} rx={12} fill={BG} />
      {safeItems.map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = PAD + col * CELL_W + CELL_W / 2;
        const cy = PAD + row * CELL_H + CELL_H / 2;
        const bilangan = Math.max(1, item.bilangan ?? 1);
        return (
          <g key={i}>
            {item.jenis === "syiling" ? (
              <Coin cx={cx} cy={cy} nilai={item.nilai} bilangan={bilangan} />
            ) : (
              <Note cx={cx} cy={cy} nilai={item.nilai} bilangan={bilangan} />
            )}
          </g>
        );
      })}
      {safeItems.length === 0 && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fill={LABEL}
          fontFamily="sans-serif"
        >
          Tiada wang
        </text>
      )}
    </svg>
  );
}
