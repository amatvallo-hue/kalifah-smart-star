interface Aktiviti {
  nama: string;
  mula: string;
  tamat: string;
}

interface Props {
  mula?: string;
  tamat?: string;
  rehatMinit?: number;
  nota?: string;
  aktiviti?: Aktiviti[];
  bahasa?: "bm" | "en";
}

const STROKE = "#374151";
const BG = "#FFFFFF";
const BORDER = "#374151";
const ACCENT = "#3B82F6";
const ROW_ALT = "#F3F4F6";

export function JadualWaktu({ mula, tamat, rehatMinit, nota, aktiviti, bahasa = "bm" }: Props) {
  const L = bahasa === "en"
    ? { mula: "Start", tamat: "End", rehat: "Break", minit: "minutes", esok: "(next day)", tajuk: "Schedule" }
    : { mula: "Mula", tamat: "Tamat", rehat: "Rehat", minit: "minit", esok: "(keesokan hari)", tajuk: "Jadual Waktu" };

  const W = 450;
  const padX = 24;
  const titleH = 40;
  const rowH = 40;

  if (aktiviti && aktiviti.length > 0) {
    const rows = aktiviti.length;
    const H = titleH + rows * rowH + 24;
    const col1X = padX + 8;
    const col2X = W - padX - 8;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={1} y={1} width={W - 2} height={H - 2} rx={16} ry={16} fill={BG} stroke={BORDER} strokeWidth={2} />
        <text x={W / 2} y={titleH / 2 + 4} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
          {L.tajuk}
        </text>
        <line x1={padX} y1={titleH} x2={W - padX} y2={titleH} stroke={STROKE} strokeWidth={1} />
        {aktiviti.map((a, i) => {
          const y = titleH + i * rowH;
          return (
            <g key={i}>
              {i % 2 === 1 && (
                <rect x={padX} y={y} width={W - 2 * padX} height={rowH} fill={ROW_ALT} />
              )}
              <text x={col1X} y={y + rowH / 2} dominantBaseline="central" fontSize={14} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
                {a.nama}
              </text>
              <text x={col2X} y={y + rowH / 2} textAnchor="end" dominantBaseline="central" fontSize={14} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
                {a.mula} - {a.tamat}
              </text>
              {i < aktiviti.length - 1 && (
                <line x1={padX} y1={y + rowH} x2={W - padX} y2={y + rowH} stroke="#E5E7EB" strokeWidth={1} />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // card mode
  const lines: { label: string; value: string; extra?: string }[] = [];
  if (mula) lines.push({ label: L.mula, value: mula });
  if (tamat) lines.push({ label: L.tamat, value: tamat, extra: nota === "tiba_esok" ? L.esok : undefined });
  if (typeof rehatMinit === "number") lines.push({ label: L.rehat, value: `${rehatMinit} ${L.minit}` });

  const H = titleH + lines.length * rowH + 24;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={16} ry={16} fill={BG} stroke={BORDER} strokeWidth={2} />
      <text x={W / 2} y={titleH / 2 + 4} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
        {L.tajuk}
      </text>
      <line x1={padX} y1={titleH} x2={W - padX} y2={titleH} stroke={STROKE} strokeWidth={1} />
      {lines.map((row, i) => {
        const y = titleH + i * rowH;
        return (
          <g key={i}>
            <text x={padX + 8} y={y + rowH / 2} dominantBaseline="central" fontSize={15} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
              {row.label}:
            </text>
            <text x={W - padX - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="central" fontSize={18} fontWeight={800} fill={ACCENT} fontFamily="sans-serif">
              {row.value}
              {row.extra ? ` ${row.extra}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
