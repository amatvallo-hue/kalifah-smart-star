interface Props {
  bulan: string;
  tahun: number;
  hariPertama: string;
  jumlahHari: number;
  bahasa?: "bm" | "en";
}

const HARI_BM = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const HARI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HARI_KEYS = ["ahd", "isn", "sel", "rab", "kha", "jum", "sab"];
const HARI_KEYS_EN = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const STROKE = "#374151";
const GRID = "#DDDDDD";
const RED = "#C62828";

export function Kalendar({ bulan, tahun, hariPertama, jumlahHari, bahasa = "bm" }: Props) {
  const HARI = bahasa === "en" ? HARI_EN : HARI_BM;
  const key = (hariPertama || "").toLowerCase().trim();
  let startCol = HARI_KEYS.indexOf(key);
  if (startCol < 0) startCol = HARI_KEYS_EN.indexOf(key);
  if (startCol < 0) startCol = 0;

  const jumlah = Math.max(1, Math.min(31, Math.floor(jumlahHari)));
  const rows = Math.ceil((startCol + jumlah) / 7);

  const cell = 48;
  const headerH = 34;
  const titleH = 36;
  const padX = 8;
  const width = padX * 2 + cell * 7;
  const height = titleH + headerH + cell * rows + 8;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      const dayNum = idx - startCol + 1;
      const x = padX + c * cell;
      const y = titleH + headerH + r * cell;
      cells.push(
        <rect key={`c-${r}-${c}`} x={x} y={y} width={cell} height={cell} fill="#FFFFFF" stroke={GRID} strokeWidth={1} />
      );
      if (dayNum >= 1 && dayNum <= jumlah) {
        cells.push(
          <text
            key={`t-${r}-${c}`}
            x={x + cell / 2}
            y={y + cell / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight={600}
            fill={c === 0 ? RED : STROKE}
            fontFamily="sans-serif"
          >
            {dayNum}
          </text>
        );
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={Math.min(380, width)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      <text x={width / 2} y={20} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill={STROKE} fontFamily="sans-serif">
        {bulan} {tahun}
      </text>
      {HARI.map((h, i) => (
        <g key={`h-${i}`}>
          <rect x={padX + i * cell} y={titleH} width={cell} height={headerH} fill="#F1F5F9" stroke={GRID} strokeWidth={1} />
          <text
            x={padX + i * cell + cell / 2}
            y={titleH + headerH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill={i === 0 ? RED : STROKE}
            fontFamily="sans-serif"
          >
            {h}
          </text>
        </g>
      ))}
      {cells}
    </svg>
  );
}
