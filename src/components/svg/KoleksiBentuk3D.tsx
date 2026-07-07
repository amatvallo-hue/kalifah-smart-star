import { Bentuk3D } from "./Bentuk3D";

type Shape3D = "sfera" | "kubus" | "kuboid" | "silinder" | "kon" | "piramid";

interface Item {
  shape: Shape3D;
  bilangan: number;
}

interface Props {
  items: Item[];
  bahasa?: "bm" | "en";
}

const LABELS_BM: Record<Shape3D, string> = {
  sfera: "Sfera",
  kubus: "Kubus",
  kuboid: "Kuboid",
  silinder: "Silinder",
  kon: "Kon",
  piramid: "Piramid",
};

const LABELS_EN: Record<Shape3D, string> = {
  sfera: "Sphere",
  kubus: "Cube",
  kuboid: "Cuboid",
  silinder: "Cylinder",
  kon: "Cone",
  piramid: "Pyramid",
};

export function KoleksiBentuk3D({ items, bahasa = "bm" }: Props) {
  const list = Array.isArray(items) ? items : [];
  const LABELS = bahasa === "en" ? LABELS_EN : LABELS_BM;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
        padding: 12,
        background: "#F8FAFC",
        borderRadius: 12,
        maxWidth: 360,
        minWidth: 0,
      }}
    >
      {list.map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: 6,
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            position: "relative",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 96,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: "scale(0.42)",
                transformOrigin: "center",
                width: 280,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bentuk3D shape={it.shape} />
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#1F2937",
              fontFamily: "sans-serif",
              textAlign: "center",
            }}
          >
            {LABELS[it.shape]}
          </div>
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "#111827",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 9999,
              padding: "2px 8px",
              fontFamily: "sans-serif",
            }}
          >
            ×{Math.max(0, it.bilangan || 0)}
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <div
          style={{
            fontSize: 13,
            color: "#1F2937",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: 12,
          }}
        >
          {bahasa === "en" ? "No shapes" : "Tiada bentuk"}
        </div>
      )}
    </div>
  );
}
