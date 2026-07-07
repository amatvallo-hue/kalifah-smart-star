interface Item {
  sel: string;
  nama: string;
}

interface Props {
  lajurMin: string;
  lajurMax: string;
  barisMin: number;
  barisMax: number;
  items: Item[];
}

const STROKE = "#374151";
const GRID = "#999999";
const PASTEL = "#FDE68A";

function splitCamel(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function GridKedudukan({ lajurMin, lajurMax, barisMin, barisMax, items }: Props) {
  const colStart = lajurMin.charCodeAt(0);
  const colEnd = lajurMax.charCodeAt(0);
  const nCols = Math.max(1, colEnd - colStart + 1);
  const nRows = Math.max(1, barisMax - barisMin + 1);

  const cell = 56;
  const marginLeft = 32;
  const marginBottom = 28;
  const padding = 8;
  const gridW = nCols * cell;
  const gridH = nRows * cell;
  const width = marginLeft + gridW + padding * 2;
  const height = gridH + marginBottom + padding * 2;
  const gridX = marginLeft + padding;
  const gridY = padding;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const x = gridX + c * cell;
      // row 0 (barisMin) at bottom
      const rowValue = barisMin + r;
      const y = gridY + (nRows - 1 - r) * cell;
      cells.push(
        <rect key={`g-${r}-${c}`} x={x} y={y} width={cell} height={cell} fill="#FFFFFF" stroke={GRID} strokeWidth={1} />
      );
      // row labels once per row (only on c==0)
      if (c === 0) {
        cells.push(
          <text
            key={`rl-${r}`}
            x={gridX - 10}
            y={y + cell / 2}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill={STROKE}
            fontFamily="sans-serif"
          >
            {rowValue}
          </text>
        );
      }
    }
  }
  // column labels below grid
  for (let c = 0; c < nCols; c++) {
    const letter = String.fromCharCode(colStart + c);
    cells.push(
      <text
        key={`cl-${c}`}
        x={gridX + c * cell + cell / 2}
        y={gridY + gridH + 16}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={STROKE}
        fontFamily="sans-serif"
      >
        {letter}
      </text>
    );
  }

  const itemEls: React.ReactNode[] = [];
  (items ?? []).forEach((it, i) => {
    const m = /^([A-Za-z])(\d+)$/.exec((it.sel || "").trim());
    if (!m) return;
    const col = m[1].toUpperCase().charCodeAt(0) - colStart;
    const row = parseInt(m[2], 10) - barisMin;
    if (col < 0 || col >= nCols || row < 0 || row >= nRows) return;
    const x = gridX + col * cell + 4;
    const y = gridY + (nRows - 1 - row) * cell + 4;
    itemEls.push(
      <g key={`it-${i}`}>
        <rect x={x} y={y} width={cell - 8} height={cell - 8} rx={6} fill={PASTEL} stroke={STROKE} strokeWidth={1.5} />
        <text
          x={x + (cell - 8) / 2}
          y={y + (cell - 8) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
          fill={STROKE}
          fontFamily="sans-serif"
        >
          {splitCamel(it.nama)}
        </text>
      </g>
    );
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={Math.min(width, 420)} xmlns="http://www.w3.org/2000/svg" style={{ background: "transparent", maxWidth: "100%" }}>
      {cells}
      {itemEls}
    </svg>
  );
}
