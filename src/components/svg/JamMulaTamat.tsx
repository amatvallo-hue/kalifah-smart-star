interface Props {
  mula: string;
  tamat: string;
  bahasa?: "bm" | "en";
}

const STROKE = "#374151";
const FACE = "#FFFFFF";
const ACCENT = "#3B82F6";

function parseTime(t: string): { h: number; m: number } {
  const [hh, mm] = (t || "0:0").split(":").map((s) => parseInt(s, 10) || 0);
  return { h: hh, m: mm };
}

function Clock({ cx, cy, r, h, m }: { cx: number; cy: number; r: number; h: number; m: number }) {
  const minuteAngle = (m / 60) * 360 - 90;
  const hourAngle = (((h % 12) + m / 60) / 12) * 360 - 90;
  const mRad = (minuteAngle * Math.PI) / 180;
  const hRad = (hourAngle * Math.PI) / 180;
  const mLen = r * 0.78;
  const hLen = r * 0.52;
  const mx = cx + mLen * Math.cos(mRad);
  const my = cy + mLen * Math.sin(mRad);
  const hx = cx + hLen * Math.cos(hRad);
  const hy = cy + hLen * Math.sin(hRad);

  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const a = ((i / 12) * 360 - 90) * (Math.PI / 180);
    const nx = cx + r * 0.82 * Math.cos(a);
    const ny = cy + r * 0.82 * Math.sin(a);
    numbers.push(
      <text key={i} x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{i}</text>
    );
  }

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = ((i / 60) * 360 - 90) * (Math.PI / 180);
    const isHour = i % 5 === 0;
    const r1 = r * (isHour ? 0.92 : 0.95);
    const r2 = r * 0.99;
    ticks.push(
      <line key={`t-${i}`} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke={STROKE} strokeWidth={isHour ? 1.5 : 0.8} />
    );
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={FACE} stroke={STROKE} strokeWidth={2} />
      {ticks}
      {numbers}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={STROKE} strokeWidth={3.5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={STROKE} />
    </g>
  );
}

export function JamMulaTamat({ mula, tamat, bahasa = "bm" }: Props) {
  const W = 400;
  const H = 240;
  const r = 60;
  const cy = 110;
  const cx1 = 90;
  const cx2 = 310;
  const t1 = parseTime(mula);
  const t2 = parseTime(tamat);
  const lblMula = bahasa === "en" ? "Start" : "Mula";
  const lblTamat = bahasa === "en" ? "End" : "Tamat";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      <text x={cx1} y={26} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{lblMula}</text>
      <text x={cx2} y={26} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{lblTamat}</text>
      <Clock cx={cx1} cy={cy} r={r} h={t1.h} m={t1.m} />
      <Clock cx={cx2} cy={cy} r={r} h={t2.h} m={t2.m} />
      <text x={cx1} y={H - 20} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{mula}</text>
      <text x={cx2} y={H - 20} textAnchor="middle" fontSize={16} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{tamat}</text>
      {/* arrow */}
      <line x1={cx1 + r + 12} y1={cy} x2={cx2 - r - 12} y2={cy} stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${cx2 - r - 12} ${cy} l -8 -6 M ${cx2 - r - 12} ${cy} l -8 6`} stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}
