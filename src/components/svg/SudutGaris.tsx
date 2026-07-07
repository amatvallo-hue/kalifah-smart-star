interface Props {
  mode: "sudut" | "garis" | "garis_lurus";
  darjah?: number;
  jenisGaris?: "selari" | "serenjang";
  a?: number;
  jumlah?: number;
}

const STROKE = "#374151";
const ACCENT = "#3B82F6";

function ArrowMark({ x, y, angle }: { x: number; y: number; angle: number }) {
  // draw ">>" marks along a line
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M -4 -4 L 0 0 L -4 4" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 2 -4 L 6 0 L 2 4" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function SudutGaris({ mode, darjah = 90, jenisGaris = "selari", a = 60, jumlah = 180 }: Props) {
  const W = 280;
  const H = 200;

  if (mode === "garis_lurus") {
    const vx = W / 2;
    const vy = 130;
    const halfLen = 110;
    const lx = vx - halfLen;
    const rx = vx + halfLen;
    // second arm goes up-left at angle `a` from the right (positive x axis)
    const rad = (a * Math.PI) / 180;
    const armLen = 100;
    const ax2 = vx + armLen * Math.cos(-rad);
    const ay2 = vy + armLen * Math.sin(-rad);

    const arcR = 32;
    // left angle (a): from arm (angle a) sweeping to left half of horizontal (angle 180)
    const leftStart = { x: vx + arcR * Math.cos(-rad), y: vy + arcR * Math.sin(-rad) };
    const leftEnd = { x: vx - arcR, y: vy };
    const leftMid = ((a + 180) / 2) * (Math.PI / 180);
    const leftLabel = { x: vx + (arcR + 20) * Math.cos(-leftMid), y: vy + (arcR + 20) * Math.sin(-leftMid) };

    // right angle (b = jumlah - a): from arm sweeping to right half (angle 0)
    const rightStart = { x: vx + arcR, y: vy };
    const rightEnd = { x: vx + arcR * Math.cos(-rad), y: vy + arcR * Math.sin(-rad) };
    const rightMid = (a / 2) * (Math.PI / 180);
    const rightLabel = { x: vx + (arcR + 20) * Math.cos(-rightMid), y: vy + (arcR + 20) * Math.sin(-rightMid) };

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <line x1={lx} y1={vy} x2={rx} y2={vy} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={ax2} y2={ay2} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        {/* left arc (known a) */}
        <path d={`M ${leftStart.x} ${leftStart.y} A ${arcR} ${arcR} 0 0 0 ${leftEnd.x} ${leftEnd.y}`} fill="none" stroke={ACCENT} strokeWidth={2} />
        <text x={leftLabel.x} y={leftLabel.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
          a = {a}°
        </text>
        {/* right arc (unknown b) */}
        <path d={`M ${rightStart.x} ${rightStart.y} A ${arcR} ${arcR} 0 0 0 ${rightEnd.x} ${rightEnd.y}`} fill="none" stroke={ACCENT} strokeWidth={2} />
        <text x={rightLabel.x} y={rightLabel.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
          b
        </text>
        <circle cx={vx} cy={vy} r={3} fill={STROKE} />
      </svg>
    );
  }


  if (mode === "sudut") {
    const vx = 70;
    const vy = 150;
    const length = 130;
    // base ray horizontal to the right
    const bx = vx + length;
    const by = vy;
    // second ray rotated counter-clockwise by `darjah`
    const rad = (darjah * Math.PI) / 180;
    const rx = vx + length * Math.cos(-rad);
    const ry = vy + length * Math.sin(-rad);
    // arc radius
    const arcR = 32;
    // Arc from base ray (angle 0) to second ray (angle -darjah in svg coords)
    const startX = vx + arcR;
    const startY = vy;
    const endX = vx + arcR * Math.cos(-rad);
    const endY = vy + arcR * Math.sin(-rad);
    const largeArc = darjah > 180 ? 1 : 0;
    // sweep flag: 0 for counter-clockwise in svg (which visually goes up)
    const sweep = 0;
    // label position: middle angle
    const midRad = (darjah / 2 * Math.PI) / 180;
    const labelR = arcR + 18;
    const lx = vx + labelR * Math.cos(-midRad);
    const ly = vy + labelR * Math.sin(-midRad);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <line x1={vx} y1={vy} x2={bx} y2={by} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={vx} y1={vy} x2={rx} y2={ry} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <path
          d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${endX} ${endY}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
        />
        <circle cx={vx} cy={vy} r={3} fill={STROKE} />
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">
          {darjah}°
        </text>
      </svg>
    );
  }

  // mode === "garis"
  if (jenisGaris === "selari") {
    const y1 = 70;
    const y2 = 130;
    const x1 = 30;
    const x2 = 250;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
        <ArrowMark x={(x1 + x2) / 2} y={y1} angle={0} />
        <ArrowMark x={(x1 + x2) / 2} y={y2} angle={0} />
      </svg>
    );
  }

  // serenjang
  const cx = W / 2;
  const cy = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <line x1={30} y1={cy} x2={250} y2={cy} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={cx} y1={30} x2={cx} y2={170} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={cx} y={cy - 14} width={14} height={14} fill="none" stroke={ACCENT} strokeWidth={2} />
    </svg>
  );
}
