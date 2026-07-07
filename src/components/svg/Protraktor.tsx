interface Props {
  sudut: number;
  label?: string;
}

const STROKE = "#374151";
const FILL = "#BFDBFE";
const ARM = "#374151";
const ACCENT = "#3B82F6";

export function Protraktor({ sudut, label = "m" }: Props) {
  const W = 400;
  const H = 220;
  const cx = 200;
  const cy = 180;
  const R = 150;

  // convert protractor degree (0 = right along base, increasing counter-clockwise = up)
  // into svg (x,y) point
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  // semicircle outline: from (cx+R, cy) arc to (cx-R, cy) going up
  const semiPath = `M ${cx + R} ${cy} A ${R} ${R} 0 0 0 ${cx - R} ${cy} Z`;

  const ticks: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (let d = 0; d <= 180; d += 10) {
    const isMajor = d % 30 === 0;
    const inner = isMajor ? R - 14 : R - 8;
    const a = pt(d, inner);
    const b = pt(d, R);
    ticks.push(
      <line key={`t-${d}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={STROKE} strokeWidth={isMajor ? 1.6 : 1} />
    );
    if (isMajor) {
      const lp = pt(d, R - 26);
      labels.push(
        <text key={`l-${d}`} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
          {d}
        </text>
      );
    }
  }

  // arms
  const armLen = R + 10;
  const arm0 = pt(0, armLen);
  const armA = pt(sudut, armLen);

  // small arc near center for the angle marker
  const arcR = 26;
  const startArc = pt(0, arcR);
  const endArc = pt(sudut, arcR);
  const largeArc = sudut > 180 ? 1 : 0;
  const arcPath = `M ${startArc.x} ${startArc.y} A ${arcR} ${arcR} 0 ${largeArc} 0 ${endArc.x} ${endArc.y}`;

  const labelPt = pt(sudut / 2, arcR + 16);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      {/* protractor body */}
      <path d={semiPath} fill={FILL} fillOpacity={0.5} stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
      {/* base line explicit */}
      <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={STROKE} strokeWidth={2} />
      {ticks}
      {labels}
      {/* arms */}
      <line x1={cx} y1={cy} x2={arm0.x} y2={arm0.y} stroke={ARM} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={armA.x} y2={armA.y} stroke={ARM} strokeWidth={2.5} strokeLinecap="round" />
      {/* arc between arms */}
      <path d={arcPath} fill="none" stroke={ACCENT} strokeWidth={2} />
      <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={800} fill={ACCENT} fontFamily="sans-serif">
        {label}
      </text>
      {/* centre pivot */}
      <circle cx={cx} cy={cy} r={3.5} fill={STROKE} />
    </svg>
  );
}
