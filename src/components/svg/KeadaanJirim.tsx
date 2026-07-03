interface Props {
  keadaan: "pepejal" | "cecair" | "gas";
}

const CONTAINER_STROKE = "#374151";
const CONTAINER_FILL = "transparent";
const PARTICLE = "#60A5FA";
const STROKE = "#374151";

export function KeadaanJirim({ keadaan }: Props) {
  const viewW = 280;
  const viewH = 200;
  const boxX = 60;
  const boxY = 40;
  const boxW = 160;
  const boxH = 130;
  const pr = 7; // particle radius

  let particles: React.ReactNode = null;

  if (keadaan === "pepejal") {
    // Tight grid in center-bottom area
    const cols = 8;
    const rows = 4;
    const startX = boxX + 20;
    const startY = boxY + boxH - 20 - rows * 18;
    const circles = [] as React.ReactNode[];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = startX + c * 18 + (r % 2 === 0 ? 0 : 9);
        const cy = startY + r * 18;
        circles.push(
          <circle key={`${r}-${c}`} cx={cx} cy={cy} r={pr} fill={PARTICLE} stroke={STROKE} strokeWidth={1.5} />
        );
      }
    }
    particles = <g>{circles}</g>;
  } else if (keadaan === "cecair") {
    // Clustered near bottom, some gaps
    const positions = [
      { x: 80, y: 145 }, { x: 100, y: 145 }, { x: 120, y: 145 },
      { x: 140, y: 145 }, { x: 160, y: 145 }, { x: 180, y: 145 }, { x: 200, y: 145 },
      { x: 90, y: 128 }, { x: 110, y: 130 }, { x: 135, y: 127 },
      { x: 155, y: 130 }, { x: 175, y: 128 }, { x: 195, y: 130 },
      { x: 105, y: 113 }, { x: 130, y: 111 }, { x: 155, y: 114 }, { x: 180, y: 112 },
      { x: 120, y: 98 }, { x: 145, y: 96 }, { x: 170, y: 99 },
      { x: 135, y: 84 }, { x: 160, y: 82 },
    ];
    particles = (
      <g>
        {positions.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={pr} fill={PARTICLE} stroke={STROKE} strokeWidth={1.5} />
        ))}
      </g>
    );
  } else {
    // gas — scattered sparsely throughout
    const positions = [
      { x: 75, y: 55 }, { x: 180, y: 65 }, { x: 120, y: 50 },
      { x: 200, y: 90 }, { x: 90, y: 110 }, { x: 160, y: 80 },
      { x: 70, y: 140 }, { x: 190, y: 130 }, { x: 130, y: 100 },
      { x: 210, y: 55 }, { x: 100, y: 75 }, { x: 170, y: 110 },
      { x: 140, y: 60 }, { x: 80, y: 160 }, { x: 195, y: 150 },
    ];
    particles = (
      <g>
        {positions.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={pr} fill={PARTICLE} stroke={STROKE} strokeWidth={1.5} />
        ))}
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={viewW} height={viewH} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
      {/* Container box */}
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        fill={CONTAINER_FILL}
        stroke={CONTAINER_STROKE}
        strokeWidth={2.5}
        rx={6}
      />
      {particles}
    </svg>
  );
}
