interface Field {
  label: string;
  value: string;
}

interface Props {
  jenis: "bank" | "risalah" | "resepi" | "maklumat" | "jadual";
  fields: Field[];
  nota?: string[];
}

const ICON: Record<string, string> = {
  bank: "\u{1F3E6}",
  risalah: "\u{1F3F7}️",
  resepi: "\u{1F4CB}",
  maklumat: "\u{1F4CA}",
  jadual: "\u{1F4CA}",
};

const BG = "#FFFFFF";
const BORDER = "#374151";
const LABEL = "#1F2937";
const VALUE = "#0F766E";
const NOTA_BG = "#FFFBEB";
const NOTA_BORDER = "#F59E0B";
const NOTA_TEXT = "#92400E";
const UNKNOWN_BORDER = "#94A3B8";

export function KadMaklumat({ jenis, fields, nota }: Props) {
  const list = Array.isArray(fields) ? fields : [];
  const PAD = 16;
  const ROW_H = 34;
  const HEADER_H = 40;
  const notaLines = Array.isArray(nota) ? nota : [];
  const NOTA_H = notaLines.length > 0 ? notaLines.length * 18 + 16 : 0;
  const W = 380;
  const H = PAD * 2 + HEADER_H + list.length * ROW_H + NOTA_H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={16} fill={BG} stroke={BORDER} strokeWidth={2} />
      <text x={PAD} y={PAD + HEADER_H / 2} dominantBaseline="central" fontSize={26} fontFamily="sans-serif">
        {ICON[jenis] ?? "\u{1F4C4}"}
      </text>
      <line x1={PAD} y1={PAD + HEADER_H} x2={W - PAD} y2={PAD + HEADER_H} stroke={BORDER} strokeWidth={1.5} />
      {list.map((f, i) => {
        const y = PAD + HEADER_H + i * ROW_H + ROW_H / 2;
        const isUnknown = f.value === "?";
        return (
          <g key={i}>
            {i > 0 && (
              <line x1={PAD} y1={y - ROW_H / 2} x2={W - PAD} y2={y - ROW_H / 2} stroke="#E5E7EB" strokeWidth={1} />
            )}
            <text x={PAD} y={y} dominantBaseline="central" fontSize={13} fontWeight={600} fill={LABEL} fontFamily="sans-serif">
              {f.label}
            </text>
            {isUnknown ? (
              <g>
                <rect x={W - PAD - 44} y={y - 13} width={40} height={26} rx={6} fill="#F1F5F9" stroke={UNKNOWN_BORDER} strokeWidth={1.5} strokeDasharray="4 3" />
                <text x={W - PAD - 24} y={y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={800} fill={UNKNOWN_BORDER} fontFamily="sans-serif">?</text>
              </g>
            ) : (
              <text x={W - PAD} y={y} textAnchor="end" dominantBaseline="central" fontSize={14} fontWeight={800} fill={VALUE} fontFamily="sans-serif">
                {f.value}
              </text>
            )}
          </g>
        );
      })}
      {notaLines.length > 0 && (
        <g>
          <rect x={PAD} y={H - NOTA_H + 8} width={W - PAD * 2} height={NOTA_H - 12} rx={8} fill={NOTA_BG} stroke={NOTA_BORDER} strokeWidth={1.2} />
          {notaLines.map((line, i) => (
            <text key={i} x={W / 2} y={H - NOTA_H + 8 + 18 * (i + 1)} textAnchor="middle" fontSize={11} fontWeight={600} fill={NOTA_TEXT} fontFamily="sans-serif">
              {line}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
