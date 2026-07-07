interface Props {
  shape:
    | "segiempat_sama"
    | "segiempat_tepat"
    | "segitiga_sama_sisi"
    | "segitiga_tepat"
    | "gabungan_L"
    | "gabungan";
  sisi?: number;
  panjang?: number;
  lebar?: number;
  unit?: string;
  tapak?: number;
  tinggi?: number;
  miring?: number;
  besarPanjang?: number;
  besarLebar?: number;
  potongPanjang?: number;
  potongLebar?: number;
  aPanjang?: number;
  aLebar?: number;
  bPanjang?: number;
  bLebar?: number;
}

const STROKE = "#374151";
const FILL = "#BFDBFE";
const ACCENT = "#3B82F6";

export function PerimeterLuas({
  shape,
  sisi = 5,
  panjang = 8,
  lebar = 4,
  unit = "cm",
  tapak = 6,
  tinggi = 4,
  miring,
  besarPanjang = 10,
  besarLebar = 6,
  potongPanjang = 4,
  potongLebar = 3,
  aPanjang = 6,
  aLebar = 4,
  bPanjang = 4,
  bLebar = 3,
}: Props) {
  const W = 320;
  const H = 220;

  if (shape === "segiempat_sama") {
    const size = 130;
    const x = (W - size) / 2;
    const y = (H - size) / 2;
    const label = `${sisi} ${unit}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={x} y={y} width={size} height={size} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <text x={W / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={W / 2} y={y + size + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={x - 8} y={H / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={x + size + 8} y={H / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
      </svg>
    );
  }

  if (shape === "segiempat_tepat") {
    const w = 180;
    const h = 100;
    const x = (W - w) / 2;
    const y = (H - h) / 2;
    const pL = `${panjang} ${unit}`;
    const lL = `${lebar} ${unit}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={x} y={y} width={w} height={h} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <text x={W / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{pL}</text>
        <text x={W / 2} y={y + h + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{pL}</text>
        <text x={x - 8} y={H / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{lL}</text>
        <text x={x + w + 8} y={H / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{lL}</text>
      </svg>
    );
  }

  if (shape === "segitiga_sama_sisi") {
    const side = 140;
    const h = (Math.sqrt(3) / 2) * side;
    const cx = W / 2;
    const topY = (H - h) / 2;
    const botY = topY + h;
    const p1 = { x: cx, y: topY };
    const p2 = { x: cx - side / 2, y: botY };
    const p3 = { x: cx + side / 2, y: botY };
    const label = `${sisi} ${unit}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        <text x={cx} y={botY + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={(p1.x + p2.x) / 2 - 14} y={(p1.y + p2.y) / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
        <text x={(p1.x + p3.x) / 2 + 14} y={(p1.y + p3.y) / 2} textAnchor="start" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{label}</text>
      </svg>
    );
  }

  if (shape === "segitiga_tepat") {
    // scale so max(tapak, tinggi) fits comfortably
    const maxDim = Math.max(tapak, tinggi);
    const scale = 110 / maxDim;
    const w = tapak * scale;
    const h = tinggi * scale;
    const x0 = (W - w) / 2;
    const y0 = (H - h) / 2 + h; // bottom-left corner
    const bl = { x: x0, y: y0 };
    const br = { x: x0 + w, y: y0 };
    const tl = { x: x0, y: y0 - h };
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <polygon points={`${bl.x},${bl.y} ${br.x},${br.y} ${tl.x},${tl.y}`} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* right-angle marker at bottom-left */}
        <path d={`M ${bl.x + 12} ${bl.y} L ${bl.x + 12} ${bl.y - 12} L ${bl.x} ${bl.y - 12}`} fill="none" stroke={ACCENT} strokeWidth={1.8} />
        {/* tapak label (bottom) */}
        <text x={(bl.x + br.x) / 2} y={bl.y + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${tapak} ${unit}`}</text>
        {/* tinggi label (left) */}
        <text x={bl.x - 8} y={(bl.y + tl.y) / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${tinggi} ${unit}`}</text>
        {/* miring (hypotenuse) */}
        {typeof miring === "number" && (
          <text
            x={(br.x + tl.x) / 2 + 10}
            y={(br.y + tl.y) / 2 - 6}
            textAnchor="start"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill={STROKE}
            fontFamily="sans-serif"
          >{`${miring} ${unit}`}</text>
        )}
      </svg>
    );
  }

  if (shape === "gabungan_L") {
    // big rect with notch at top-right
    const maxDim = Math.max(besarPanjang, besarLebar);
    const scale = 150 / maxDim;
    const bw = besarPanjang * scale;
    const bh = besarLebar * scale;
    const nw = potongPanjang * scale;
    const nh = potongLebar * scale;
    const x0 = (W - bw) / 2;
    const y0 = (H - bh) / 2;
    // L-shape polygon (notch at top-right)
    const pts = [
      { x: x0, y: y0 },                // top-left
      { x: x0 + bw - nw, y: y0 },      // top edge until notch start
      { x: x0 + bw - nw, y: y0 + nh }, // down into notch
      { x: x0 + bw, y: y0 + nh },      // right of notch
      { x: x0 + bw, y: y0 + bh },      // bottom-right
      { x: x0, y: y0 + bh },           // bottom-left
    ];
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <polygon points={poly} fill={FILL} stroke={STROKE} strokeWidth={2.5} strokeLinejoin="round" />
        {/* top full width (besarPanjang) */}
        <text x={x0 + bw / 2} y={y0 - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${besarPanjang} ${unit}`}</text>
        {/* left height (besarLebar) */}
        <text x={x0 - 8} y={y0 + bh / 2} textAnchor="end" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${besarLebar} ${unit}`}</text>
        {/* bottom full width */}
        <text x={x0 + bw / 2} y={y0 + bh + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${besarPanjang} ${unit}`}</text>
        {/* right lower part height (besarLebar - potongLebar area) — use besarLebar */}
        <text x={x0 + bw + 8} y={y0 + nh + (bh - nh) / 2} textAnchor="start" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${besarLebar} ${unit}`}</text>
        {/* notch width (potongPanjang) — above notch step */}
        <text x={x0 + bw - nw / 2} y={y0 + nh + 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{`${potongPanjang} ${unit}`}</text>
        {/* notch height (potongLebar) */}
        <text x={x0 + bw - nw - 4} y={y0 + nh / 2} textAnchor="end" dominantBaseline="central" fontSize={11} fontWeight={700} fill={ACCENT} fontFamily="sans-serif">{`${potongLebar} ${unit}`}</text>
      </svg>
    );
  }

  if (shape === "gabungan") {
    const maxLebar = Math.max(aLebar, bLebar);
    const totalPanjang = aPanjang + bPanjang;
    const scale = Math.min(180 / totalPanjang, 100 / maxLebar);
    const aw = aPanjang * scale;
    const ah = aLebar * scale;
    const bw = bPanjang * scale;
    const bh = bLebar * scale;
    const totalW = aw + bw;
    const x0 = (W - totalW) / 2;
    const baseY = (H + Math.max(ah, bh)) / 2;
    const ax = x0;
    const ay = baseY - ah;
    const bx = x0 + aw;
    const by = baseY - bh;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
        <rect x={ax} y={ay} width={aw} height={ah} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <rect x={bx} y={by} width={bw} height={bh} fill={FILL} stroke={STROKE} strokeWidth={2.5} />
        <text x={ax + aw / 2} y={ay + ah / 2} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={800} fill={STROKE} fontFamily="sans-serif">A</text>
        <text x={bx + bw / 2} y={by + bh / 2} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={800} fill={STROKE} fontFamily="sans-serif">B</text>
        {/* A: top and left */}
        <text x={ax + aw / 2} y={ay - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${aPanjang} ${unit}`}</text>
        <text x={ax - 8} y={ay + ah / 2} textAnchor="end" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${aLebar} ${unit}`}</text>
        {/* B: top and right */}
        <text x={bx + bw / 2} y={by - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${bPanjang} ${unit}`}</text>
        <text x={bx + bw + 8} y={by + bh / 2} textAnchor="start" dominantBaseline="central" fontSize={12} fontWeight={700} fill={STROKE} fontFamily="sans-serif">{`${bLebar} ${unit}`}</text>
      </svg>
    );
  }

  return null;
}
