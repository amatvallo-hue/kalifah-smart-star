type Fasa = "purnama" | "anak_bulan" | "sabit" | "separa";

interface Item {
  label: string;
  fasa: Fasa;
}

interface Props {
  items: Item[];
}

const SKY = "#0F172A";
const LIT = "#FEF9C3";
const UNLIT = "#334155";
const STROKE = "#94A3B8";

function MiniMoon({ fasa }: { fasa: Fasa }) {
  const size = 80;
  const r = 30;
  const cx = size / 2;
  const cy = size / 2;

  let shape: React.ReactNode = null;
  if (fasa === "purnama") {
    shape = <circle cx={cx} cy={cy} r={r} fill={LIT} stroke={STROKE} strokeWidth={1.5} />;
  } else if (fasa === "anak_bulan") {
    shape = <circle cx={cx} cy={cy} r={r} fill={UNLIT} stroke={STROKE} strokeWidth={1.5} />;
  } else if (fasa === "sabit") {
    shape = (
      <>
        <circle cx={cx} cy={cy} r={r} fill={UNLIT} stroke={STROKE} strokeWidth={1.5} />
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r * 0.72} ${r * 0.72} 0 0 0 ${cx} ${cy - r} Z`}
          fill={LIT}
        />
      </>
    );
  } else {
    shape = (
      <>
        <circle cx={cx} cy={cy} r={r} fill={UNLIT} stroke={STROKE} strokeWidth={1.5} />
        <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`} fill={LIT} />
      </>
    );
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect x={0} y={0} width={size} height={size} rx={10} fill={SKY} />
      {shape}
    </svg>
  );
}

export function FasaBulanKoleksi({ items }: Props) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {list.map((it, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <MiniMoon fasa={it.fasa} />
          <span className="font-display text-sm font-extrabold text-foreground">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
