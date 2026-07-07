interface Item {
  nama: string;
  nilai: number;
}

interface Props {
  items: Item[];
  setiapSimbol: number;
  ikon?: string;
}

const STROKE = "#374151";

export function Piktograf({ items, setiapSimbol, ikon = "📦" }: Props) {
  const list = items ?? [];
  const per = Math.max(1, setiapSimbol);
  const maxPerRow = 10;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        background: "#F8FAFC",
        borderRadius: 12,
        maxWidth: 420,
        minWidth: 0,
        fontFamily: "sans-serif",
        color: "#1F2937",
      }}
    >
      {list.map((it, i) => {
        const nilai = Math.max(0, it.nilai || 0);
        const full = Math.floor(nilai / per);
        const remainder = nilai - full * per;
        const halfFrac = remainder / per; // 0..<1
        const showHalf = halfFrac > 0;
        const icons: React.ReactNode[] = [];
        for (let k = 0; k < full; k++) {
          icons.push(
            <span key={`f-${k}`} style={{ fontSize: 22, lineHeight: 1 }}>
              {ikon}
            </span>
          );
        }
        if (showHalf) {
          icons.push(
            <span
              key="h"
              style={{
                fontSize: 22,
                lineHeight: 1,
                display: "inline-block",
                width: "0.6em",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
              title="separuh"
            >
              {ikon}
            </span>
          );
        }
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 40px", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{it.nama}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: maxPerRow * 26 }}>{icons}</div>
            <div style={{ fontWeight: 700, fontSize: 13, textAlign: "right" }}>{nilai}</div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 6,
          paddingTop: 8,
          borderTop: `1px solid ${STROKE}22`,
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        Petunjuk: 1 {ikon} = {per} unit
      </div>
    </div>
  );
}
