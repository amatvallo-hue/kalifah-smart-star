interface Props {
  fasa: "purnama" | "anak_bulan" | "sabit" | "separa";
}

const SKY = "#0F172A";
const LIT = "#FEF9C3";
const UNLIT = "#334155";
const STROKE = "#94A3B8";
const STAR = "#E2E8F0";

export function FasaBulan({ fasa }: Props) {
  const viewW = 280;
  const viewH = 200;
  const moonR = 50;
  const moonCx = viewW / 2;
  const moonCy = viewH / 2;

  // Small random stars positions
  const stars = [
    { cx: 30, cy: 30, r: 1.5 },
    { cx: 60, cy: 55, r: 1 },
    { cx: 80, cy: 25, r: 1.5 },
    { cx: 120, cy: 40, r: 1 },
    { cx: 160, cy: 28, r: 1.5 },
    { cx: 200, cy: 50, r: 1 },
    { cx: 240, cy: 35, r: 1.5 },
    { cx: 260, cy: 65, r: 1 },
    { cx: 40, cy: 80, r: 1 },
    { cx: 250, cy: 90, r: 1.5 },
    { cx: 30, cy: 130, r: 1.5 },
    { cx: 250, cy: 140, r: 1 },
    { cx: 60, cy: 170, r: 1 },
    { cx: 220, cy: 165, r: 1.5 },
  ];

  let moonShape: React.ReactNode = null;

  if (fasa === "purnama") {
    moonShape = (
      <>
        <circle cx={moonCx} cy={moonCy} r={moonR} fill={LIT} stroke={STROKE} strokeWidth={2} />
      </>
    );
  } else if (fasa === "anak_bulan") {
    moonShape = (
      <>
        <circle cx={moonCx} cy={moonCy} r={moonR} fill={UNLIT} stroke={STROKE} strokeWidth={2} />
      </>
    );
  } else if (fasa === "sabit") {
    // Crescent: lit on right side
    moonShape = (
      <>
        <circle cx={moonCx} cy={moonCy} r={moonR} fill={UNLIT} stroke={STROKE} strokeWidth={2} />
        <path
          d={`M ${moonCx} ${moonCy - moonR}
              A ${moonR} ${moonR} 0 0 1 ${moonCx} ${moonCy + moonR}
              A ${moonR * 0.72} ${moonR * 0.72} 0 0 0 ${moonCx} ${moonCy - moonR}
              Z`}
          fill={LIT}
          stroke="none"
        />
      </>
    );
  } else {
    // "separa" — half moon, lit on right
    moonShape = (
      <>
        <circle cx={moonCx} cy={moonCy} r={moonR} fill={UNLIT} stroke={STROKE} strokeWidth={2} />
        <path
          d={`M ${moonCx} ${moonCy - moonR}
              A ${moonR} ${moonR} 0 0 1 ${moonCx} ${moonCy + moonR}
              Z`}
          fill={LIT}
          stroke="none"
        />
      </>
    );
  }

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Night sky background rect */}
      <rect x={0} y={0} width={viewW} height={viewH} rx={16} fill={SKY} />
      {/* Stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={STAR} opacity={0.8} />
      ))}
      {/* Moon */}
      {moonShape}
    </svg>
  );
}
