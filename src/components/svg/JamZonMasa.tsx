interface ClockProps {
  bandar: string;
  waktu: string;
  cx: number;
}

function parseTime(waktu: string): { h: number; m: number } {
  const [hh, mm] = (waktu || "00:00").split(":").map((v) => parseInt(v, 10));
  return { h: hh || 0, m: mm || 0 };
}

const AXIS = "#374151";
const FILL = "#BFDBFE";
const ACCENT = "#3B82F6";

function ClockFace({ bandar, waktu, cx }: ClockProps) {
  const { h, m } = parseTime(waktu);
  const cy = 78;
  const r = 55;
  const hourAngle = ((h % 12) * 30 + m * 0.5) * (Math.PI / 180);
  const minuteAngle = m * 6 * (Math.PI / 180);
  const hourLen = 28;
  const minuteLen = 42;
  const hourX = cx + hourLen * Math.sin(hourAngle);
  const hourY = cy - hourLen * Math.cos(hourAngle);
  const minX = cx + minuteLen * Math.sin(minuteAngle);
  const minY = cy - minuteLen * Math.cos(minuteAngle);
  const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");

  return (
    <g>
      <text x={cx} y={16} textAnchor="middle" fontSize={13} fontWeight={800} fill={AXIS} fontFamily="sans-serif">
        {bandar}
      </text>
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={AXIS} strokeWidth={2.5} />
      {ticks.map((n) => {
        const a = (n * 30 * Math.PI) / 180;
        const x1 = cx + (r - 5) * Math.sin(a);
        const y1 = cy - (r - 5) * Math.cos(a);
        const x2 = cx + r * Math.sin(a);
        const y2 = cy - r * Math.cos(a);
        return <line key={n} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AXIS} strokeWidth={1.5} />;
      })}
      {[12, 3, 6, 9].map((n) => {
        const a = (n * 30 * Math.PI) / 180;
        const nx = cx + (r - 16) * Math.sin(a);
        const ny = cy - (r - 16) * Math.cos(a);
        return (
          <text key={n} x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} fill={AXIS} fontFamily="sans-serif">
            {n}
          </text>
        );
      })}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke={AXIS} strokeWidth={4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minX} y2={minY} stroke={AXIS} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={AXIS} />
      <rect x={cx - 30} y={cy + r + 10} width={60} height={22} rx={5} fill="#FFFFFF" stroke={ACCENT} strokeWidth={1.5} />
      <text x={cx} y={cy + r + 21} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800} fill={ACCENT} fontFamily="sans-serif">
        {hh}:{mm}
      </text>
    </g>
  );
}

interface Props {
  bandarA: string;
  waktuA: string;
  bandarB: string;
  waktuB: string;
}

export function JamZonMasa({ bandarA, waktuA, bandarB, waktuB }: Props) {
  const W = 320;
  const H = 190;
  const cxA = 90;
  const cxB = 230;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      <ClockFace bandar={bandarA} waktu={waktuA} cx={cxA} />
      <ClockFace bandar={bandarB} waktu={waktuB} cx={cxB} />
    </svg>
  );
}
