interface Props {
  bentuk?: "segiempat_tepat";
  objek?: "pagar";
  mendatar: string[];
  menegak: string[];
}

const STROKE = "#374151";
const ACCENT = "#3B82F6";

function RightAngle({ x, y, dx, dy, size = 8 }: { x: number; y: number; dx: number; dy: number; size?: number }) {
  // draw an L at intersection pointing into +dx, +dy quadrant
  return (
    <path
      d={`M ${x + dx * size} ${y} L ${x + dx * size} ${y + dy * size} L ${x} ${y + dy * size}`}
      stroke={ACCENT}
      strokeWidth={1.5}
      fill="none"
    />
  );
}

export function RajahGaris({ bentuk, objek, mendatar, menegak }: Props) {
  const W = 340;
  const H = 240;
  const md = mendatar ?? [];
  const mg = menegak ?? [];

  if (bentuk === "segiempat_tepat") {
    // corners derived: mendatar[0]=top edge (e.g. "AB"), mendatar[1]=bottom edge ("DC")
    // menegak[0]=left edge ("AD"), menegak[1]=right edge ("BC")
    const top = md[0] || "AB";
    const bot = md[1] || "DC";
    const left = mg[0] || "AD";
    const right = mg[1] || "BC";
    const tl = top[0];
    const tr = top[1];
    // bottom edge is written from bottom-left corner: "DC" → D=bot-left, C=bot-right
    const bl = bot[0];
    const br = bot[1];

    const rx = 60, ry = 50;
    const rw = 220, rh = 140;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
        <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke={STROKE} strokeWidth={2.5} />
        {/* corner labels */}
        <text x={rx - 12} y={ry - 8} textAnchor="middle" fontSize={14} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{tl}</text>
        <text x={rx + rw + 12} y={ry - 8} textAnchor="middle" fontSize={14} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{tr}</text>
        <text x={rx - 12} y={ry + rh + 18} textAnchor="middle" fontSize={14} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{bl}</text>
        <text x={rx + rw + 12} y={ry + rh + 18} textAnchor="middle" fontSize={14} fontWeight={800} fill={STROKE} fontFamily="sans-serif">{br}</text>
        {/* edge labels */}
        <text x={rx + rw / 2} y={ry - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{top}</text>
        <text x={rx + rw / 2} y={ry + rh + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{bot}</text>
        <text x={rx - 14} y={ry + rh / 2} textAnchor="end" dominantBaseline="central" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{left}</text>
        <text x={rx + rw + 14} y={ry + rh / 2} textAnchor="start" dominantBaseline="central" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{right}</text>
        {/* corner right-angle marks */}
        <RightAngle x={rx} y={ry} dx={1} dy={1} />
        <RightAngle x={rx + rw} y={ry} dx={-1} dy={1} />
        <RightAngle x={rx} y={ry + rh} dx={1} dy={-1} />
        <RightAngle x={rx + rw} y={ry + rh} dx={-1} dy={-1} />
      </svg>
    );
  }

  // objek === "pagar" or default fence
  const padL = 40, padR = 40, padT = 30, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const nH = Math.max(1, md.length);
  const nV = Math.max(1, mg.length);
  const rowStep = nH > 1 ? innerH / (nH - 1) : 0;
  const colStep = nV > 1 ? innerW / (nV - 1) : 0;

  const nodes: React.ReactNode[] = [];

  // vertical posts
  for (let i = 0; i < nV; i++) {
    const x = padL + i * colStep;
    nodes.push(
      <line key={`v-${i}`} x1={x} y1={padT - 8} x2={x} y2={padT + innerH + 8} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
    );
    nodes.push(
      <text key={`vl-${i}`} x={x} y={padT + innerH + 24} textAnchor="middle" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{mg[i]}</text>
    );
  }
  // horizontal rails
  for (let i = 0; i < nH; i++) {
    const y = padT + i * rowStep;
    nodes.push(
      <line key={`h-${i}`} x1={padL - 8} y1={y} x2={padL + innerW + 8} y2={y} stroke={STROKE} strokeWidth={2.5} strokeLinecap="round" />
    );
    nodes.push(
      <text key={`hl-${i}`} x={padL - 14} y={y} textAnchor="end" dominantBaseline="central" fontSize={12} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{md[i]}</text>
    );
  }
  // right-angle ticks at every intersection
  for (let i = 0; i < nH; i++) {
    for (let j = 0; j < nV; j++) {
      const x = padL + j * colStep;
      const y = padT + i * rowStep;
      nodes.push(<RightAngle key={`ra-${i}-${j}`} x={x} y={y} dx={1} dy={1} size={7} />);
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {nodes}
    </svg>
  );
}
