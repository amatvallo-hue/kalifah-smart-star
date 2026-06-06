import { useMemo, useState } from "react";
import { Sparkles, Search } from "lucide-react";

export type Word = {
  word: string;
  row: number; // 0-based
  col: number; // 0-based
  dir: "H" | "V";
};

const DEFAULT_GRID_SIZE = 8;

// Default (Matematik Darjah 1) words — 1-based in spec, converted to 0-based.
const DEFAULT_WORDS: Word[] = [
  { word: "SATU", row: 0, col: 0, dir: "H" },
  { word: "TIGA", row: 0, col: 2, dir: "V" },
  { word: "LIMA", row: 5, col: 0, dir: "H" },
  { word: "DUA", row: 7, col: 1, dir: "H" },
  { word: "TAMBAH", row: 3, col: 1, dir: "H" },
];

const DEFAULT_CLUES: Record<string, string> = {
  SATU: "Nombor 1",
  DUA: "Nombor 2",
  TIGA: "Nombor 3",
  LIMA: "Nombor 5",
  TAMBAH: "Operasi +",
};

type CariPerkataanProps = {
  words?: Word[];
  clues?: Record<string, string>;
  gridSize?: number;
  title?: string;
};

// Build the grid with words placed; fill the rest with deterministic letters
function buildGrid(words: Word[], size: number): string[][] {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "")
  );
  for (const w of words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === "H" ? w.row : w.row + i;
      const c = w.dir === "H" ? w.col + i : w.col;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        grid[r][c] = w.word[i];
      }
    }
  }
  const filler = "BCDFHJKNPQRSWYZ";
  let seed = 7;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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

export function CariPerkataan({
  words = DEFAULT_WORDS,
  clues = DEFAULT_CLUES,
  gridSize = DEFAULT_GRID_SIZE,
  title = "Cari Perkataan",
}: CariPerkataanProps = {}) {
  const grid = useMemo(() => buildGrid(words, gridSize), [words, gridSize]);
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

  const allFound = Object.keys(found).length === words.length;

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
    const match = words.find(
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
              {title}
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
          {Object.keys(found).length}/{words.length}
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
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
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
                className="aspect-square rounded-md font-display text-sm font-extrabold uppercase transition active:scale-95 sm:text-base"
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
          {words.map((w) => {
            const done = !!found[w.word];
            return (
              <li
                key={w.word}
                className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
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
                <span className="text-right text-xs text-muted-foreground">
                  {clues[w.word]}
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

// Bahasa Melayu Darjah 1 — 10x10 grid with 10 words.
// Spec rows/cols are 1-based; convert to 0-based here.
export const BM_DARJAH1_WORDS: Word[] = [
  // Mendatar
  { word: "IBU", row: 0, col: 0, dir: "H" },
  { word: "AYAH", row: 2, col: 0, dir: "H" },
  { word: "ADIK", row: 4, col: 0, dir: "H" },
  { word: "BUKU", row: 6, col: 0, dir: "H" },
  { word: "MEJA", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "API", row: 0, col: 5, dir: "V" },
  { word: "AIR", row: 0, col: 7, dir: "V" },
  { word: "EPAL", row: 1, col: 3, dir: "V" },
  { word: "IKAN", row: 2, col: 6, dir: "V" },
  { word: "BULAN", row: 4, col: 9, dir: "V" },
];

export const BM_DARJAH1_CLUES: Record<string, string> = {
  IBU: "Perempuan yang melahirkan kita",
  AYAH: "Lelaki yang menjaga keluarga",
  ADIK: "Ahli keluarga yang lebih muda",
  BUKU: "Tempat kita belajar membaca",
  MEJA: "Tempat kita letak buku",
  API: "Panas dan menyala-nyala",
  AIR: "Kita minum setiap hari",
  EPAL: "Buah berwarna merah",
  IKAN: "Haiwan yang hidup dalam air",
  BULAN: "Cahaya di langit malam",
};

export const BI_DARJAH1_WORDS: Word[] = [
  // Across
  { word: "CAT", row: 0, col: 0, dir: "H" },
  { word: "DOG", row: 2, col: 0, dir: "H" },
  { word: "SUN", row: 4, col: 0, dir: "H" },
  { word: "MOON", row: 6, col: 0, dir: "H" },
  { word: "BOOK", row: 8, col: 0, dir: "H" },
  // Down
  { word: "FISH", row: 0, col: 5, dir: "V" },
  { word: "BIRD", row: 0, col: 7, dir: "V" },
  { word: "TREE", row: 1, col: 3, dir: "V" },
  { word: "BLUE", row: 2, col: 6, dir: "V" },
  { word: "HAND", row: 4, col: 9, dir: "V" },
];

export const BI_DARJAH1_CLUES: Record<string, string> = {
  CAT: "Animal that meows",
  DOG: "Animal that barks",
  SUN: "Shines during the day",
  MOON: "Shines at night",
  BOOK: "We read this to learn",
  FISH: "Lives in water",
  BIRD: "Has wings and can fly",
  TREE: "Has leaves and roots",
  BLUE: "Colour of the sky",
  HAND: "Part of our body",
};

export const JAWI_DARJAH1_WORDS: Word[] = [
  // Mendatar
  { word: "ALIF", row: 0, col: 0, dir: "H" },
  { word: "JIM", row: 2, col: 0, dir: "H" },
  { word: "DAL", row: 4, col: 0, dir: "H" },
  { word: "MIM", row: 6, col: 0, dir: "H" },
  { word: "WAU", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "BA", row: 0, col: 5, dir: "V" },
  { word: "TA", row: 0, col: 7, dir: "V" },
  { word: "RA", row: 1, col: 3, dir: "V" },
  { word: "NUN", row: 2, col: 6, dir: "V" },
  { word: "YA", row: 4, col: 9, dir: "V" },
];

export const JAWI_DARJAH1_CLUES: Record<string, string> = {
  ALIF: "Huruf Jawi pertama — ا",
  BA: "Huruf Jawi — ب",
  TA: "Huruf Jawi — ت",
  JIM: "Huruf Jawi — ج",
  DAL: "Huruf Jawi — د",
  RA: "Huruf Jawi — ر",
  MIM: "Huruf Jawi — م",
  NUN: "Huruf Jawi — ن",
  WAU: "Huruf Jawi — و",
  YA: "Huruf Jawi — ي",
};

export const PI_DARJAH1_WORDS: Word[] = [
  // Mendatar
  { word: "SOLAT", row: 0, col: 0, dir: "H" },
  { word: "PUASA", row: 2, col: 0, dir: "H" },
  { word: "SUBUH", row: 4, col: 0, dir: "H" },
  { word: "ZOHOR", row: 6, col: 0, dir: "H" },
  { word: "ASAR", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "MAGHRIB", row: 0, col: 6, dir: "V" },
  { word: "ISYAK", row: 0, col: 8, dir: "V" },
  { word: "IMAN", row: 1, col: 3, dir: "V" },
  { word: "DOA", row: 2, col: 5, dir: "V" },
  { word: "QURAN", row: 3, col: 9, dir: "V" },
];

export const PI_DARJAH1_CLUES: Record<string, string> = {
  SOLAT: "Ibadat yang dilakukan 5 kali sehari",
  PUASA: "Menahan lapar dan dahaga",
  SUBUH: "Solat waktu pagi",
  ZOHOR: "Solat waktu tengah hari",
  ASAR: "Solat waktu petang",
  MAGHRIB: "Solat waktu senja",
  ISYAK: "Solat waktu malam",
  IMAN: "Kepercayaan kepada Allah",
  DOA: "Permohonan kepada Allah",
  QURAN: "Kitab suci umat Islam",
};

export const SAINS_DARJAH1_WORDS: Word[] = [
  // Mendatar
  { word: "MATA", row: 0, col: 0, dir: "H" },
  { word: "HIDUNG", row: 2, col: 0, dir: "H" },
  { word: "LIDAH", row: 4, col: 0, dir: "H" },
  { word: "HUJAN", row: 6, col: 0, dir: "H" },
  { word: "AWAN", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "TELINGA", row: 0, col: 7, dir: "V" },
  { word: "AKAR", row: 0, col: 5, dir: "V" },
  { word: "DAUN", row: 1, col: 3, dir: "V" },
  { word: "BUNGA", row: 2, col: 8, dir: "V" },
  { word: "HAIWAN", row: 3, col: 9, dir: "V" },
];

export const SAINS_DARJAH1_CLUES: Record<string, string> = {
  MATA: "Deria untuk melihat",
  HIDUNG: "Deria untuk menghidu",
  TELINGA: "Deria untuk mendengar",
  LIDAH: "Deria untuk merasa",
  AKAR: "Bahagian tumbuhan yang menyerap air",
  DAUN: "Bahagian tumbuhan yang hijau",
  BUNGA: "Bahagian tumbuhan yang cantik",
  HUJAN: "Air yang turun dari langit",
  AWAN: "Berkumpul di langit sebelum hujan",
  HAIWAN: "Makhluk hidup yang bergerak",
};
