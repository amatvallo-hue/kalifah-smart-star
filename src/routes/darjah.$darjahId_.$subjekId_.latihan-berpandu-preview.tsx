import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/latihan-berpandu-preview")({
  head: () => ({
    meta: [{ title: "PROTOTAIP — Latihan Berpandu — Kalifah.my" }],
  }),
  ssr: false,
  component: LatihanBerpanduPreviewPage,
});

// ============================================================
// DATA — 10 soalan Bahagian A (hardcoded prototype only)
// ============================================================

type Cell = number | string | null;

interface MCQInput {
  id: string;
  lbl: string;
  ans: string;
  type: "mcq4";
  pilihan: string[];
}
interface TextInput {
  id: string;
  lbl: string;
  ans: string;
  d?: string;
  type?: undefined;
}
interface FracInput {
  id: string;
  lbl: string;
  src: string;
  ans_n: string;
  ans_d: string;
  type: "frac2";
}
interface PctFracInput {
  id: string;
  lbl: string;
  pct: string;
  ans_n: string;
  ans_d: string;
  type: "pct-frac";
}
interface Peratus2Input {
  id: string;
  lbl: string;
  ans: string;
  d?: string;
  type: "peratus2";
}

type LInput = MCQInput | TextInput | FracInput | PctFracInput | Peratus2Input;

interface Galus {
  type: "tambah" | "tolak" | "darab" | "bahagi";
  pfx: string;
  cols: string[];
  r1?: Cell[];
  r2?: Cell[];
  pAns?: Cell[]; // carry/borrow row (tambah/tolak/darab)
  rAns?: Cell[]; // result row
  bAns?: Cell[]; // darab carry row
  divisor?: number;
  dividend?: Cell[];
  qAns?: Cell[]; // bahagi quotient
  cellLen?: number;
}

interface Langkah {
  n: string;
  ar: string;
  inputs?: LInput[];
  galus?: Galus;
}

interface Soalan {
  id: string;
  topik: string;
  soalan: string;
  diberi: { l: string; v: string }[];
  cari: string;
  langkah: Langkah[];
  fa: { lbl: string; ans: string; d?: string; unit: string };
  hint: string;
}

const OP_PILIHAN = ["Tambah (+)", "Tolak (−)", "Darab (×)", "Bahagi (÷)"];

const QS: Soalan[] = [
  {
    id: "A1", topik: "Nombor Bulat",
    soalan: "Dalam nombor 83 756, apakah beza antara nilai digit 3 dengan nilai digit 7?",
    diberi: [{ l: "Nombor", v: "83 756" }],
    cari: "Beza antara nilai digit 3 dan nilai digit 7",
    langkah: [
      {
        n: "Langkah 1", ar: "Tentukan nilai setiap digit dalam nombor 83 756",
        inputs: [
          { id: "v3", lbl: "Nilai digit 3", ans: "3000", d: "3 000" },
          { id: "v7", lbl: "Nilai digit 7", ans: "700" },
        ],
      },
      {
        n: "Langkah 2", ar: "Pilih operasi untuk hitung beza, kemudian buat pengiraan menggunakan bentuk lazim",
        inputs: [{ id: "op_a1", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a1l2",
          cols: ["Ri", "Ra", "Pu", "Sa"],
          r1: [3, 0, 0, 0], r2: [0, 7, 0, 0],
          pAns: [1, 0, 0, 0], rAns: [2, 3, 0, 0],
        },
      },
    ],
    fa: { lbl: "Beza ialah", ans: "2300", d: "2 300", unit: "" },
    hint: "Nilai digit 3 = 3 000 (tempat ribu). Nilai digit 7 = 700 (tempat ratus). Beza = 3 000 − 700 = 2 300.",
  },
  {
    id: "A2", topik: "Penambahan",
    soalan: "Dua nombor lima digit apabila dijumlahkan menghasilkan 83 214. Nombor pertama ialah 45 678. Apakah nombor kedua?",
    diberi: [{ l: "Jumlah kedua-dua nombor", v: "83 214" }, { l: "Nombor pertama", v: "45 678" }],
    cari: "Nombor kedua",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi yang betul untuk mencari nombor kedua",
        inputs: [{ id: "op", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
      },
      {
        n: "Langkah 2", ar: "Buat pengiraan menggunakan bentuk lazim",
        galus: {
          type: "tolak", pfx: "a2l2",
          cols: ["PTRi", "Ri", "Ra", "Pu", "Sa"],
          r1: [8, 3, 2, 1, 4], r2: [4, 5, 6, 7, 8],
          pAns: [1, 1, 1, 1, 0], rAns: [3, 7, 5, 3, 6],
        },
      },
    ],
    fa: { lbl: "Nombor kedua ialah", ans: "37536", d: "37 536", unit: "" },
    hint: "Nombor kedua = Jumlah − Nombor pertama = 83 214 − 45 678 = 37 536.",
  },
  {
    id: "A3", topik: "Penolakan",
    soalan: "Sebuah stadium boleh memuatkan 62 500 orang. Pada satu perlawanan bola sepak, 38 764 kerusi telah dijual. Berapakah bilangan kerusi yang masih belum dijual?",
    diberi: [{ l: "Jumlah kerusi", v: "62 500" }, { l: "Kerusi sudah dijual", v: "38 764" }],
    cari: "Bilangan kerusi yang belum dijual",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi yang betul",
        inputs: [{ id: "op", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
      },
      {
        n: "Langkah 2", ar: "Buat pengiraan menggunakan bentuk lazim",
        galus: {
          type: "tolak", pfx: "a3l2",
          cols: ["PTRi", "Ri", "Ra", "Pu", "Sa"],
          r1: [6, 2, 5, 0, 0], r2: [3, 8, 7, 6, 4],
          pAns: [1, 1, 1, 1, 0], rAns: [2, 3, 7, 3, 6],
        },
      },
    ],
    fa: { lbl: "Bilangan kerusi yang belum dijual ialah", ans: "23736", d: "23 736", unit: "kerusi" },
    hint: "Jumlah kerusi − kerusi dijual = belum dijual. 62 500 − 38 764 = 23 736 kerusi.",
  },
  {
    id: "A4", topik: "Darab dan Bahagi",
    soalan: "Sebuah ladang menghasilkan 2 460 biji epal setiap hari selama 3 hari. Kemudian semua epal dibungkus ke dalam pek yang mengandungi 4 biji setiap satu. Berapakah bilangan pek yang diperlukan?",
    diberi: [{ l: "Epal sehari", v: "2 460" }, { l: "Bilangan hari", v: "3" }, { l: "Epal setiap pek", v: "4" }],
    cari: "Bilangan pek yang diperlukan",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi untuk kira jumlah epal dalam 3 hari, kemudian buat pengiraan",
        inputs: [{ id: "op1", lbl: "Operasi", ans: "Darab (×)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "darab", pfx: "a4l1",
          cols: ["Ri", "Ra", "Pu", "Sa"],
          r1: [2, 4, 6, 0], r2: [null, null, null, 3],
          bAns: [0, 1, 1, 0], rAns: [7, 3, 8, 0],
        },
      },
      {
        n: "Langkah 2", ar: "Pilih operasi untuk kira bilangan pek, kemudian buat pengiraan",
        inputs: [{ id: "op2", lbl: "Operasi", ans: "Bahagi (÷)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "bahagi", pfx: "a4l2",
          cols: ["Ri", "Ra", "Pu", "Sa"],
          divisor: 4, dividend: [7, 3, 8, 0],
          qAns: [1, 8, 4, 5],
        },
      },
    ],
    fa: { lbl: "Bilangan pek yang diperlukan ialah", ans: "1845", d: "1 845", unit: "pek" },
    hint: "Langkah 1: 2 460 × 3 = 7 380 biji epal. Langkah 2: 7 380 ÷ 4 = 1 845 pek.",
  },
  {
    id: "A5", topik: "Pembahagian",
    soalan: "Sebanyak 8 376 buku perlu dimasukkan ke dalam kotak. Setiap kotak boleh memuatkan 6 buku. Berapakah bilangan kotak yang diperlukan?",
    diberi: [{ l: "Jumlah buku", v: "8 376" }, { l: "Buku setiap kotak", v: "6" }],
    cari: "Bilangan kotak yang diperlukan",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi yang sesuai, kemudian buat pengiraan menggunakan bentuk lazim",
        inputs: [{ id: "op_a5", lbl: "Operasi", ans: "Bahagi (÷)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "bahagi", pfx: "a5l1",
          cols: ["Ri", "Ra", "Pu", "Sa"],
          divisor: 6, dividend: [8, 3, 7, 6],
          qAns: [1, 3, 9, 6],
        },
      },
    ],
    fa: { lbl: "Bilangan kotak yang diperlukan ialah", ans: "1396", d: "1 396", unit: "kotak" },
    hint: "8 376 ÷ 6 = 1 396 kotak. 6 × 1 396 = 8 376 (tiada baki).",
  },
  {
    id: "A6", topik: "Pecahan",
    soalan: "Farah makan 3/8 daripada satu piza. Ahmad makan 5/12 daripada piza yang sama saiz. Siapakah yang makan lebih banyak? Tunjukkan pengiraan anda.",
    diberi: [{ l: "Bahagian dimakan Farah", v: "3/8" }, { l: "Bahagian dimakan Ahmad", v: "5/12" }],
    cari: "Siapa yang makan lebih banyak?",
    langkah: [
      {
        n: "Langkah 1", ar: "Cari penyebut sepunya (KGD) bagi 8 dan 12",
        inputs: [{ id: "kgd", lbl: "KGD (penyebut sepunya)", ans: "24" }],
      },
      {
        n: "Langkah 2", ar: "Tukar kedua-dua pecahan kepada penyebut yang sama",
        inputs: [
          { id: "farah", lbl: "Pecahan setara untuk Farah", src: "3/8", ans_n: "9", ans_d: "24", type: "frac2" },
          { id: "ahmad", lbl: "Pecahan setara untuk Ahmad", src: "5/12", ans_n: "10", ans_d: "24", type: "frac2" },
        ],
      },
    ],
    fa: { lbl: "Yang makan lebih banyak ialah", ans: "ahmad", d: "Ahmad", unit: "" },
    hint: "KGD(8,12)=24. 3/8 = 9/24, 5/12 = 10/24. Oleh kerana 10/24 > 9/24 → Ahmad makan lebih banyak.",
  },
  {
    id: "A7", topik: "Perpuluhan",
    soalan: "Jumlah berat tiga beg ialah 15.24 kg. Beg pertama beratnya 5.48 kg dan beg kedua beratnya 4.76 kg. Berapakah berat beg ketiga?",
    diberi: [{ l: "Jumlah berat 3 beg", v: "15.24 kg" }, { l: "Berat beg pertama", v: "5.48 kg" }, { l: "Berat beg kedua", v: "4.76 kg" }],
    cari: "Berat beg ketiga",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi untuk cari jumlah berat beg 1 dan beg 2, kemudian buat pengiraan",
        inputs: [{ id: "op_a7l1", lbl: "Operasi", ans: "Tambah (+)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tambah", pfx: "a7l1",
          cols: ["Pu", "Sa", ".", "T", "H"],
          r1: [0, 5, ".", 4, 8], r2: [0, 4, ".", 7, 6],
          pAns: [0, 1, null, 1, 0], rAns: [1, 0, ".", 2, 4],
        },
      },
      {
        n: "Langkah 2", ar: "Pilih operasi untuk cari berat beg ketiga, kemudian buat pengiraan",
        inputs: [{ id: "op_a7l2", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a7l2",
          cols: ["Pu", "Sa", ".", "T", "H"],
          r1: [1, 5, ".", 2, 4], r2: [1, 0, ".", 2, 4],
          pAns: [0, 0, null, 0, 0], rAns: [0, 5, ".", 0, 0],
        },
      },
    ],
    fa: { lbl: "Berat beg ketiga ialah", ans: "5.00", unit: "kg" },
    hint: "Langkah 1: 5.48 + 4.76 = 10.24 kg. Langkah 2: 15.24 − 10.24 = 5.00 kg.",
  },
  {
    id: "A8", topik: "Peratus",
    soalan: "Daripada 80 murid darjah 4, 45% adalah murid perempuan. Berapakah bilangan murid lelaki dalam kelas itu?",
    diberi: [{ l: "Jumlah murid", v: "80" }, { l: "Peratusan murid perempuan", v: "45%" }],
    cari: "Bilangan murid lelaki",
    langkah: [
      {
        n: "Langkah 1", ar: "Kira bilangan murid perempuan",
        inputs: [
          { id: "frac_a8", lbl: "Tulis 45% dalam bentuk pecahan", type: "pct-frac", pct: "45", ans_n: "45", ans_d: "100" },
          { id: "titik_a8", lbl: "Berapa kali perlu alihkan titik perpuluhan ke kiri?", ans: "2" },
          { id: "pec_a8", lbl: "Tulis dalam bentuk perpuluhan", ans: "0.45", d: "0.45", type: "peratus2" },
          { id: "op_a8l1", lbl: "Operasi untuk darab dengan jumlah murid", ans: "Darab (×)", type: "mcq4", pilihan: OP_PILIHAN },
        ],
        galus: {
          type: "darab", pfx: "a8l1g",
          cols: ["Pu", "Sa", ".", "T", "H"],
          r1: [0, 0, ".", 4, 5], r2: [null, null, null, 8, 0],
          bAns: [null, 1, null, 1, null], rAns: [3, 6, ".", 0, 0],
        },
      },
      {
        n: "Langkah 2", ar: "Pilih operasi untuk kira bilangan murid lelaki, kemudian buat pengiraan",
        inputs: [{ id: "op_a8", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a8l2",
          cols: ["Pu", "Sa"],
          r1: [8, 0], r2: [3, 6],
          pAns: [1, 0], rAns: [4, 4],
        },
      },
    ],
    fa: { lbl: "Bilangan murid lelaki ialah", ans: "44", unit: "orang" },
    hint: "Langkah 1: 45% × 80 = 45×80÷100 = 3600÷100 = 36 orang perempuan. Langkah 2: 80 − 36 = 44 orang lelaki.",
  },
  {
    id: "A9", topik: "Wang",
    soalan: "Harga asal sebuah baju ialah RM 45.00. Kedai memberikan diskaun sebanyak 20%. Berapakah harga baju itu selepas diskaun?",
    diberi: [{ l: "Harga asal", v: "RM 45.00" }, { l: "Kadar diskaun", v: "20%" }],
    cari: "Harga selepas diskaun",
    langkah: [
      {
        n: "Langkah 1", ar: "Kira jumlah diskaun",
        inputs: [
          { id: "frac_a9", lbl: "Tulis 20% dalam bentuk pecahan", type: "pct-frac", pct: "20", ans_n: "20", ans_d: "100" },
          { id: "titik_a9", lbl: "Berapa kali perlu alihkan titik perpuluhan ke kiri?", ans: "2" },
          { id: "pec_a9", lbl: "Tulis dalam bentuk perpuluhan", ans: "0.2", d: "0.20", type: "peratus2" },
          { id: "op_a9l1", lbl: "Operasi untuk darab dengan harga asal", ans: "Darab (×)", type: "mcq4", pilihan: OP_PILIHAN },
        ],
        galus: {
          type: "darab", pfx: "a9l1g",
          cols: ["Pu", "Sa", ".", "T", "H"],
          r1: [0, 0, ".", 2, 0], r2: [null, null, null, 4, 5],
          bAns: [null, 1, null, 1, null], rAns: [0, 9, ".", 0, 0],
        },
      },
      {
        n: "Langkah 2", ar: "Pilih operasi untuk kira harga selepas diskaun, kemudian buat pengiraan",
        inputs: [{ id: "op_a9", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a9l2",
          cols: ["Pu", "Sa"],
          r1: [4, 5], r2: [0, 9],
          pAns: [1, 0], rAns: [3, 6],
        },
      },
    ],
    fa: { lbl: "Harga baju selepas diskaun ialah RM", ans: "36.00", unit: "" },
    hint: "Langkah 1: 20% × RM 45 = 20×45÷100 = RM 9.00 (diskaun). Langkah 2: RM 45 − RM 9 = RM 36.00.",
  },
  {
    id: "A10", topik: "Masa dan Waktu",
    soalan: "Sebuah bas bertolak dari Bandar A pada pukul 7.45 pagi dan tiba di Bandar B pada pukul 11.20 pagi. Sepanjang perjalanan, bas berhenti selama 35 minit untuk rehat. Berapakah masa perjalanan sebenar bas, tidak termasuk masa rehat?",
    diberi: [{ l: "Masa bertolak", v: "7.45 pagi" }, { l: "Masa tiba", v: "11.20 pagi" }, { l: "Masa rehat", v: "35 minit" }],
    cari: "Masa perjalanan sebenar (tidak termasuk rehat)",
    langkah: [
      {
        n: "Langkah 1", ar: "Pilih operasi dan kira jumlah masa perjalanan keseluruhan (masa tiba − masa bertolak)",
        inputs: [{ id: "op_a10l1", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a10l1",
          cols: ["Jam", "Minit"],
          r1: [11, 20], r2: [7, 45],
          pAns: [1, 0], rAns: [3, 35], cellLen: 2,
        },
      },
      {
        n: "Langkah 2", ar: "Pilih operasi dan tolak masa rehat daripada jumlah masa perjalanan",
        inputs: [{ id: "op_a10l2", lbl: "Operasi", ans: "Tolak (−)", type: "mcq4", pilihan: OP_PILIHAN }],
        galus: {
          type: "tolak", pfx: "a10l2",
          cols: ["Jam", "Minit"],
          r1: [3, 35], r2: [0, 35],
          pAns: [0, 0], rAns: [3, 0], cellLen: 2,
        },
      },
    ],
    fa: { lbl: "Masa perjalanan sebenar bas ialah", ans: "3jam", d: "3 jam", unit: "" },
    hint: "Langkah 1: 11 jam 20 minit − 7 jam 45 minit = 3 jam 35 minit. Langkah 2: 3 jam 35 minit − 35 minit = 3 jam.",
  },
];

// ============================================================
// chk() — semakan jawapan toleran
// ============================================================
function norm(s: string) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "");
}
function chk(student: string | undefined, correct: string): boolean {
  if (!student || student.trim() === "") return false;
  const s = norm(student), c = norm(correct);
  if (s === c) return true;
  const sn = s.replace(/[^\d.]/g, "");
  const cn = c.replace(/[^\d.]/g, "");
  if (sn && cn && sn === cn) return true;
  const sf = parseFloat(sn), cf = parseFloat(cn);
  if (!isNaN(sf) && !isNaN(cf) && Math.abs(sf - cf) < 0.01) return true;
  if (cn && s.includes(cn)) return true;
  return false;
}

// ============================================================
// Component
// ============================================================
function LatihanBerpanduPreviewPage() {
  const { darjahId, subjekId } = useParams({
    from: "/darjah/$darjahId_/$subjekId_/latihan-berpandu-preview",
  });

  // qIdx: 0..QS.length-1 = soalan; QS.length = review screen
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [reviewQ, setReviewQ] = useState(0);

  function set(key: string, val: string) {
    setAnswers((p) => ({ ...p, [key]: val }));
  }

  function reset() {
    setQIdx(0);
    setAnswers({});
    setSubmitted({});
    setShowHint({});
    setReviewQ(0);
  }

  // ==== REVIEW SCREEN ====
  if (qIdx >= QS.length) {
    return (
      <ReviewScreen
        answers={answers}
        reviewQ={reviewQ}
        setReviewQ={setReviewQ}
        onReset={reset}
        darjahId={darjahId}
        subjekId={subjekId}
      />
    );
  }

  const q = QS[qIdx];
  const isSubmitted = !!submitted[qIdx];

  const finalKey = `${qIdx}:final`;
  const finalOk = chk(answers[finalKey], q.fa.ans);

  function onSemak() {
    setSubmitted((p) => ({ ...p, [qIdx]: true }));
    if (!finalOk) setShowHint((p) => ({ ...p, [qIdx]: true }));
  }

  function onNext() {
    setQIdx(qIdx + 1);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <span>⚠️</span>
          PROTOTAIP — Latihan Berpandu (belum ciri sebenar)
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {QS.map((qq, i) => (
            <div
              key={qq.id}
              className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-soft transition ${
                i === qIdx
                  ? "bg-primary text-primary-foreground scale-110"
                  : submitted[i]
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {submitted[i] && i !== qIdx ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Soalan {qIdx + 1} / {QS.length} · {q.topik}
        </p>

        {/* Soalan */}
        <section className="mt-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {q.id} · {q.topik}
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{q.soalan}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.diberi.map((d, i) => (
              <div key={i} className="rounded-2xl bg-muted/40 px-4 py-2 text-sm font-semibold">
                <span className="text-muted-foreground">{d.l}: </span>
                <span className="font-extrabold text-foreground">{d.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-2xl bg-green-50 border-2 border-green-500 px-4 py-2 text-sm font-semibold text-green-900">
            Cari: <span className="font-extrabold">{q.cari}</span>
          </div>
        </section>

        {/* Langkah */}
        {q.langkah.map((lg, li) => (
          <LangkahBlock
            key={li}
            langkah={lg}
            qIdx={qIdx}
            lIdx={li}
            answers={answers}
            set={set}
            isSubmitted={isSubmitted}
          />
        ))}

        {/* Jawapan akhir */}
        <section className="mt-6 rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Jawapan Akhir
          </p>
          <label className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold">
            <span>{q.fa.lbl}</span>
            <input
              type="text"
              value={answers[finalKey] ?? ""}
              onChange={(e) => set(finalKey, e.target.value)}
              disabled={isSubmitted}
              className={`w-32 rounded-xl border-2 px-3 py-2 text-center font-display text-lg font-extrabold outline-none focus:border-primary ${
                isSubmitted
                  ? finalOk
                    ? "border-green-500 bg-green-50 text-green-900"
                    : "border-red-500 bg-red-50 text-red-900"
                  : "border-border bg-card"
              }`}
              placeholder="?"
            />
            {q.fa.unit && <span>{q.fa.unit}</span>}
          </label>
          {isSubmitted && !finalOk && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-800">
              Jawapan betul:{" "}
              <span className="font-extrabold">
                {q.fa.d ?? q.fa.ans} {q.fa.unit}
              </span>
            </p>
          )}
        </section>

        {/* Hint */}
        {(showHint[qIdx] || isSubmitted) && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{q.hint}</span>
          </div>
        )}

        {!isSubmitted && (
          <button
            onClick={() => setShowHint((p) => ({ ...p, [qIdx]: !p[qIdx] }))}
            className="mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900"
          >
            {showHint[qIdx] ? "Sorok petunjuk" : "Tunjuk petunjuk"}
          </button>
        )}

        {/* Nav */}
        <div className="mt-6 flex justify-end gap-3">
          {!isSubmitted ? (
            <button
              onClick={onSemak}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              Semak Jawapan
              <Check className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              {qIdx === QS.length - 1 ? "Lihat Keputusan" : "Soalan Seterusnya"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// LangkahBlock — render satu langkah (inputs + galus grid)
// ============================================================
function LangkahBlock({
  langkah, qIdx, lIdx, answers, set, isSubmitted,
}: {
  langkah: Langkah;
  qIdx: number;
  lIdx: number;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
}) {
  const opInput = langkah.inputs?.find((i) => "type" in i && i.type === "mcq4") as MCQInput | undefined;
  const opKey = opInput ? `${qIdx}:${lIdx}:${opInput.id}` : null;
  const opChosen = opKey ? answers[opKey] : undefined;
  const showGalus = langkah.galus && (!opInput || !!opChosen);

  return (
    <section className="mt-4 rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-extrabold text-foreground">
        {langkah.n}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{langkah.ar}</p>

      {langkah.inputs && (
        <div className="mt-4 space-y-4">
          {langkah.inputs.map((inp) => (
            <InputRow
              key={inp.id}
              inp={inp}
              qIdx={qIdx}
              lIdx={lIdx}
              answers={answers}
              set={set}
              isSubmitted={isSubmitted}
            />
          ))}
        </div>
      )}

      {showGalus && langkah.galus && (
        <div className="mt-5">
          <GalusGrid
            g={langkah.galus}
            qIdx={qIdx}
            lIdx={lIdx}
            answers={answers}
            set={set}
            isSubmitted={isSubmitted}
          />
        </div>
      )}
    </section>
  );
}

// ============================================================
// InputRow — text / mcq4 / frac2 / pct-frac / peratus2
// ============================================================
function InputRow({
  inp, qIdx, lIdx, answers, set, isSubmitted,
}: {
  inp: LInput;
  qIdx: number;
  lIdx: number;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
}) {
  const baseKey = `${qIdx}:${lIdx}:${inp.id}`;

  if ("type" in inp && inp.type === "mcq4") {
    const chosen = answers[baseKey];
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">{inp.lbl}</p>
        <div className="grid grid-cols-2 gap-2">
          {inp.pilihan.map((p) => {
            const isChosen = chosen === p;
            const isRight = p === inp.ans;
            const cls = !isChosen
              ? "bg-card border-border hover:border-primary"
              : isSubmitted
                ? isRight
                  ? "bg-green-100 border-green-500 text-green-900"
                  : "bg-red-100 border-red-500 text-red-900"
                : "bg-primary/10 border-primary text-primary";
            return (
              <button
                key={p}
                onClick={() => !isSubmitted && set(baseKey, p)}
                disabled={isSubmitted}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 font-display font-extrabold shadow-soft transition ${cls}`}
              >
                {isSubmitted && isChosen && (isRight ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                {p}
              </button>
            );
          })}
        </div>
        {isSubmitted && chosen !== inp.ans && (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
            Jawapan betul: <span className="font-extrabold">{inp.ans}</span>
          </p>
        )}
      </div>
    );
  }

  if ("type" in inp && inp.type === "frac2") {
    const nKey = `${baseKey}_n`, dKey = `${baseKey}_d`;
    const nOk = chk(answers[nKey], inp.ans_n);
    const dOk = chk(answers[dKey], inp.ans_d);
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">{inp.lbl}</p>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-extrabold text-muted-foreground">
            {inp.src} =
          </span>
          <FracInputPair
            nKey={nKey} dKey={dKey}
            nAns={inp.ans_n} dAns={inp.ans_d}
            answers={answers} set={set} isSubmitted={isSubmitted}
            nOk={nOk} dOk={dOk}
          />
        </div>
      </div>
    );
  }

  if ("type" in inp && inp.type === "pct-frac") {
    const nKey = `${baseKey}_n`, dKey = `${baseKey}_d`;
    const nOk = chk(answers[nKey], inp.ans_n);
    const dOk = chk(answers[dKey], inp.ans_d);
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">{inp.lbl}</p>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-extrabold text-muted-foreground">
            {inp.pct}% =
          </span>
          <FracInputPair
            nKey={nKey} dKey={dKey}
            nAns={inp.ans_n} dAns={inp.ans_d}
            answers={answers} set={set} isSubmitted={isSubmitted}
            nOk={nOk} dOk={dOk}
          />
        </div>
      </div>
    );
  }

  // text (default) or peratus2
  const val = answers[baseKey] ?? "";
  const ok = chk(val, inp.ans);
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-foreground">{inp.lbl}</label>
      <input
        type="text"
        value={val}
        onChange={(e) => set(baseKey, e.target.value)}
        disabled={isSubmitted}
        className={`w-40 rounded-xl border-2 px-3 py-2 font-display text-lg font-extrabold outline-none focus:border-primary ${
          isSubmitted
            ? ok
              ? "border-green-500 bg-green-50 text-green-900"
              : "border-red-500 bg-red-50 text-red-900"
            : "border-border bg-card"
        }`}
        placeholder="?"
      />
      {isSubmitted && !ok && (
        <p className="mt-1 text-xs font-semibold text-red-700">
          Jawapan betul: <span className="font-extrabold">{inp.d ?? inp.ans}</span>
        </p>
      )}
    </div>
  );
}

function FracInputPair({
  nKey, dKey, nAns, dAns, answers, set, isSubmitted, nOk, dOk,
}: {
  nKey: string; dKey: string; nAns: string; dAns: string;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
  nOk: boolean; dOk: boolean;
}) {
  const cls = (ok: boolean) =>
    isSubmitted
      ? ok
        ? "border-green-500 bg-green-50 text-green-900"
        : "border-red-500 bg-red-50 text-red-900"
      : "border-border bg-card";
  return (
    <div className="inline-flex flex-col items-center">
      <input
        type="text"
        value={answers[nKey] ?? ""}
        onChange={(e) => set(nKey, e.target.value)}
        disabled={isSubmitted}
        className={`w-16 rounded-xl border-2 px-2 py-1.5 text-center font-display text-lg font-extrabold outline-none focus:border-primary ${cls(nOk)}`}
        placeholder="?"
      />
      <div className="my-1 h-0.5 w-20 rounded bg-foreground" />
      <input
        type="text"
        value={answers[dKey] ?? ""}
        onChange={(e) => set(dKey, e.target.value)}
        disabled={isSubmitted}
        className={`w-16 rounded-xl border-2 px-2 py-1.5 text-center font-display text-lg font-extrabold outline-none focus:border-primary ${cls(dOk)}`}
        placeholder="?"
      />
      {isSubmitted && (!nOk || !dOk) && (
        <p className="mt-1 text-xs font-semibold text-red-700">
          Betul: <span className="font-extrabold">{nAns}/{dAns}</span>
        </p>
      )}
    </div>
  );
}

// ============================================================
// GalusGrid — dinamik ikut jenis operasi
// ============================================================
function GalusGrid({
  g, qIdx, lIdx, answers, set, isSubmitted,
}: {
  g: Galus;
  qIdx: number;
  lIdx: number;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
}) {
  if (g.type === "bahagi") {
    return <LongDivGrid g={g} qIdx={qIdx} lIdx={lIdx} answers={answers} set={set} isSubmitted={isSubmitted} />;
  }
  return <ColumnFormGrid g={g} qIdx={qIdx} lIdx={lIdx} answers={answers} set={set} isSubmitted={isSubmitted} />;
}

// Cell renderer helpers
function renderStatic(c: Cell): string {
  if (c === null || c === undefined) return "";
  if (typeof c === "string") return c;
  return String(c);
}

function GalusCell({
  cKey, expected, answers, set, isSubmitted, maxLen = 1, className = "",
}: {
  cKey: string;
  expected: string;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
  maxLen?: number;
  className?: string;
}) {
  const val = answers[cKey] ?? "";
  const ok = chk(val, expected);
  const cls = isSubmitted
    ? ok
      ? "border-green-500 bg-green-50 text-green-900"
      : "border-red-500 bg-red-50 text-red-900"
    : "border-border bg-card focus:border-primary";
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={maxLen}
      value={val}
      onChange={(e) => set(cKey, e.target.value)}
      disabled={isSubmitted}
      className={`w-full rounded-lg border-2 py-1 text-center font-display text-base font-extrabold outline-none ${cls} ${className}`}
      placeholder="?"
    />
  );
}

function ColumnFormGrid({
  g, qIdx, lIdx, answers, set, isSubmitted,
}: {
  g: Galus;
  qIdx: number;
  lIdx: number;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
}) {
  const nCols = g.cols.length;
  const opSym = g.type === "tambah" ? "+" : g.type === "tolak" ? "−" : "×";
  const cellLen = g.cellLen ?? 1;

  // Determine carry row (pAns for tambah/tolak, bAns for darab)
  const carryRow = g.type === "darab" ? g.bAns : g.pAns;

  const gridStyle = { gridTemplateColumns: `28px repeat(${nCols}, minmax(0, 1fr))` };

  const kCell = (row: string, col: number) => `${qIdx}:${lIdx}:${g.pfx}:${row}:${col}`;

  return (
    <div className="mx-auto max-w-md space-y-1">
      {/* Header */}
      <div className="grid gap-1" style={gridStyle}>
        <div />
        {g.cols.map((h, i) => (
          <div key={i} className="rounded bg-muted/60 py-1 text-center text-[10px] font-bold uppercase">
            {h}
          </div>
        ))}
      </div>

      {/* Carry / borrow row (inputs where value > 0) */}
      {carryRow && carryRow.some((c) => c !== null && c !== 0 && c !== ".") && (
        <div className="grid gap-1" style={gridStyle}>
          <div className="text-center text-[10px] font-bold text-muted-foreground pt-1">
            {g.type === "tolak" ? "pinjam" : "simpan"}
          </div>
          {carryRow.map((c, i) => {
            if (c === null || c === 0 || c === ".") return <div key={i} />;
            return (
              <div key={i} className="text-xs">
                <GalusCell
                  cKey={kCell("carry", i)}
                  expected={String(c)}
                  answers={answers} set={set} isSubmitted={isSubmitted}
                  maxLen={cellLen}
                  className="!py-0.5 !text-xs bg-amber-50/50"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* R1 */}
      {g.r1 && (
        <div className="grid gap-1" style={gridStyle}>
          <div />
          {g.r1.map((c, i) => (
            <div key={i} className="rounded-lg bg-card py-2 text-center font-display text-lg font-extrabold">
              {renderStatic(c)}
            </div>
          ))}
        </div>
      )}

      {/* R2 with operator sign */}
      {g.r2 && (
        <div className="grid gap-1 border-b-4 border-foreground pb-1" style={gridStyle}>
          <div className="pt-2 text-center font-display text-lg font-extrabold">{opSym}</div>
          {g.r2.map((c, i) => (
            <div key={i} className="rounded-lg bg-card py-2 text-center font-display text-lg font-extrabold">
              {renderStatic(c)}
            </div>
          ))}
        </div>
      )}

      {/* Result row — inputs */}
      {g.rAns && (
        <div className="grid gap-1 pt-1" style={gridStyle}>
          <div />
          {g.rAns.map((c, i) => {
            if (c === null) return <div key={i} />;
            if (c === ".") {
              return (
                <div key={i} className="py-2 text-center font-display text-lg font-extrabold">
                  .
                </div>
              );
            }
            return (
              <GalusCell
                key={i}
                cKey={kCell("res", i)}
                expected={String(c)}
                answers={answers} set={set} isSubmitted={isSubmitted}
                maxLen={cellLen}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function LongDivGrid({
  g, qIdx, lIdx, answers, set, isSubmitted,
}: {
  g: Galus;
  qIdx: number;
  lIdx: number;
  answers: Record<string, string>;
  set: (k: string, v: string) => void;
  isSubmitted: boolean;
}) {
  const dividend = g.dividend ?? [];
  const qAns = g.qAns ?? [];
  const nCols = dividend.length;
  const gridStyle = { gridTemplateColumns: `40px repeat(${nCols}, minmax(0, 1fr))` };
  const kCell = (col: number) => `${qIdx}:${lIdx}:${g.pfx}:q:${col}`;

  return (
    <div className="mx-auto max-w-md space-y-1">
      {/* Quotient row (inputs) */}
      <div className="grid gap-1" style={gridStyle}>
        <div />
        {qAns.map((c, i) => {
          if (c === null) return <div key={i} />;
          return (
            <GalusCell
              key={i}
              cKey={kCell(i)}
              expected={String(c)}
              answers={answers} set={set} isSubmitted={isSubmitted}
            />
          );
        })}
      </div>

      {/* Divisor ) Dividend */}
      <div className="grid gap-1 items-center" style={gridStyle}>
        <div className="flex items-center justify-end gap-1 pr-1">
          <span className="font-display text-lg font-extrabold">{g.divisor}</span>
          <span className="font-display text-2xl font-extrabold leading-none">)</span>
        </div>
        {dividend.map((c, i) => (
          <div
            key={i}
            className="border-t-4 border-foreground rounded-b-lg bg-card py-2 text-center font-display text-lg font-extrabold"
          >
            {renderStatic(c)}
          </div>
        ))}
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Isi hasil bahagi (quotient) di atas.
      </p>
    </div>
  );
}

// ============================================================
// Review Screen
// ============================================================
function ReviewScreen({
  answers, reviewQ, setReviewQ, onReset, darjahId, subjekId,
}: {
  answers: Record<string, string>;
  reviewQ: number;
  setReviewQ: (n: number) => void;
  onReset: () => void;
  darjahId: string;
  subjekId: string;
}) {
  const results = useMemo(
    () =>
      QS.map((q, i) => {
        const finalOk = chk(answers[`${i}:final`], q.fa.ans);
        return { id: q.id, topik: q.topik, ok: finalOk };
      }),
    [answers]
  );
  const skor = results.filter((r) => r.ok).length;
  const peratus = Math.round((skor / QS.length) * 100);
  const emoji = peratus >= 80 ? "🌟" : peratus >= 60 ? "👍" : peratus >= 40 ? "💪" : "📚";
  const band = peratus >= 80 ? "Cemerlang" : peratus >= 60 ? "Baik" : peratus >= 40 ? "Sederhana" : "Perlu Latihan";

  const q = QS[reviewQ];
  const finalKey = `${reviewQ}:final`;
  const finalStudent = answers[finalKey] ?? "";
  const finalOk = chk(finalStudent, q.fa.ans);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <span>⚠️</span>
          PROTOTAIP — Semakan Latihan Berpandu
        </div>

        {/* Skor */}
        <section className="mt-6 rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-card">
          <div className="text-6xl">{emoji}</div>
          <p className="mt-2 font-display text-4xl font-extrabold">
            {skor} / {QS.length}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">{peratus}%</p>
          <p className="mt-1 text-sm font-semibold opacity-90">{band}</p>
        </section>

        {/* Dots navigasi */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setReviewQ(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-extrabold shadow-soft transition ${
                i === reviewQ
                  ? r.ok
                    ? "bg-green-600 text-white scale-110 ring-2 ring-green-800"
                    : "bg-red-600 text-white scale-110 ring-2 ring-red-800"
                  : r.ok
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
              }`}
              title={`${r.id} — ${r.topik}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Per-soalan detail */}
        <section className="mt-6 rounded-3xl border-2 border-border bg-card p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {q.id} · {q.topik}
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">{q.soalan}</p>

          {/* Per-langkah */}
          <div className="mt-4 space-y-3">
            {q.langkah.map((lg, li) => (
              <div key={li} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-bold text-foreground">{lg.n}</p>
                {lg.inputs?.map((inp) => {
                  const baseKey = `${reviewQ}:${li}:${inp.id}`;
                  if ("type" in inp && inp.type === "frac2") {
                    const s = `${answers[`${baseKey}_n`] ?? "?"} / ${answers[`${baseKey}_d`] ?? "?"}`;
                    const ok = chk(answers[`${baseKey}_n`], inp.ans_n) && chk(answers[`${baseKey}_d`], inp.ans_d);
                    return <StepLine key={inp.id} label={inp.lbl} student={s} correct={`${inp.ans_n}/${inp.ans_d}`} ok={ok} />;
                  }
                  if ("type" in inp && inp.type === "pct-frac") {
                    const s = `${answers[`${baseKey}_n`] ?? "?"} / ${answers[`${baseKey}_d`] ?? "?"}`;
                    const ok = chk(answers[`${baseKey}_n`], inp.ans_n) && chk(answers[`${baseKey}_d`], inp.ans_d);
                    return <StepLine key={inp.id} label={inp.lbl} student={s} correct={`${inp.ans_n}/${inp.ans_d}`} ok={ok} />;
                  }
                  const s = answers[baseKey] ?? "";
                  const ok = chk(s, inp.ans);
                  return <StepLine key={inp.id} label={inp.lbl} student={s || "—"} correct={("d" in inp ? inp.d : undefined) ?? inp.ans} ok={ok} />;
                })}
                {lg.galus?.rAns && (
                  <StepLine
                    label="Hasil pengiraan (bentuk lazim)"
                    student={
                      lg.galus.rAns
                        .map((c, i) => {
                          if (c === null) return "";
                          if (c === ".") return ".";
                          return answers[`${reviewQ}:${li}:${lg.galus!.pfx}:res:${i}`] ?? "?";
                        })
                        .join("")
                    }
                    correct={lg.galus.rAns.map((c) => (c === null ? "" : String(c))).join("")}
                    ok={lg.galus.rAns.every((c, i) => {
                      if (c === null || c === ".") return true;
                      return chk(answers[`${reviewQ}:${li}:${lg.galus!.pfx}:res:${i}`], String(c));
                    })}
                  />
                )}
                {lg.galus?.qAns && (
                  <StepLine
                    label="Hasil bahagi (quotient)"
                    student={
                      lg.galus.qAns
                        .map((c, i) => (c === null ? "" : answers[`${reviewQ}:${li}:${lg.galus!.pfx}:q:${i}`] ?? "?"))
                        .join("")
                    }
                    correct={lg.galus.qAns.map((c) => (c === null ? "" : String(c))).join("")}
                    ok={lg.galus.qAns.every((c, i) => {
                      if (c === null) return true;
                      return chk(answers[`${reviewQ}:${li}:${lg.galus!.pfx}:q:${i}`], String(c));
                    })}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Jawapan akhir */}
          <div className={`mt-4 rounded-2xl border-2 p-4 ${finalOk ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Jawapan Akhir
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              {finalOk ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
              {q.fa.lbl}{" "}
              <span className={`font-extrabold ${finalOk ? "text-green-900" : "text-red-900"}`}>
                {finalStudent || "—"} {q.fa.unit}
              </span>
            </p>
            {!finalOk && (
              <p className="mt-1 text-xs font-semibold text-red-800">
                Betul: <span className="font-extrabold">{q.fa.d ?? q.fa.ans} {q.fa.unit}</span>
              </p>
            )}
          </div>

          {/* Auto-hint jika salah */}
          {!finalOk && (
            <div className="mt-3 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{q.hint}</span>
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Mula Semula
          </button>
        </div>
      </main>
    </div>
  );
}

function StepLine({
  label, student, correct, ok,
}: {
  label: string; student: string; correct: string; ok: boolean;
}) {
  return (
    <div className="mt-2 flex items-start gap-2 text-xs">
      {ok ? (
        <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={3} />
      ) : (
        <X className="h-4 w-4 shrink-0 text-red-600" strokeWidth={3} />
      )}
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className={ok ? "text-green-800" : "text-red-800"}>
          Jawapan anda: <span className="font-extrabold">{student}</span>
          {!ok && (
            <>
              {" · "}Betul: <span className="font-extrabold">{correct}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
