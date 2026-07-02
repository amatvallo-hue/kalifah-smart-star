interface Props {
  hour: number;
  minute: number;
}

const FILL = "#BFDBFE";
const STROKE = "#374151";
const CENTER = "#374151";

export function JamAnalog({ hour, minute }: Props) {
  const cx = 140;
  const cy = 100;
  const r = 80;

  const hourAngle = ((hour % 12) * 30 + minute * 0.5) * (Math.PI / 180);
  const minuteAngle = minute * 6 * (Math.PI / 180);

  const hourLen = 40;
  const minuteLen = 62;

  const hourX = cx + hourLen * Math.sin(hourAngle);
  const hourY = cy - hourLen * Math.cos(hourAngle);
  const minX = cx + minuteLen * Math.sin(minuteAngle);
  const minY = cy - minuteLen * Math.cos(minuteAngle);

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <svg
      viewBox="0 0 280 200"
      width="280"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth={3} />

      {/* Tick marks */}
      {numbers.map((n) => {
        const a = (n * 30) * (Math.PI / 180);
        const x1 = cx + (r - 6) * Math.sin(a);
        const y1 = cy - (r - 6) * Math.cos(a);
        const x2 = cx + r * Math.sin(a);
        const y2 = cy - r * Math.cos(a);
        return <line key={`t${n}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE} strokeWidth={2} />;
      })}

      {/* Numbers */}
      {numbers.map((n) => {
        const a = (n * 30) * (Math.PI / 180);
        const nx = cx + (r - 18) * Math.sin(a);
        const ny = cy - (r - 18) * Math.cos(a);
        const emphasize = n === 12 || n === 3 || n === 6 || n === 9;
        return (
          <text
            key={`n${n}`}
            x={nx}
            y={ny}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={emphasize ? 14 : 11}
            fontWeight={emphasize ? 700 : 500}
            fill={STROKE}
            fontFamily="sans-serif"
          >
            {n}
          </text>
        );
      })}

      {/* Hour hand (short, thick) */}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke={STROKE} strokeWidth={5} strokeLinecap="round" />
      {/* Minute hand (long, thin) */}
      <line x1={cx} y1={cy} x2={minX} y2={minY} stroke={STROKE} strokeWidth={3} strokeLinecap="round" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill={CENTER} />
    </svg>
  );
}
