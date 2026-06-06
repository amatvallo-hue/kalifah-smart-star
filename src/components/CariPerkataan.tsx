import { useMemo, useState } from "react";
import { Sparkles, Search } from "lucide-react";

export type Word = {
  word: string;
  row: number; // 0-based
  col: number; // 0-based
  dir: "H" | "V";
};

const DEFAULT_GRID_SIZE = 10;

// Default (Matematik Darjah 1) words — 1-based in spec, converted to 0-based.
const DEFAULT_WORDS: Word[] = [
  // Mendatar
  { word: "SATU", row: 0, col: 0, dir: "H" },
  { word: "DUA", row: 2, col: 0, dir: "H" },
  { word: "LIMA", row: 4, col: 0, dir: "H" },
  { word: "TAMBAH", row: 6, col: 0, dir: "H" },
  { word: "BULATAN", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "TIGA", row: 0, col: 5, dir: "V" },
  { word: "LAPAN", row: 0, col: 7, dir: "V" },
  { word: "TOLAK", row: 1, col: 3, dir: "V" },
  { word: "SAMA", row: 2, col: 8, dir: "V" },
  { word: "SEGITIGA", row: 1, col: 9, dir: "V" },
];

const DEFAULT_CLUES: Record<string, string> = {
  SATU: "Nombor 1",
  DUA: "Nombor 2",
  TIGA: "Nombor 3",
  LIMA: "Nombor 5",
  LAPAN: "Nombor 8",
  TAMBAH: "Operasi 3 + 4",
  TOLAK: "Operasi 10 - 3",
  SAMA: "Tanda = dalam matematik",
  BULATAN: "Bentuk tanpa sisi",
  SEGITIGA: "Bentuk dengan 3 sisi",
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

// Bahasa Melayu Darjah 2 — 10x10 grid with 10 words.
// Spec rows/cols are 1-based; converted to 0-based here.
// NOTE: menegak listed before mendatar so mendatar letters win on overlaps,
// keeping the headline antonim/sinonim words (CANTIK etc.) findable.
export const BM_DARJAH2_WORDS: Word[] = [
  // Menegak
  { word: "BUKU", row: 0, col: 5, dir: "V" },
  { word: "MEJA", row: 0, col: 7, dir: "V" },
  { word: "SEKOLAH", row: 0, col: 8, dir: "V" },
  { word: "DAPUR", row: 1, col: 3, dir: "V" },
  { word: "MEMBACA", row: 1, col: 9, dir: "V" },
  // Mendatar
  { word: "RAJIN", row: 0, col: 0, dir: "H" },
  { word: "MALAS", row: 2, col: 0, dir: "H" },
  { word: "CANTIK", row: 4, col: 0, dir: "H" },
  { word: "GEMBIRA", row: 6, col: 0, dir: "H" },
  { word: "BERLARI", row: 8, col: 0, dir: "H" },
];

export const BM_DARJAH2_CLUES: Record<string, string> = {
  RAJIN: "Antonim malas",
  MALAS: "Antonim rajin",
  CANTIK: "Kata adjektif sifat",
  GEMBIRA: "Sinonim suka",
  BERLARI: "Kata kerja",
  MEJA: "Tempat letak buku",
  BUKU: "Tempat kita belajar membaca",
  DAPUR: "Tempat memasak",
  SEKOLAH: "Tempat belajar",
  MEMBACA: "Aktiviti dengan buku",
};

// Matematik Darjah 2 — 10x10 grid with 10 words.
export const MATE_DARJAH2_WORDS: Word[] = [
  // Mendatar
  { word: "TAMBAH", row: 0, col: 0, dir: "H" },
  { word: "TOLAK", row: 2, col: 0, dir: "H" },
  { word: "DARAB", row: 4, col: 0, dir: "H" },
  { word: "BAHAGI", row: 6, col: 0, dir: "H" },
  { word: "NOMBOR", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "NILAI", row: 0, col: 5, dir: "V" },
  { word: "SIFIR", row: 0, col: 7, dir: "V" },
  { word: "DIGIT", row: 1, col: 3, dir: "V" },
  { word: "PULUH", row: 2, col: 8, dir: "V" },
  { word: "RATUS", row: 3, col: 9, dir: "V" },
];

export const MATE_DARJAH2_CLUES: Record<string, string> = {
  TAMBAH: "Operasi 25 + 37",
  TOLAK: "Operasi 84 - 46",
  DARAB: "Operasi 6 × 3",
  BAHAGI: "Operasi 20 ÷ 4",
  NOMBOR: "Angka yang kita kira",
  SIFIR: "Jadual pendaraban",
  NILAI: "Berapa banyak digit itu",
  DIGIT: "Angka dalam nombor",
  PULUH: "Nilai tempat kedua",
  RATUS: "Nilai tempat ketiga",
};

export const BI_DARJAH2_WORDS: Word[] = [
  // Across
  { word: "CATS", row: 0, col: 0, dir: "H" },
  { word: "WENT", row: 2, col: 0, dir: "H" },
  { word: "SWIM", row: 4, col: 0, dir: "H" },
  { word: "HAPPY", row: 6, col: 0, dir: "H" },
  { word: "PLAYED", row: 8, col: 0, dir: "H" },
  // Down
  { word: "BOOK", row: 0, col: 6, dir: "V" },
  { word: "RUNS", row: 0, col: 4, dir: "V" },
  { word: "TEETH", row: 1, col: 8, dir: "V" },
  { word: "WOMEN", row: 0, col: 5, dir: "V" },
  { word: "SLOWLY", row: 1, col: 9, dir: "V" },
];

export const BI_DARJAH2_CLUES: Record<string, string> = {
  CATS: "Plural of cat",
  WENT: "Past tense of go",
  SWIM: "Action in water",
  HAPPY: "Opposite of sad",
  PLAYED: "Past tense of play",
  BOOK: "We read this",
  RUNS: "He ___ fast",
  TEETH: "Plural of tooth",
  WOMEN: "Plural of woman",
  SLOWLY: "Opposite of quickly",
};

// Jawi Darjah 2 — 10x10 grid with 10 words (nama huruf & istilah Jawi).
export const JAWI_DARJAH2_WORDS: Word[] = [
  // Mendatar
  { word: "ALIF", row: 0, col: 0, dir: "H" },
  { word: "MIM", row: 2, col: 0, dir: "H" },
  { word: "JAWI", row: 4, col: 0, dir: "H" },
  { word: "KHAT", row: 6, col: 0, dir: "H" },
  { word: "RUMI", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "WAU", row: 0, col: 4, dir: "V" },
  { word: "NUN", row: 0, col: 6, dir: "V" },
  { word: "HURUF", row: 1, col: 8, dir: "V" },
  { word: "TULIS", row: 1, col: 9, dir: "V" },
  { word: "ARAB", row: 5, col: 5, dir: "V" },
];

export const JAWI_DARJAH2_CLUES: Record<string, string> = {
  ALIF: "Huruf Jawi pertama — ا",
  MIM: "Huruf Jawi — م",
  JAWI: "Tulisan kita",
  KHAT: "Seni tulisan Arab",
  RUMI: "Tulisan Latin",
  NUN: "Huruf Jawi — ن",
  WAU: "Huruf Jawi — و",
  HURUF: "Aksara dalam tulisan",
  ARAB: "Bahasa asal tulisan Jawi",
  TULIS: "Cara merakam perkataan",
};

// Pendidikan Islam Darjah 2 — 10x10 grid with 10 words.
export const PI_DARJAH2_WORDS: Word[] = [
  // Mendatar
  { word: "JIBRIL", row: 0, col: 0, dir: "H" },
  { word: "MIKAIL", row: 2, col: 0, dir: "H" },
  { word: "IZRAIL", row: 4, col: 0, dir: "H" },
  { word: "TAURAT", row: 6, col: 0, dir: "H" },
  { word: "INJIL", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "QURAN", row: 0, col: 6, dir: "V" },
  { word: "ZABUR", row: 0, col: 7, dir: "V" },
  { word: "WUJUD", row: 5, col: 6, dir: "V" },
  { word: "ISRAFIL", row: 0, col: 8, dir: "V" },
  { word: "BAQA", row: 2, col: 9, dir: "V" },
];

export const PI_DARJAH2_CLUES: Record<string, string> = {
  JIBRIL: "Malaikat menyampaikan wahyu",
  MIKAIL: "Malaikat menurunkan hujan",
  IZRAIL: "Malaikat mencabut nyawa",
  TAURAT: "Kitab Nabi Musa",
  INJIL: "Kitab Nabi Isa",
  QURAN: "Kitab Nabi Muhammad SAW",
  ZABUR: "Kitab Nabi Daud",
  WUJUD: "Sifat Allah bermaksud Ada",
  ISRAFIL: "Malaikat meniup sangkakala",
  BAQA: "Sifat Allah bermaksud Kekal",
};

// Sains Darjah 2 — 10x10 grid with 10 words.
export const SAINS_DARJAH2_WORDS: Word[] = [
  // Mendatar
  { word: "PEPEJAL", row: 0, col: 0, dir: "H" },
  { word: "CECAIR", row: 2, col: 0, dir: "H" },
  { word: "OVIPAR", row: 4, col: 0, dir: "H" },
  { word: "MAGNET", row: 6, col: 0, dir: "H" },
  { word: "OKSIGEN", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "HUJAN", row: 0, col: 7, dir: "V" },
  { word: "HABA", row: 0, col: 8, dir: "V" },
  { word: "DAUN", row: 4, col: 8, dir: "V" },
  { word: "GAS", row: 5, col: 7, dir: "V" },
  { word: "AKAR", row: 3, col: 9, dir: "V" },
];

export const SAINS_DARJAH2_CLUES: Record<string, string> = {
  PEPEJAL: "keadaan jirim yang keras",
  CECAIR: "keadaan jirim yang mengalir",
  OVIPAR: "haiwan yang bertelur",
  MAGNET: "menarik benda besi",
  OKSIGEN: "gas yang kita sedut",
  GAS: "keadaan jirim yang tidak kelihatan",
  HABA: "tenaga panas",
  DAUN: "bahagian tumbuhan yang hijau",
  HUJAN: "air yang turun dari langit",
  AKAR: "bahagian tumbuhan yang menyerap air",
};

// Bahasa Melayu Darjah 3 — 10x10 grid with 10 words.
export const BM_DARJAH3_WORDS: Word[] = [
  // Mendatar
  { word: "RAJIN", row: 0, col: 0, dir: "H" },
  { word: "MALAS", row: 2, col: 0, dir: "H" },
  { word: "INDAH", row: 4, col: 0, dir: "H" },
  { word: "AKTIF", row: 6, col: 0, dir: "H" },
  { word: "PASIF", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "IMBUHAN", row: 0, col: 6, dir: "V" },
  { word: "AYAT", row: 0, col: 8, dir: "V" },
  { word: "NAMA", row: 5, col: 8, dir: "V" },
  { word: "ABSTRAK", row: 1, col: 9, dir: "V" },
  { word: "ULANG", row: 3, col: 7, dir: "V" },
];

export const BM_DARJAH3_CLUES: Record<string, string> = {
  RAJIN: "Antonim malas",
  MALAS: "Antonim rajin",
  INDAH: "Sinonim cantik",
  AKTIF: "Jenis ayat",
  PASIF: "Jenis ayat",
  IMBUHAN: "Tambahan pada kata",
  AYAT: "Rangkaian perkataan",
  NAMA: "Jenis kata",
  ABSTRAK: "Tidak dapat dilihat",
  ULANG: "Kata yang diulang",
};

// Matematik Darjah 3 — 10x10 grid with 10 words.
export const MATE_DARJAH3_WORDS: Word[] = [
  // Mendatar
  { word: "TAMBAH", row: 0, col: 0, dir: "H" },
  { word: "TOLAK", row: 2, col: 0, dir: "H" },
  { word: "DARAB", row: 4, col: 0, dir: "H" },
  { word: "BAHAGI", row: 6, col: 0, dir: "H" },
  { word: "LUAS", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "PERIMETER", row: 0, col: 9, dir: "V" },
  { word: "PECAHAN", row: 0, col: 7, dir: "V" },
  { word: "SIFIR", row: 0, col: 8, dir: "V" },
  { word: "DIGIT", row: 5, col: 8, dir: "V" },
  { word: "RATUS", row: 1, col: 6, dir: "V" },
];

export const MATE_DARJAH3_CLUES: Record<string, string> = {
  TAMBAH: "Operasi 234 + 567",
  TOLAK: "Operasi 856 - 378",
  DARAB: "Operasi 7 × 8",
  BAHAGI: "Operasi 72 ÷ 8",
  LUAS: "Panjang × lebar",
  PERIMETER: "Jumlah semua sisi",
  PECAHAN: "1/2, 3/4 — bahagian",
  DIGIT: "Angka 0–9",
  RATUS: "Nilai tempat ketiga",
  SIFIR: "Jadual pendaraban",
};

// Bahasa Inggeris Darjah 3 — 10x10 grid with 10 words.
export const BI_DARJAH3_WORDS: Word[] = [
  // Across
  { word: "BRAVE", row: 0, col: 0, dir: "H" },
  { word: "HAPPY", row: 2, col: 0, dir: "H" },
  { word: "WROTE", row: 4, col: 0, dir: "H" },
  { word: "LEAVES", row: 6, col: 0, dir: "H" },
  { word: "SIMILE", row: 8, col: 0, dir: "H" },
  // Down
  { word: "QUICKLY", row: 0, col: 9, dir: "V" },
  { word: "BECAUSE", row: 0, col: 8, dir: "V" },
  { word: "ARTICLE", row: 0, col: 7, dir: "V" },
  { word: "PLURAL", row: 0, col: 6, dir: "V" },
  { word: "TENSE", row: 0, col: 5, dir: "V" },
];

export const BI_DARJAH3_CLUES: Record<string, string> = {
  BRAVE: "Antonym of cowardly",
  HAPPY: "Synonym of joyful",
  WROTE: "Past tense of write",
  LEAVES: "Plural of leaf",
  SIMILE: "Comparing using 'like' or 'as'",
  QUICKLY: "Adverb of quick",
  BECAUSE: "Conjunction for reason",
  ARTICLE: "a / an / the",
  PLURAL: "More than one",
  TENSE: "Time of verb",
};

// Jawi Darjah 3 — 10x10 grid with 10 words.
export const JAWI_DARJAH3_WORDS: Word[] = [
  // Mendatar
  { word: "ALIF", row: 0, col: 0, dir: "H" },
  { word: "JAWI", row: 2, col: 0, dir: "H" },
  { word: "KHAT", row: 4, col: 0, dir: "H" },
  { word: "HURUF", row: 6, col: 0, dir: "H" },
  { word: "TULIS", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "TULISAN", row: 0, col: 9, dir: "V" },
  { word: "MELAYU", row: 0, col: 8, dir: "V" },
  { word: "EJAAN", row: 0, col: 7, dir: "V" },
  { word: "RUMI", row: 0, col: 6, dir: "V" },
  { word: "ARAB", row: 0, col: 5, dir: "V" },
];

export const JAWI_DARJAH3_CLUES: Record<string, string> = {
  ALIF: "Huruf Jawi pertama — ا",
  JAWI: "Tulisan kita",
  KHAT: "Seni tulisan Arab",
  HURUF: "Aksara dalam tulisan",
  TULIS: "Cara merakam perkataan",
  TULISAN: "Hasil yang ditulis",
  MELAYU: "Bahasa kita",
  EJAAN: "Cara susun huruf",
  RUMI: "Tulisan Latin",
  ARAB: "Bahasa asal tulisan Jawi",
};

// Pendidikan Islam Darjah 3 — 10x10 grid with 10 words.
export const PI_DARJAH3_WORDS: Word[] = [
  // Mendatar
  { word: "JIBRIL", row: 0, col: 0, dir: "H" },
  { word: "MIKAIL", row: 2, col: 0, dir: "H" },
  { word: "IZRAIL", row: 4, col: 0, dir: "H" },
  { word: "TAURAT", row: 6, col: 0, dir: "H" },
  { word: "INJIL", row: 8, col: 0, dir: "H" },
  // Menegak
  { word: "ISRAFIL", row: 0, col: 9, dir: "V" },
  { word: "ZABUR", row: 0, col: 8, dir: "V" },
  { word: "QURAN", row: 0, col: 7, dir: "V" },
  { word: "WUJUD", row: 0, col: 6, dir: "V" },
  { word: "BAQA", row: 5, col: 8, dir: "V" },
];

export const PI_DARJAH3_CLUES: Record<string, string> = {
  JIBRIL: "Malaikat menyampaikan wahyu",
  MIKAIL: "Malaikat menurunkan hujan",
  IZRAIL: "Malaikat mencabut nyawa",
  TAURAT: "Kitab Nabi Musa",
  INJIL: "Kitab Nabi Isa",
  ISRAFIL: "Malaikat meniup sangkakala",
  QURAN: "Kitab Nabi Muhammad SAW",
  ZABUR: "Kitab Nabi Daud",
  WUJUD: "Sifat Allah bermaksud Ada",
  BAQA: "Sifat Allah bermaksud Kekal",
};

// Bahasa Melayu Darjah 4
export const BM_DARJAH4_WORDS: Word[] = [
  { word: "PANTUN", row: 0, col: 0, dir: "H" },
  { word: "DIALOG", row: 2, col: 0, dir: "H" },
  { word: "MAJMUK", row: 4, col: 0, dir: "H" },
  { word: "SENDI", row: 6, col: 0, dir: "H" },
  { word: "NAFI", row: 8, col: 0, dir: "H" },
  { word: "IMBUHAN", row: 0, col: 6, dir: "V" },
  { word: "PENGUAT", row: 0, col: 7, dir: "V" },
  { word: "BILANGAN", row: 0, col: 8, dir: "V" },
  { word: "DEDIKASI", row: 0, col: 9, dir: "V" },
  { word: "TANYA", row: 5, col: 5, dir: "V" },
];
export const BM_DARJAH4_CLUES: Record<string, string> = {
  PANTUN: "Puisi tradisional 4 baris",
  DIALOG: "Perbualan dua orang atau lebih",
  MAJMUK: "Gabungan dua perkataan",
  SENDI: "Kata sendi nama — di, ke",
  NAFI: "Kata seperti 'tidak'",
  IMBUHAN: "Tambahan pada kata",
  PENGUAT: "Kata seperti 'sangat'",
  BILANGAN: "Menunjukkan jumlah",
  DEDIKASI: "Bersungguh-sungguh",
  TANYA: "Kata seperti 'siapa', 'apa'",
};

// Matematik Darjah 4
export const MATE_DARJAH4_WORDS: Word[] = [
  { word: "TAMBAH", row: 0, col: 0, dir: "H" },
  { word: "TOLAK", row: 2, col: 0, dir: "H" },
  { word: "DARAB", row: 4, col: 0, dir: "H" },
  { word: "BAHAGI", row: 6, col: 0, dir: "H" },
  { word: "SUDUT", row: 8, col: 0, dir: "H" },
  { word: "PECAHAN", row: 0, col: 6, dir: "V" },
  { word: "DARJAH", row: 0, col: 7, dir: "V" },
  { word: "PERIMETER", row: 0, col: 8, dir: "V" },
  { word: "PERPULUHAN", row: 0, col: 9, dir: "V" },
  { word: "LUAS", row: 1, col: 5, dir: "V" },
];
export const MATE_DARJAH4_CLUES: Record<string, string> = {
  TAMBAH: "Operasi +",
  TOLAK: "Operasi −",
  DARAB: "Operasi ×",
  BAHAGI: "Operasi ÷",
  SUDUT: "Tirus, tegak, cakah",
  PECAHAN: "1/2, 3/4 — bahagian",
  DARJAH: "Unit ukur sudut",
  PERIMETER: "Jumlah semua sisi",
  PERPULUHAN: "Nombor dengan titik",
  LUAS: "Panjang × lebar",
};

// Bahasa Inggeris Darjah 4
export const BI_DARJAH4_WORDS: Word[] = [
  { word: "PRONOUN", row: 0, col: 0, dir: "H" },
  { word: "SIMILE", row: 2, col: 0, dir: "H" },
  { word: "TENSE", row: 4, col: 0, dir: "H" },
  { word: "CLAUSE", row: 6, col: 0, dir: "H" },
  { word: "ANGRY", row: 8, col: 0, dir: "H" },
  { word: "MODERN", row: 0, col: 9, dir: "V" },
  { word: "FURIOUS", row: 0, col: 8, dir: "V" },
  { word: "BUZZING", row: 0, col: 7, dir: "V" },
  { word: "SINGING", row: 3, col: 6, dir: "V" },
  { word: "COMPOUND", row: 1, col: 9, dir: "V" },
];
export const BI_DARJAH4_CLUES: Record<string, string> = {
  PRONOUN: "Replaces a noun",
  SIMILE: "Compare using 'like' or 'as'",
  TENSE: "Time of verb",
  CLAUSE: "Group of words",
  ANGRY: "Synonym of furious",
  MODERN: "Antonym of ancient",
  FURIOUS: "Synonym of angry",
  BUZZING: "Sound a bee makes",
  SINGING: "Action of a singer",
  COMPOUND: "Two clauses joined",
};

// Jawi Darjah 4
export const JAWI_DARJAH4_WORDS: Word[] = [
  { word: "JAWI", row: 0, col: 0, dir: "H" },
  { word: "RUMI", row: 2, col: 0, dir: "H" },
  { word: "EJAAN", row: 4, col: 0, dir: "H" },
  { word: "HURUF", row: 6, col: 0, dir: "H" },
  { word: "MELAYU", row: 8, col: 0, dir: "H" },
  { word: "TULISAN", row: 0, col: 9, dir: "V" },
  { word: "ARAB", row: 0, col: 8, dir: "V" },
  { word: "KHAT", row: 0, col: 7, dir: "V" },
  { word: "BAHASA", row: 0, col: 6, dir: "V" },
  { word: "BUDAYA", row: 0, col: 5, dir: "V" },
];
export const JAWI_DARJAH4_CLUES: Record<string, string> = {
  JAWI: "Tulisan kita",
  RUMI: "Tulisan Latin",
  EJAAN: "Cara susun huruf",
  HURUF: "Aksara dalam tulisan",
  MELAYU: "Bahasa kita",
  TULISAN: "Hasil yang ditulis",
  ARAB: "Bahasa asal Jawi",
  KHAT: "Seni tulisan",
  BAHASA: "Cara berkomunikasi",
  BUDAYA: "Cara hidup masyarakat",
};

// Pendidikan Islam Darjah 4
export const PI_DARJAH4_WORDS: Word[] = [
  { word: "AKHLAK", row: 0, col: 0, dir: "H" },
  { word: "SABAR", row: 2, col: 0, dir: "H" },
  { word: "SYUKUR", row: 4, col: 0, dir: "H" },
  { word: "HIJRAH", row: 6, col: 0, dir: "H" },
  { word: "AMANAH", row: 8, col: 0, dir: "H" },
  { word: "ISTIQAMAH", row: 0, col: 9, dir: "V" },
  { word: "UKHUWAH", row: 0, col: 8, dir: "V" },
  { word: "TAWADUK", row: 0, col: 7, dir: "V" },
  { word: "SIRAH", row: 0, col: 6, dir: "V" },
  { word: "SOLAT", row: 5, col: 5, dir: "V" },
];
export const PI_DARJAH4_CLUES: Record<string, string> = {
  AKHLAK: "Budi pekerti",
  SABAR: "Tidak mudah marah",
  SYUKUR: "Terima kasih kepada Allah",
  HIJRAH: "Berpindah dari Makkah ke Madinah",
  AMANAH: "Boleh dipercayai",
  ISTIQAMAH: "Tetap pendirian",
  UKHUWAH: "Persaudaraan",
  TAWADUK: "Rendah diri",
  SIRAH: "Riwayat hidup Nabi",
  SOLAT: "Ibadat 5 waktu",
};

// Sains Darjah 4
export const SAINS_DARJAH4_WORDS: Word[] = [
  { word: "HABITAT", row: 0, col: 0, dir: "H" },
  { word: "SELULAR", row: 2, col: 0, dir: "H" },
  { word: "TENAGA", row: 4, col: 0, dir: "H" },
  { word: "SOLAR", row: 6, col: 0, dir: "H" },
  { word: "ADAPTASI", row: 8, col: 0, dir: "H" },
  { word: "PENCEMARAN", row: 0, col: 9, dir: "V" },
  { word: "EKOSISTEM", row: 0, col: 8, dir: "V" },
  { word: "KINETIK", row: 0, col: 7, dir: "V" },
  { word: "SEMULA", row: 0, col: 6, dir: "V" },
  { word: "KITAR", row: 5, col: 5, dir: "V" },
];
export const SAINS_DARJAH4_CLUES: Record<string, string> = {
  HABITAT: "Tempat tinggal organisma",
  SELULAR: "Berkaitan dengan sel",
  TENAGA: "Keupayaan untuk lakukan kerja",
  SOLAR: "Tenaga dari matahari",
  ADAPTASI: "Penyesuaian dengan persekitaran",
  PENCEMARAN: "Bahan berbahaya di alam",
  EKOSISTEM: "Komuniti organisma + persekitaran",
  KINETIK: "Tenaga pergerakan",
  SEMULA: "Kitar ___ bahan buangan",
  KITAR: "___ semula bahan",
};

// Bahasa Melayu Darjah 5
export const BM_DARJAH5_WORDS: Word[] = [
  { word: "NOVEL", row: 0, col: 0, dir: "H" },
  { word: "CERPEN", row: 2, col: 0, dir: "H" },
  { word: "TEMA", row: 4, col: 0, dir: "H" },
  { word: "PLOT", row: 6, col: 0, dir: "H" },
  { word: "WATAK", row: 8, col: 0, dir: "H" },
  { word: "LATAR", row: 0, col: 9, dir: "V" },
  { word: "SUDUT", row: 0, col: 7, dir: "V" },
  { word: "IMBUHAN", row: 0, col: 5, dir: "V" },
  { word: "BAHASA", row: 0, col: 3, dir: "V" },
  { word: "PROSA", row: 5, col: 1, dir: "V" },
];
export const BM_DARJAH5_CLUES: Record<string, string> = {
  NOVEL: "Karya prosa panjang berbentuk naratif",
  CERPEN: "Cerita pendek kurang 10000 patah perkataan",
  TEMA: "Persoalan utama karya",
  PLOT: "Susunan peristiwa dalam cerita",
  WATAK: "Orang dalam cerita",
  LATAR: "Tempat dan masa cerita",
  SUDUT: "___ pandangan: cara pencerita melihat cerita",
  IMBUHAN: "Tambahan pada kata",
  BAHASA: "Gaya ___: cara pengarang menggunakan bahasa",
  PROSA: "Karya ___: bentuk tulisan bebas dari pantun",
};

// Matematik Darjah 5
export const MATE_DARJAH5_WORDS: Word[] = [
  { word: "PERDANA", row: 0, col: 0, dir: "H" },
  { word: "FAKTOR", row: 2, col: 0, dir: "H" },
  { word: "GANDAAN", row: 4, col: 0, dir: "H" },
  { word: "BULATAN", row: 6, col: 0, dir: "H" },
  { word: "JEJARI", row: 8, col: 0, dir: "H" },
  { word: "PECAHAN", row: 0, col: 9, dir: "V" },
  { word: "PERPULUHAN", row: 0, col: 7, dir: "V" },
  { word: "DIAMETER", row: 0, col: 5, dir: "V" },
  { word: "PERIMETER", row: 0, col: 3, dir: "V" },
  { word: "LUAS", row: 5, col: 1, dir: "V" },
];
export const MATE_DARJAH5_CLUES: Record<string, string> = {
  PERDANA: "Nombor yang hanya boleh dibahagi 1 dan dirinya",
  FAKTOR: "Nombor yang boleh membahagi dengan tepat",
  GANDAAN: "Hasil darab sesuatu nombor",
  BULATAN: "Bentuk melengkung tanpa sudut",
  JEJARI: "Jarak dari pusat ke tepi bulatan",
  PECAHAN: "Nombor dalam bentut a/b",
  PERPULUHAN: "Nombor dengan titik",
  DIAMETER: "Garis lurus melalui pusat bulatan",
  PERIMETER: "Jumlah semua sisi",
  LUAS: "Ruang dalam bentuk",
};

// Bahasa Inggeris Darjah 5
export const BI_DARJAH5_WORDS: Word[] = [
  { word: "PASSIVE", row: 0, col: 0, dir: "H" },
  { word: "IDIOM", row: 2, col: 0, dir: "H" },
  { word: "COMPLEX", row: 4, col: 0, dir: "H" },
  { word: "REPORTED", row: 6, col: 0, dir: "H" },
  { word: "PERFECT", row: 8, col: 0, dir: "H" },
  { word: "CONDITIONAL", row: 0, col: 9, dir: "V" },
  { word: "CLAUSE", row: 0, col: 7, dir: "V" },
  { word: "SPEECH", row: 0, col: 5, dir: "V" },
  { word: "SUBJECT", row: 0, col: 3, dir: "V" },
  { word: "AGREEMENT", row: 5, col: 1, dir: "V" },
];
export const BI_DARJAH5_CLUES: Record<string, string> = {
  PASSIVE: "Subject receives the action",
  IDIOM: "Phrase with figurative meaning",
  COMPLEX: "Main clause + subordinate clause",
  REPORTED: "Telling what someone said",
  PERFECT: "Present ___: has/have + past participle",
  CONDITIONAL: "If-then sentence",
  CLAUSE: "Group of words with subject and verb",
  SPEECH: "Reported ___: indirect quotation",
  SUBJECT: "___-verb agreement: match in number",
  AGREEMENT: "Subject-verb ___",
};

// Jawi Darjah 5
export const JAWI_DARJAH5_WORDS: Word[] = [
  { word: "JAWI", row: 0, col: 0, dir: "H" },
  { word: "EJAAN", row: 2, col: 0, dir: "H" },
  { word: "HURUF", row: 4, col: 0, dir: "H" },
  { word: "MELAYU", row: 6, col: 0, dir: "H" },
  { word: "BAHASA", row: 8, col: 0, dir: "H" },
  { word: "TULISAN", row: 0, col: 9, dir: "V" },
  { word: "KHAT", row: 0, col: 7, dir: "V" },
  { word: "ARAB", row: 0, col: 5, dir: "V" },
  { word: "BUDAYA", row: 0, col: 3, dir: "V" },
  { word: "WARISAN", row: 5, col: 1, dir: "V" },
];
export const JAWI_DARJAH5_CLUES: Record<string, string> = {
  JAWI: "Tulisan kita",
  EJAAN: "Cara susun huruf",
  HURUF: "Aksara dalam tulisan",
  MELAYU: "Bahasa kita",
  BAHASA: "Cara berkomunikasi",
  TULISAN: "Hasil yang ditulis",
  KHAT: "Seni tulisan",
  ARAB: "Bahasa asal Jawi",
  BUDAYA: "Cara hidup masyarakat",
  WARISAN: "Pewarisan budaya",
};

// Pendidikan Islam Darjah 5
export const PI_DARJAH5_WORDS: Word[] = [
  { word: "AQIDAH", row: 0, col: 0, dir: "H" },
  { word: "SYARIAH", row: 2, col: 0, dir: "H" },
  { word: "AKHLAK", row: 4, col: 0, dir: "H" },
  { word: "SUNNAH", row: 6, col: 0, dir: "H" },
  { word: "HIJRAH", row: 8, col: 0, dir: "H" },
  { word: "MUAMALAT", row: 0, col: 9, dir: "V" },
  { word: "FARDU", row: 0, col: 7, dir: "V" },
  { word: "IBADAT", row: 0, col: 5, dir: "V" },
  { word: "SIRAH", row: 0, col: 3, dir: "V" },
  { word: "DAKWAH", row: 5, col: 1, dir: "V" },
];
export const PI_DARJAH5_CLUES: Record<string, string> = {
  AQIDAH: "Kepercayaan dan keyakinan dalam Islam",
  SYARIAH: "Undang-undang Islam",
  AKHLAK: "Budi pekerti",
  SUNNAH: "Amalan Nabi yang digalakkan",
  HIJRAH: "Berpindah dari Makkah ke Madinah",
  MUAMALAT: "Urusan sesama manusia",
  FARDU: "Kewajipan dalam Islam",
  IBADAT: "Segala perbuatan kerana Allah",
  SIRAH: "Riwayat hidup Nabi",
  DAKWAH: "Menyeru kepada kebaikan",
};

// Sains Darjah 5
export const SAINS_DARJAH5_WORDS: Word[] = [
  { word: "EKOLOGI", row: 0, col: 0, dir: "H" },
  { word: "HABITAT", row: 2, col: 0, dir: "H" },
  { word: "TENAGA", row: 4, col: 0, dir: "H" },
  { word: "NUKLEAR", row: 6, col: 0, dir: "H" },
  { word: "BIODIVERSITI", row: 8, col: 0, dir: "H" },
  { word: "DNA", row: 0, col: 9, dir: "V" },
  { word: "KROMOSOM", row: 0, col: 7, dir: "V" },
  { word: "EKOSISTEM", row: 0, col: 5, dir: "V" },
  { word: "GEOTERMA", row: 0, col: 3, dir: "V" },
  { word: "SPESIES", row: 5, col: 1, dir: "V" },
];
export const SAINS_DARJAH5_CLUES: Record<string, string> = {
  EKOLOGI: "Kajian hubungan organisma dengan persekitaran",
  HABITAT: "Tempat tinggal organisma",
  TENAGA: "Keupayaan untuk lakukan kerja",
  NUKLEAR: "Tenaga dari pembelahan atom",
  BIODIVERSITI: "Kepelbagaian spesies hidupan",
  DNA: "Bahan genetik dalam sel",
  KROMOSOM: "DNA yang tergulung",
  EKOSISTEM: "Komuniti organisma dan persekitaran",
  GEOTERMA: "Tenaga panas bumi",
  SPESIES: "Kumpulan organisma yang sama",
};


// Bahasa Melayu Darjah 6 — 15x15 grid with 10 words.
export const BM_DARJAH6_WORDS: Word[] = [
  { word: "KONOTASI", row: 0, col: 0, dir: "H" },
  { word: "WACANA", row: 2, col: 0, dir: "H" },
  { word: "LARAS", row: 4, col: 0, dir: "H" },
  { word: "SURAT", row: 6, col: 0, dir: "H" },
  { word: "KOHESI", row: 8, col: 0, dir: "H" },
  { word: "DENOTASI", row: 0, col: 9, dir: "V" },
  { word: "EUFEMISME", row: 0, col: 8, dir: "V" },
  { word: "BAHASA", row: 1, col: 5, dir: "V" },
  { word: "FORMAL", row: 1, col: 6, dir: "V" },
  { word: "INVERSI", row: 1, col: 7, dir: "V" },
];
export const BM_DARJAH6_CLUES: Record<string, string> = {
  KONOTASI: "Makna tersirat atau tambahan sesuatu perkataan",
  DENOTASI: "Makna literal dalam kamus",
  WACANA: "Unit bahasa yang lebih besar dari ayat",
  LARAS: "Variasi bahasa mengikut bidang atau situasi",
  SURAT: "Format rasmi mengandungi alamat, tarikh, tajuk, isi, penutup",
  KOHESI: "Kesinambungan dan perkaitan antara ayat",
  EUFEMISME: "Kata halus menggantikan kata kasar",
  BAHASA: "Laras ___ = variasi bahasa",
  FORMAL: "Bahasa baku dan sopan",
  INVERSI: "Subjek diletakkan di belakang predikat",
};

// Matematik Darjah 6 — 15x15 grid with 10 words.
export const MATE_DARJAH6_WORDS: Word[] = [
  { word: "NISBAH", row: 0, col: 0, dir: "H" },
  { word: "FAEDAH", row: 2, col: 0, dir: "H" },
  { word: "UNTUNG", row: 4, col: 0, dir: "H" },
  { word: "RUGI", row: 6, col: 0, dir: "H" },
  { word: "SILINDER", row: 8, col: 0, dir: "H" },
  { word: "PERATUSAN", row: 0, col: 9, dir: "V" },
  { word: "KEBOLEHAN", row: 0, col: 8, dir: "V" },
  { word: "PECAHAN", row: 1, col: 6, dir: "V" },
  { word: "ISIPADU", row: 1, col: 7, dir: "V" },
  { word: "MIN", row: 1, col: 5, dir: "V" },
];
export const MATE_DARJAH6_CLUES: Record<string, string> = {
  NISBAH: "Bahagikan mengikut nisbah",
  FAEDAH: "Keuntungan daripada pelaburan",
  UNTUNG: "Keuntungan dalam perniagaan",
  RUGI: "Kerugian dalam perniagaan",
  SILINDER: "Bentuk tiub dengan dua bulatan",
  PERATUSAN: "Per 100",
  KEBOLEHAN: "Kemungkinan atau probabiliti",
  PECAHAN: "Nombor dalam bentuk a/b",
  ISIPADU: "Ruang dalam bentuk tiga dimensi",
  MIN: "Purata",
};

// Bahasa Inggeris Darjah 6 — 15x15 grid with 10 words.
export const BI_DARJAH6_WORDS: Word[] = [
  { word: "NARRATIVE", row: 0, col: 0, dir: "H" },
  { word: "THESIS", row: 2, col: 0, dir: "H" },
  { word: "IRONY", row: 4, col: 0, dir: "H" },
  { word: "ACTIVE", row: 6, col: 0, dir: "H" },
  { word: "PASSIVE", row: 8, col: 0, dir: "H" },
  { word: "EXPOSITORY", row: 0, col: 9, dir: "V" },
  { word: "CITATION", row: 0, col: 8, dir: "V" },
  { word: "RHETORICAL", row: 0, col: 7, dir: "V" },
  { word: "TRANSITION", row: 0, col: 6, dir: "V" },
  { word: "CLAUSE", row: 0, col: 5, dir: "V" },
];
export const BI_DARJAH6_CLUES: Record<string, string> = {
  NARRATIVE: "Telling a story",
  THESIS: "Main argument of essay",
  IRONY: "Saying opposite of what is meant",
  ACTIVE: "Subject does action",
  PASSIVE: "Subject receives action",
  EXPOSITORY: "Explaining or informing",
  CITATION: "Reference to source",
  RHETORICAL: "Question asked for effect not answer",
  TRANSITION: "Word that connects ideas",
  CLAUSE: "Group of words with subject and verb",
};

// Jawi Darjah 6 — 15x15 grid with 10 words.
export const JAWI_DARJAH6_WORDS: Word[] = [
  { word: "JAWI", row: 0, col: 0, dir: "H" },
  { word: "MELAYU", row: 2, col: 0, dir: "H" },
  { word: "WARISAN", row: 4, col: 0, dir: "H" },
  { word: "BUDAYA", row: 6, col: 0, dir: "H" },
  { word: "EJAAN", row: 8, col: 0, dir: "H" },
  { word: "TULISAN", row: 0, col: 9, dir: "V" },
  { word: "KHAT", row: 0, col: 8, dir: "V" },
  { word: "ARAB", row: 0, col: 7, dir: "V" },
  { word: "BAHASA", row: 0, col: 6, dir: "V" },
  { word: "SEJARAH", row: 0, col: 5, dir: "V" },
];
export const JAWI_DARJAH6_CLUES: Record<string, string> = {
  JAWI: "Tulisan kita",
  MELAYU: "Bahasa kita",
  WARISAN: "Harta pusaka budaya",
  BUDAYA: "Cara hidup masyarakat",
  EJAAN: "Cara susun huruf",
  TULISAN: "Hasil yang ditulis",
  KHAT: "Seni tulisan",
  ARAB: "Bahasa asal tulisan Jawi",
  BAHASA: "Cara berkomunikasi",
  SEJARAH: "Perkembangan tulisan Jawi",
};

// Pendidikan Islam Darjah 6 — 15x15 grid with 10 words.
export const PI_DARJAH6_WORDS: Word[] = [
  { word: "TAUHID", row: 0, col: 0, dir: "H" },
  { word: "SYIRIK", row: 2, col: 0, dir: "H" },
  { word: "JIHAD", row: 4, col: 0, dir: "H" },
  { word: "RIDDAH", row: 6, col: 0, dir: "H" },
  { word: "NIFAK", row: 8, col: 0, dir: "H" },
  { word: "RIAK", row: 0, col: 9, dir: "V" },
  { word: "AQIDAH", row: 0, col: 8, dir: "V" },
  { word: "IKHLAS", row: 0, col: 7, dir: "V" },
  { word: "AMANAH", row: 0, col: 6, dir: "V" },
  { word: "TAWADUK", row: 0, col: 5, dir: "V" },
];
export const PI_DARJAH6_CLUES: Record<string, string> = {
  TAUHID: "Mengesakan Allah",
  SYIRIK: "Menyekutukan Allah",
  JIHAD: "Berjuang di jalan Allah",
  RIDDAH: "Keluar dari Islam",
  NIFAK: "Munafik berpura-pura Islam",
  RIAK: "Beramal untuk dipuji manusia",
  AQIDAH: "Kepercayaan dalam Islam",
  IKHLAS: "Beramal kerana Allah",
  AMANAH: "Boleh dipercayai",
  TAWADUK: "Rendah diri",
};

// Sains Darjah 6 — 15x15 grid with 10 words.
export const SAINS_DARJAH6_WORDS: Word[] = [
  { word: "EVOLUSI", row: 0, col: 0, dir: "H" },
  { word: "FOSIL", row: 2, col: 0, dir: "H" },
  { word: "DARWIN", row: 4, col: 0, dir: "H" },
  { word: "LESTARI", row: 6, col: 0, dir: "H" },
  { word: "IKLIM", row: 8, col: 0, dir: "H" },
  { word: "SELEKSI", row: 0, col: 9, dir: "V" },
  { word: "SPESIES", row: 0, col: 8, dir: "V" },
  { word: "KARBON", row: 0, col: 7, dir: "V" },
  { word: "EKOSISTEM", row: 0, col: 6, dir: "V" },
  { word: "BIODIVERSITI", row: 0, col: 5, dir: "V" },
];
export const SAINS_DARJAH6_CLUES: Record<string, string> = {
  EVOLUSI: "Perubahan perlahan spesies dari generasi ke generasi",
  FOSIL: "Sisa organisma purba dalam batuan",
  DARWIN: "Pencetus teori evolusi",
  LESTARI: "Pembangunan tanpa menjejaskan masa depan",
  IKLIM: "Perubahan jangka panjang dalam iklim bumi",
  SELEKSI: "Alam memilih yang terbaik untuk hidup",
  SPESIES: "Kumpulan organisma yang boleh membiak antara satu sama lain",
  KARBON: "Jejak ___ = CO2 yang dihasilkan aktiviti manusia",
  EKOSISTEM: "Komuniti organisma dan persekitaran",
  BIODIVERSITI: "Kepelbagaian spesies hidupan",
};
