interface MagObject {
  nama: string;
  magnetik: boolean;
}

interface Props {
  pole1: "U" | "S" | string;
  pole2: "U" | "S" | string;
  action: "tarik" | "tolak" | string;
  objects?: MagObject[];
}

const STROKE = "#374151";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const GREEN = "#4ADE80";
const GRAY = "#E5E7EB";

function poleColor(p: string): string {
  // U (Utara / North) = red convention; S (Selatan / South) = blue
  return p === "U" ? RED : BLUE;
}

function BarMagnet({
  x,
  y,
  w,
  h,
  leftPole,
  rightPole,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  leftPole: string;
  rightPole: string;
}) {
  const half = w / 2;
  return (
    <g>
      <rect x={x} y={y} width={half} height={h} fill={poleColor(leftPole)} stroke={STROKE} strokeWidth={2} />
      <rect x={x + half} y={y} width={half} height={h} fill={poleColor(rightPole)} stroke={STROKE} strokeWidth={2} />
      <text
        x={x + half / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={800}
        fill="white"
        fontFamily="sans-serif"
      >
        {leftPole}
      </text>
      <text
        x={x + half + half / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={800}
        fill="white"
        fontFamily="sans-serif"
      >
        {rightPole}
      </text>
    </g>
  );
}

export function MagnetDiagram({ pole1, pole2, action, objects }: Props) {
  const hasObjects = objects && objects.length > 0;
  const magnetY = hasObjects ? 25 : 55;
  const magnetH = 46;

  // Two bar magnets facing each other. Magnet 1 shows pole1 on its RIGHT
  // (inner) face; magnet 2 shows pole2 on its LEFT (inner) face.
  const m1Left = pole1 === "U" ? "S" : "U";
  const m1Right = pole1;
  const m2Left = pole2;
  const m2Right = pole2 === "U" ? "S" : "U";

  const tarik = action === "tarik";

  return (
    <svg
      viewBox="0 0 280 200"
      width="280"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "transparent" }}
    >
      <defs>
        <marker id="arrHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={STROKE} />
        </marker>
      </defs>

      <BarMagnet x={20} y={magnetY} w={95} h={magnetH} leftPole={m1Left} rightPole={m1Right} />
      <BarMagnet x={165} y={magnetY} w={95} h={magnetH} leftPole={m2Left} rightPole={m2Right} />

      {/* Action arrows between magnets */}
      {tarik ? (
        <g>
          <line x1={120} y1={magnetY + magnetH / 2} x2={140} y2={magnetY + magnetH / 2} stroke={STROKE} strokeWidth={2.5} markerEnd="url(#arrHead)" />
          <line x1={160} y1={magnetY + magnetH / 2} x2={140} y2={magnetY + magnetH / 2} stroke={STROKE} strokeWidth={2.5} markerEnd="url(#arrHead)" />
        </g>
      ) : (
        <g>
          <line x1={125} y1={magnetY + magnetH / 2} x2={108} y2={magnetY + magnetH / 2} stroke={STROKE} strokeWidth={2.5} markerEnd="url(#arrHead)" />
          <line x1={155} y1={magnetY + magnetH / 2} x2={172} y2={magnetY + magnetH / 2} stroke={STROKE} strokeWidth={2.5} markerEnd="url(#arrHead)" />
        </g>
      )}

      <text
        x={140}
        y={magnetY + magnetH + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {tarik ? "Tarik" : "Tolak"}
      </text>

      {hasObjects && (
        <g>
          {objects!.map((o, i) => {
            const count = objects!.length;
            const totalW = 260;
            const boxW = Math.min(58, totalW / count - 4);
            const gap = (totalW - boxW * count) / (count + 1);
            const x = 10 + gap + i * (boxW + gap);
            const y = 105;
            const boxH = 40;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={boxW}
                  height={boxH}
                  rx={6}
                  fill={o.magnetik ? GREEN : GRAY}
                  stroke={STROKE}
                  strokeWidth={o.magnetik ? 2.5 : 1.5}
                  strokeDasharray={o.magnetik ? undefined : "3 3"}
                />
                <text
                  x={x + boxW / 2}
                  y={y + boxH / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={700}
                  fill={STROKE}
                  fontFamily="sans-serif"
                >
                  {o.nama}
                </text>
                <text
                  x={x + boxW / 2}
                  y={y + boxH + 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={700}
                  fill={o.magnetik ? "#166534" : STROKE}
                  fontFamily="sans-serif"
                >
                  {o.magnetik ? "✓ magnetik" : "✗ bukan"}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
