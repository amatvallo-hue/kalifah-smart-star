interface Panel {
  label: string;
  panjangBayang: "panjang" | "pendek";
}

interface Props {
  panel: Panel[];
}

const FLOOR = "#374151";
const OBJ_FILL = "#BFDBFE";
const OBJ_STROKE = "#374151";
const SUN = "#FCD34D";
const RAY = "#FCD34D";
const SHADOW = "#4B5563";
const SKY = "#DBEAFE";

function Panel({ panjangBayang }: { panjangBayang: "panjang" | "pendek" }) {
  const W = 160;
  const H = 160;
  const floorY = 130;
  const objW = 22;
  const objH = 52;
  const objX = 55;
  const objY = floorY - objH;

  // Sun position: high (pendek) or low-left (panjang)
  const sx = panjangBayang === "pendek" ? 130 : 25;
  const sy = panjangBayang === "pendek" ? 22 : 55;

  // Shadow: pendek short, panjang long
  const shadowW = panjangBayang === "pendek" ? 22 : 78;
  const shadowH = 8;
  const shadowX = objX + objW + 2;
  const shadowY = floorY - shadowH / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <rect x={0} y={0} width={W} height={floorY} fill={SKY} />
      {/* Sun */}
      <circle cx={sx} cy={sy} r={14} fill={SUN} stroke={OBJ_STROKE} strokeWidth={1.5} />
      {/* Rays */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = i * 25 + 20;
        const rad = (angle * Math.PI) / 180;
        const x2 = sx + 26 * Math.cos(rad);
        const y2 = sy + 26 * Math.sin(rad);
        return <line key={i} x1={sx} y1={sy} x2={x2} y2={y2} stroke={RAY} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />;
      })}
      {/* Floor */}
      <line x1={6} y1={floorY} x2={W - 6} y2={floorY} stroke={FLOOR} strokeWidth={2.5} strokeLinecap="round" />
      {/* Shadow */}
      <ellipse cx={shadowX + shadowW / 2} cy={shadowY + shadowH / 2} rx={shadowW / 2} ry={shadowH / 2} fill={SHADOW} opacity={0.85} />
      {/* Object */}
      <rect x={objX} y={objY} width={objW} height={objH} rx={3} fill={OBJ_FILL} stroke={OBJ_STROKE} strokeWidth={2} />
    </svg>
  );
}

export function BayangMasa({ panel }: Props) {
  const list = Array.isArray(panel) ? panel : [];
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {list.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
          <Panel panjangBayang={p.panjangBayang} />
          <span className="font-display text-sm font-extrabold text-foreground">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
