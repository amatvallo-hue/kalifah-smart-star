import { useEffect, useMemo, useState } from "react";
import { Check, X, RefreshCw, Sparkles } from "lucide-react";
import { StarReward } from "@/components/StarReward";
import { getBetulSalah, type BSItem } from "@/lib/games-bank";
import { simpanProgress } from "@/lib/progress";

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function BetulSalahGame({ subjekId, darjah }: { subjekId: string; darjah?: string }) {
  const [seed, setSeed] = useState(0);
  const items = useMemo<BSItem[]>(() => shuffle(getBetulSalah(subjekId)).slice(0, 10), [subjekId, seed]);
  const [idx, setIdx] = useState(0);
  const [markah, setMarkah] = useState(0);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [nota, setNota] = useState<string | null>(null);
  const [habis, setHabis] = useState(false);

  useEffect(() => {
    if (habis && darjah) {
      simpanProgress({
        darjah,
        subjek: subjekId,
        aktiviti: "game-betul",
        markah,
        jumlahSoalan: items.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  function jawab(pilih: boolean) {
    if (flash) return;
    const it = items[idx];
    const benar = pilih === it.betul;
    if (benar) setMarkah((m) => m + 1);
    setFlash(benar ? "ok" : "no");
    setNota(benar ? null : it.nota ?? null);
    setTimeout(() => {
      setFlash(null);
      setNota(null);
      const next = idx + 1;
      if (next >= items.length) setHabis(true);
      else setIdx(next);
    }, 1100);
  }

  function reset() {
    setSeed((s) => s + 1);
    setIdx(0);
    setMarkah(0);
    setFlash(null);
    setNota(null);
    setHabis(false);
  }

  const bintang = markah >= items.length * 0.9 ? 3 : markah >= items.length * 0.6 ? 2 : markah > 0 ? 1 : 0;

  if (habis) {
    return (
      <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
        <Sparkles className="mx-auto h-12 w-12" style={{ color: EMAS }} />
        <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Tahniah! 🎉</h2>
        <p className="mt-2 text-muted-foreground">
          Markah: <span className="font-extrabold" style={{ color: HIJAU }}>{markah}</span> / {items.length}
        </p>
        <div className="mt-4 flex justify-center"><StarReward earned={bintang} /></div>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
          style={{ backgroundColor: HIJAU }}
        >
          <RefreshCw className="h-4 w-4" /> Main Lagi
        </button>
      </div>
    );
  }

  const it = items[idx];

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: HIJAU }}>
          Pernyataan {idx + 1} / {items.length}
        </span>
        <span className="rounded-full px-3 py-1" style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}>
          Markah: {markah}
        </span>
      </div>

      <div
        className={`rounded-3xl bg-card p-6 shadow-card md:p-8 transition ${
          flash === "ok" ? "ring-4 ring-emerald-400/60" : flash === "no" ? "ring-4 ring-rose-400/60" : ""
        }`}
      >
        <p className="text-center font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl">
          {it.teks}
        </p>
        {nota && (
          <p className="mt-3 text-center text-sm font-bold text-rose-600">{nota}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => jawab(true)}
            disabled={!!flash}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-5 font-display text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundColor: HIJAU }}
          >
            <Check className="h-6 w-6" /> Betul
          </button>
          <button
            onClick={() => jawab(false)}
            disabled={!!flash}
            className="flex items-center justify-center gap-2 rounded-2xl px-6 py-5 font-display text-xl font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundColor: "#dc2626" }}
          >
            <X className="h-6 w-6" /> Salah
          </button>
        </div>
      </div>
    </div>
  );
}
