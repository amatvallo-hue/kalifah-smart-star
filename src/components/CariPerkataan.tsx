import { useMemo, useState } from "react";
import { Sparkles, Search } from "lucide-react";

type Word = {
  word: string;
  row: number; // 0-based
  col: number; // 0-based
  dir: "H" | "V";
};

const GRID_SIZE = 8;

// Words from spec (1-based in spec, convert to 0-based)
const WORDS: Word[] = [
  { word: "SATU", row: 0, col: 0, dir: "H" },
  { word: "TIGA", row: 0, col: 2, dir: "V" },
  { word: "LIMA", row: 5, col: 0, dir: "H" },
  { word: "DUA", row: 7, col: 1, dir: "H" },
  { word: "TAMBAH", row: 3, col: 1, dir: "H" },
];

const CLUES: Record<string, string> = {
  SATU: "Nombor 1",
  DUA: "Nombor 2",
  TIGA: "Nombor 3",
  LIMA: "Nombor 5",
  TAMBAH: "Operasi +",
};

// Build the 8x8 grid with words placed; fill the rest with deterministic letters
function buildGrid(): string[][] {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "")
  );
  for (const w of WORDS) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === "H" ? w.row : w.row + i;
      const c = w.dir === "H" ? w.col + i : w.col;
      grid[r][c] = w.word[i];
    }
  }
  // Deterministic filler so layout is stable
  const filler = "BCDFHJKNPQRSWYZ";
  let seed = 7;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) {
        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = filler[seed % filler.length];
      }
    }
  }
  return grid;
}

type Cell = { r: number; c: number };

function cellsBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  // must be straight: horizontal, vertical, or 45° diagonal
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const cells: Cell[] = [];
  for (let i = 0; i < len; i++) cells.push({ r: a.r + sr * i, c: a.c + sc * i });
  return cells;
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function CariPerkataan() {
  const grid = useMemo(buildGrid, []);
  const [first, setFirst] = useState<Cell | null>(null);
  const [found, setFound] = useState<Record<string, Cell[]>>({});
  const [flash, setFlash] = useState<null | "ok" | "no">(null);

  const foundCells = useMemo(() => {
    const set = new Set<string>();
    Object.values(found).forEach((cells) =>
      cells.forEach((c) => set.add(cellKey(c.r, c.c)))
    );
    return set;
  }, [found]);

  const allFound = Object.keys(found).length === WORDS.length;

  function handleClick(r: number, c: number) {
    if (allFound) return;
    if (!first) {
      setFirst({ r, c });
      return;
    }
    if (first.r === r && first.c === c) {
      setFirst(null);
      return;
    }
    const path = cellsBetween(first, { r, c });
    if (!path) {
      setFirst({ r, c });
      return;
    }
    const text = path.map((p) => grid[p.r][p.c]).join("");
    const rev = text.split("").reverse().join("");
    const match = WORDS.find(
      (w) => !found[w.word] && (w.word === text || w.word === rev)
    );
    if (match) {
      setFound((f) => ({ ...f, [match.word]: path }));
      setFlash("ok");
    } else {
      setFlash("no");
    }
    setTimeout(() => setFlash(null), 300);
    setFirst(null);
  }

  function reset() {
    setFound({});
    setFirst(null);
  }

  return (
    <div className="mt-6 rounded-3xl bg-card p-5 shadow-card md:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-soft"
            style={{ backgroundColor: "#1B8A5A" }}
          >
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Cari Perkataan
            </h2>
            <p className="text-xs text-muted-foreground">
              Klik huruf pertama, kemudian huruf terakhir.
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 font-display text-sm font-extrabold text-white"
          style={{ backgroundColor: "#F5A623" }}
        >
          {Object.keys(found).length}/{WORDS.length}
        </span>
      </div>

      <div
        className={`mx-auto mt-5 inline-grid w-full max-w-md gap-1 rounded-2xl p-3 transition ${
          flash === "ok"
            ? "ring-4 ring-emerald-400/60"
            : flash === "no"
            ? "ring-4 ring-rose-400/60"
            : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          backgroundColor: "#F5F7F4",
        }}
      >
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const isFirst = first && first.r === r && first.c === c;
            const isFound = foundCells.has(cellKey(r, c));
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className="aspect-square rounded-md font-display text-base font-extrabold uppercase transition active:scale-95 sm:text-lg"
                style={{
                  backgroundColor: isFound
                    ? "#1B8A5A"
                    : isFirst
                    ? "#F5A623"
                    : "#FFFFFF",
                  color: isFound || isFirst ? "#FFFFFF" : "#1B8A5A",
                  border: `1px solid ${isFound ? "#1B8A5A" : "#E2E8E0"}`,
                }}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-5">
        <h3 className="font-display text-sm font-extrabold text-foreground">
          Senarai Perkataan
        </h3>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WORDS.map((w) => {
            const done = !!found[w.word];
            return (
              <li
                key={w.word}
                className="flex items-center justify-between rounded-xl border px-3 py-2"
                style={{
                  borderColor: done ? "#1B8A5A" : "#E2E8E0",
                  backgroundColor: done ? "#E8F5EE" : "#FFFFFF",
                }}
              >
                <span
                  className={`font-display font-extrabold uppercase ${
                    done ? "line-through" : ""
                  }`}
                  style={{ color: done ? "#1B8A5A" : "#1F2937" }}
                >
                  {w.word}
                </span>
                <span className="text-xs text-muted-foreground">
                  {CLUES[w.word]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {allFound && (
        <div
          className="mt-5 rounded-2xl p-5 text-center"
          style={{ backgroundColor: "#E8F5EE", border: "2px solid #1B8A5A" }}
        >
          <Sparkles
            className="mx-auto h-10 w-10"
            style={{ color: "#F5A623" }}
          />
          <h3
            className="mt-2 font-display text-2xl font-extrabold"
            style={{ color: "#1B8A5A" }}
          >
            Tahniah! 🎉
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kamu jumpa semua perkataan!
          </p>
          <button
            onClick={reset}
            className="mt-3 rounded-full px-5 py-2 font-display font-extrabold text-white shadow-soft"
            style={{ backgroundColor: "#1B8A5A" }}
          >
            Main Lagi
          </button>
        </div>
      )}
    </div>
  );
}
