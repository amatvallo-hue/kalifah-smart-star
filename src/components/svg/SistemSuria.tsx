const STROKE = "#374151";
const SUN = "#FCD34D";

interface Planet {
  name: string;
  r: number;
  fill: string;
  ring?: boolean;
}

const PLANETS: Planet[] = [
  { name: "Utarid", r: 3, fill: "#9CA3AF" },
  { name: "Zuhrah", r: 4, fill: "#FCD34D" },
  { name: "Bumi", r: 4.5, fill: "#3B82F6" },
  { name: "Marikh", r: 4, fill: "#EF4444" },
  { name: "Musytari", r: 9, fill: "#F59E0B" },
  { name: "Zuhal", r: 8, fill: "#FBBF24", ring: true },
  { name: "Uranus", r: 6, fill: "#60A5FA" },
  { name: "Neptun", r: 6, fill: "#2563EB" },
];

export function SistemSuria() {
  const viewW = 280;
  const viewH = 200;
  const sunCx = 22;
  const sunCy = viewH / 2;
  const sunR = 14;

  const startX = sunCx + sunR + 10;
  const endX = viewW - 12;
  const span = endX - startX;
  const step = span / (PLANETS.length - 1);

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Sun */}
      <circle cx={sunCx} cy={sunCy} r={sunR} fill={SUN} stroke={STROKE} strokeWidth={2} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = sunCx + Math.cos(rad) * (sunR + 2);
        const y1 = sunCy + Math.sin(rad) * (sunR + 2);
        const x2 = sunCx + Math.cos(rad) * (sunR + 6);
        const y2 = sunCy + Math.sin(rad) * (sunR + 6);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SUN} strokeWidth={2} />;
      })}
      <text x={sunCx} y={sunCy + sunR + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={STROKE} fontFamily="sans-serif">
        Matahari
      </text>

      {/* Planets */}
      {PLANETS.map((p, i) => {
        const cx = startX + step * i;
        const cy = viewH / 2 + (i % 2 === 0 ? -6 : 6);
        const labelY = i % 2 === 0 ? cy + p.r + 12 : cy - p.r - 6;
        return (
          <g key={p.name}>
            {p.ring && (
              <ellipse
                cx={cx}
                cy={cy}
                rx={p.r + 5}
                ry={p.r / 2 + 1}
                fill="none"
                stroke={STROKE}
                strokeWidth={1.5}
              />
            )}
            <circle cx={cx} cy={cy} r={p.r} fill={p.fill} stroke={STROKE} strokeWidth={1.5} />
            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={STROKE}
              fontFamily="sans-serif"
            >
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
