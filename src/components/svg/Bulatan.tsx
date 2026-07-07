interface Props {
  pusat?: string;
  jejari?: string;
  diameter?: string;
  perentas?: string;
  jejariCm?: number;
  objek?: "roda";
  diameterCm?: number;
}

const STROKE = "#374151";
const FILL = "#EFF6FF";
const RADIUS_COLOR = "#2563EB";
const DIAMETER_COLOR = "#059669";
const CHORD_COLOR = "#DC2626";

export function Bulatan({ pusat, jejari, diameter, perentas, jejariCm, objek, diameterCm }: Props) {
  const W = 300;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2;
  const r = 100;

  if (objek === "roda") {
    const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
        <circle cx={cx} cy={cy} r={r} fill="#F1F5F9" stroke={STROKE} strokeWidth={6} />
        {spokes.map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x2 = cx + r * Math.cos(a);
          const y2 = cy + r * Math.sin(a);
          return <line key={deg} x1={cx} y1={cy} x2={x2} y2={y2} stroke={STROKE} strokeWidth={2} />;
        })}
        <circle cx={cx} cy={cy} r={8} fill={STROKE} />
        <line x1={cx - r} y1={cy + r + 24} x2={cx + r} y2={cy + r + 24} stroke={DIAMETER_COLOR} strokeWidth={2} />
        <path d={`M ${cx - r + 5} ${cy + r + 19} L ${cx - r} ${cy + r + 24} L ${cx - r + 5} ${cy + r + 29}`} stroke={DIAMETER_COLOR} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${cx + r - 5} ${cy + r + 19} L ${cx + r} ${cy + r + 24} L ${cx + r - 5} ${cy + r + 29}`} stroke={DIAMETER_COLOR} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {typeof diameterCm === "number" && (
          <text x={cx} y={cy + r + 44} textAnchor="middle" fontSize={14} fontWeight={800} fill={DIAMETER_COLOR} fontFamily="sans-serif">{`${diameterCm} cm`}</text>
        )}
      </svg>
    );
  }

  const jejariEnd = jejari && jejari.length >= 2 ? jejari[1] : "A";
  const pusatLabel = pusat || (jejari ? jejari[0] : "O");
  const diamStart = diameter && diameter.length >= 2 ? diameter[0] : "B";
  const diamEnd = diameter && diameter.length >= 2 ? diameter[1] : "C";
  const chordStart = perentas && perentas.length >= 2 ? perentas[0] : "D";
  const chordEnd = perentas && perentas.length >= 2 ? perentas[1] : "E";

  const radAngle = (-50 * Math.PI) / 180;
  const radX = cx + r * Math.cos(radAngle);
  const radY = cy + r * Math.sin(radAngle);

  const diamX1 = cx - r;
  const diamY1 = cy;
  const diamX2 = cx + r;
  const diamY2 = cy;

  const chordAngle1 = (150 * Math.PI) / 180;
  const chordAngle2 = (215 * Math.PI) / 180;
  const chordX1 = cx + r * Math.cos(chordAngle1);
  const chordY1 = cy + r * Math.sin(chordAngle1);
  const chordX2 = cx + r * Math.cos(chordAngle2);
  const chordY2 = cy + r * Math.sin(chordAngle2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth={2.5} />

      <line x1={diamX1} y1={diamY1} x2={diamX2} y2={diamY2} stroke={DIAMETER_COLOR} strokeWidth={2.5} />
      <circle cx={diamX1} cy={diamY1} r={3.5} fill={DIAMETER_COLOR} />
      <circle cx={diamX2} cy={diamY2} r={3.5} fill={DIAMETER_COLOR} />
      <text x={diamX1 - 14} y={diamY1} textAnchor="end" dominantBaseline="central" fontSize={14} fontWeight={800} fill={DIAMETER_COLOR} fontFamily="sans-serif">{diamStart}</text>
      <text x={diamX2 + 14} y={diamY2} textAnchor="start" dominantBaseline="central" fontSize={14} fontWeight={800} fill={DIAMETER_COLOR} fontFamily="sans-serif">{diamEnd}</text>

      <line x1={chordX1} y1={chordY1} x2={chordX2} y2={chordY2} stroke={CHORD_COLOR} strokeWidth={2.5} />
      <circle cx={chordX1} cy={chordY1} r={3.5} fill={CHORD_COLOR} />
      <circle cx={chordX2} cy={chordY2} r={3.5} fill={CHORD_COLOR} />
      <text x={chordX1 - 10} y={chordY1 - 8} textAnchor="end" fontSize={14} fontWeight={800} fill={CHORD_COLOR} fontFamily="sans-serif">{chordStart}</text>
      <text x={chordX2 - 10} y={chordY2 - 8} textAnchor="end" fontSize={14} fontWeight={800} fill={CHORD_COLOR} fontFamily="sans-serif">{chordEnd}</text>

      <line x1={cx} y1={cy} x2={radX} y2={radY} stroke={RADIUS_COLOR} strokeWidth={2.5} />
      <circle cx={radX} cy={radY} r={3.5} fill={RADIUS_COLOR} />
      <text x={(cx + radX) / 2 + 12} y={(cy + radY) / 2 - 4} textAnchor="start" fontSize={13} fontWeight={800} fill={RADIUS_COLOR} fontFamily="sans-serif">
        {typeof jejariCm === "number" ? `${jejariCm} cm` : ""}
      </text>
      <text x={radX} y={radY - 12} textAnchor="middle" fontSize={14} fontWeight={800} fill={RADIUS_COLOR} fontFamily="sans-serif">{jejariEnd}</text>

      <circle cx={cx} cy={cy} r={4} fill={STROKE} />
      <text x={cx + 8} y={cy - 10} fontSize={14} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{pusatLabel}</text>
    </svg>
  );
}
