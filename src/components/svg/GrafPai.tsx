interface Item {
  nama: string;
  nilai: number;
}

interface Props {
  items: Item[];
  mod: "bilangan" | "peratus";
  jumlah?: number;
}

const PALETTE = ["#1565C0", "#C62828", "#2E7D32", "#E65100", "#6A1B9A", "#00695C"];
const STROKE = "#374151";

export function GrafPai({ items, mod, jumlah }: Props) {
  const list = (items ?? []).filter((x) => (x?.nilai ?? 0) > 0);
  const total = list.reduce((s, x) => s + x.nilai, 0);
  const denom = mod === "peratus" ? (jumlah && jumlah > 0 ? jumlah : total) : total;

  const cx = 110;
  const cy = 110;
  const r = 90;

  const slices: React.ReactNode[] = [];
  let a0 = -Math.PI / 2;

  if (list.length === 1 || total === 0) {
    slices.push(
      <circle key="only" cx={cx} cy={cy} r={r} fill={list.length ? PALETTE[0] : "#E5E7EB"} stroke={STROKE} strokeWidth={2} />
    );
  } else {
    list.forEach((it, i) => {
      const frac = it.nilai / total;
      const a1 = a0 + frac * Math.PI * 2;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
      slices.push(<path key={i} d={d} fill={PALETTE[i % PALETTE.length]} stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />);
      a0 = a1;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 360 }}>
      <svg viewBox="0 0 220 220" width="220" height="220" xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent" }}>
        {slices}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontFamily: "sans-serif", fontSize: 13, color: "#1F2937" }}>
        {list.map((it, i) => {
          const label =
            mod === "peratus"
              ? `${it.nama} ${denom > 0 ? Math.round((it.nilai / denom) * 100) : 0}%`
              : `${it.nama} ${it.nilai}`;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: PALETTE[i % PALETTE.length], border: `1px solid ${STROKE}`, borderRadius: 2 }} />
              <span style={{ fontWeight: 600 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
