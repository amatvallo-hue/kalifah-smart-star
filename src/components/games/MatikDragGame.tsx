import { useEffect, useMemo, useState } from "react";
import { Apple, Sparkles, Trophy } from "lucide-react";
import { simpanProgress } from "@/lib/progress";
import { useAward } from "@/hooks/use-award";

type Soalan = { soalan: string; jawapan: number; pilihan: number[] };

const BANK: Record<string, Soalan[]> = {
  "1": [
    { soalan: "3 + 4", jawapan: 7, pilihan: [5, 6, 7, 8] },
    { soalan: "8 - 3", jawapan: 5, pilihan: [3, 4, 5, 6] },
    { soalan: "2 + 6", jawapan: 8, pilihan: [6, 7, 8, 9] },
    { soalan: "9 - 4", jawapan: 5, pilihan: [4, 5, 6, 7] },
    { soalan: "5 + 3", jawapan: 8, pilihan: [6, 7, 8, 9] },
    { soalan: "7 - 2", jawapan: 5, pilihan: [3, 4, 5, 6] },
    { soalan: "4 + 4", jawapan: 8, pilihan: [6, 7, 8, 9] },
    { soalan: "6 - 3", jawapan: 3, pilihan: [2, 3, 4, 5] },
    { soalan: "1 + 9", jawapan: 10, pilihan: [8, 9, 10, 11] },
    { soalan: "10 - 5", jawapan: 5, pilihan: [3, 4, 5, 6] },
  ],
  "2": [
    { soalan: "23 + 14", jawapan: 37, pilihan: [35, 36, 37, 38] },
    { soalan: "56 - 23", jawapan: 33, pilihan: [31, 32, 33, 34] },
    { soalan: "45 + 32", jawapan: 77, pilihan: [75, 76, 77, 78] },
    { soalan: "78 - 45", jawapan: 33, pilihan: [31, 32, 33, 34] },
    { soalan: "34 + 25", jawapan: 59, pilihan: [57, 58, 59, 60] },
    { soalan: "67 - 34", jawapan: 33, pilihan: [31, 32, 33, 34] },
    { soalan: "42 + 38", jawapan: 80, pilihan: [78, 79, 80, 81] },
    { soalan: "95 - 42", jawapan: 53, pilihan: [51, 52, 53, 54] },
    { soalan: "18 + 27", jawapan: 45, pilihan: [43, 44, 45, 46] },
    { soalan: "84 - 51", jawapan: 33, pilihan: [31, 32, 33, 34] },
  ],
  "3": [
    { soalan: "125 + 234", jawapan: 359, pilihan: [357, 358, 359, 360] },
    { soalan: "456 - 123", jawapan: 333, pilihan: [331, 332, 333, 334] },
    { soalan: "6 × 7", jawapan: 42, pilihan: [40, 41, 42, 43] },
    { soalan: "8 × 9", jawapan: 72, pilihan: [70, 71, 72, 73] },
    { soalan: "48 ÷ 6", jawapan: 8, pilihan: [6, 7, 8, 9] },
    { soalan: "63 ÷ 7", jawapan: 9, pilihan: [7, 8, 9, 10] },
    { soalan: "234 + 145", jawapan: 379, pilihan: [377, 378, 379, 380] },
    { soalan: "567 - 234", jawapan: 333, pilihan: [331, 332, 333, 334] },
    { soalan: "5 × 8", jawapan: 40, pilihan: [38, 39, 40, 41] },
    { soalan: "72 ÷ 8", jawapan: 9, pilihan: [7, 8, 9, 10] },
  ],
};

function Confetti() {
  const bits = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 0.9 + Math.random() * 0.6;
        const colors = ["#f43f5e", "#22c55e", "#3b82f6", "#facc15", "#a855f7"];
        const bg = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute top-0 h-2 w-2 rounded-sm"
            style={{
              left: `${left}%`,
              background: bg,
              animation: `fall ${dur}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`@keyframes fall { to { transform: translateY(420px) rotate(540deg); opacity: 0;} }`}</style>
    </div>
  );
}

export function MatikDragGame({ darjah, subjekId }: { darjah: string; subjekId: string }) {
  const award = useAward();
  const soalan = useMemo(() => BANK[darjah] ?? [], [darjah]);
  const [idx, setIdx] = useState(0);
  const [markah, setMarkah] = useState(0);
  const [feedback, setFeedback] = useState<null | "ok" | "no">(null);
  const [over, setOver] = useState(false);
  const [habis, setHabis] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [mulaMasa] = useState(() => Date.now());

  const q = soalan[idx];
  const progress = soalan.length ? (idx / soalan.length) * 100 : 0;

  useEffect(() => {
    if (habis) {
      simpanProgress({
        darjah,
        subjek: subjekId,
        aktiviti: "game-matik-drag",
        markah,
        jumlahSoalan: soalan.length,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  function jawab(pilihan: number) {
    if (feedback) return;
    const betul = pilihan === q.jawapan;
    if (betul) {
      setMarkah((m) => m + 1);
      setFeedback("ok");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1000);
      award({ sumber: "game-matik-drag", darjah, subjek: subjekId });
    } else {
      setFeedback("no");
    }
    setTimeout(() => {
      setFeedback(null);
      setOver(false);
      setDragging(null);
      if (idx + 1 >= soalan.length) setHabis(true);
      else setIdx((i) => i + 1);
    }, 900);
  }

  function reset() {
    setIdx(0);
    setMarkah(0);
    setHabis(false);
    setFeedback(null);
  }

  if (!soalan.length) {
    return <p className="mt-6 text-center text-muted-foreground">Set ini hanya untuk Darjah 1, 2 dan 3.</p>;
  }

  if (habis) {
    return (
      <div className="mt-6 rounded-3xl bg-gradient-to-br from-sky-200 to-sky-400 p-8 text-center text-sky-950 shadow-card">
        <Sparkles className="mx-auto h-12 w-12" />
        <h2 className="mt-3 font-display text-3xl font-extrabold">Hebat! 🎉</h2>
        <p className="mt-2">
          Markah kamu: <span className="font-extrabold">{markah}</span> / {soalan.length}
        </p>
        <button onClick={reset} className="mt-4 rounded-full bg-white px-5 py-2 font-display font-extrabold text-sky-700 shadow-soft">
          Main Lagi
        </button>
      </div>
    );
  }

  const showApples = darjah === "1";

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 via-sky-100 to-sky-300 p-5 shadow-card sm:p-8">
      {confetti && <Confetti />}
      {feedback && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-6xl font-extrabold ${
            feedback === "ok" ? "bg-emerald-400/40 text-emerald-700" : "bg-pink-400/40 text-pink-700"
          }`}
        >
          {feedback === "ok" ? "✓ Betul!" : "✗ Cuba lagi"}
        </div>
      )}

      <div className="flex items-center justify-between text-sm font-bold text-sky-900">
        <span className="rounded-full bg-white/70 px-3 py-1">Soalan {idx + 1} / {soalan.length}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-amber-900">
          <Trophy className="h-4 w-4" /> {markah}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <h2 className="mt-6 text-center font-display text-5xl font-extrabold text-sky-900 drop-shadow-sm">
        {q.soalan} = ?
      </h2>

      {showApples && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
          {Array.from({ length: Math.min(q.jawapan, 15) }).map((_, i) => (
            <Apple key={i} className="h-7 w-7 fill-red-500 text-red-700" />
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (dragging !== null) jawab(dragging);
        }}
        className={`mx-auto mt-6 flex h-28 w-full max-w-xs items-center justify-center rounded-3xl border-4 border-dashed text-2xl font-extrabold transition ${
          over ? "border-emerald-600 bg-emerald-100 text-emerald-700 scale-105" : "border-sky-500 bg-white/70 text-sky-700"
        }`}
      >
        Letak jawapan di sini
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {q.pilihan.map((p) => (
          <button
            key={p}
            draggable
            onDragStart={() => setDragging(p)}
            onDragEnd={() => setDragging(null)}
            onTouchStart={() => setDragging(p)}
            onTouchEnd={() => {
              if (dragging !== null) jawab(dragging);
            }}
            onClick={() => jawab(p)}
            className={`cursor-grab select-none rounded-2xl bg-white px-4 py-5 text-center font-display text-3xl font-extrabold text-sky-900 shadow-soft transition active:cursor-grabbing active:scale-95 ${
              dragging === p ? "opacity-50 scale-95" : "hover:-translate-y-1"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-sky-800/80">
        Tip: Seret tile jawapan ke kotak, atau ketik sahaja pada peranti mudah alih.
      </p>
    </div>
  );
}
