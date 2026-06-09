import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { StarReward } from "@/components/StarReward";
import { getSusunAyat, type SAItem } from "@/lib/games-bank";
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

interface Word { id: number; teks: string }

export function SusunAyatGame({ subjekId, darjah }: { subjekId: string; darjah?: string }) {
  const [seed, setSeed] = useState(0);
  const ayatList = useMemo<SAItem[]>(() => getSusunAyat(subjekId).slice(0, 5), [subjekId, seed]);
  const [idx, setIdx] = useState(0);
  const [bank, setBank] = useState<Word[]>([]);
  const [pilih, setPilih] = useState<Word[]>([]);
  const [markah, setMarkah] = useState(0);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [habis, setHabis] = useState(false);
  const [mulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!ayatList[idx]) return;
    setBank(shuffle(ayatList[idx].perkataan.map((teks, id) => ({ id, teks }))));
    setPilih([]);
    setFlash(null);
  }, [idx, ayatList, seed]);

  useEffect(() => {
    if (habis && darjah && ayatList.length > 0) {
      simpanProgress({
        darjah,
        subjek: subjekId,
        aktiviti: "game-susun",
        markah,
        jumlahSoalan: ayatList.length,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  function pickBank(w: Word) {
    if (flash) return;
    setBank((b) => b.filter((x) => x.id !== w.id));
    setPilih((p) => [...p, w]);
  }
  function unpick(w: Word) {
    if (flash) return;
    setPilih((p) => p.filter((x) => x.id !== w.id));
    setBank((b) => [...b, w]);
  }

  function semak() {
    if (pilih.length !== ayatList[idx].perkataan.length) return;
    const ayat = pilih.map((w) => w.teks).join(" ");
    const target = ayatList[idx].ayat;
    const benar = ayat.toLowerCase() === target.toLowerCase();
    if (benar) setMarkah((m) => m + 1);
    setFlash(benar ? "ok" : "no");
    setTimeout(() => {
      setFlash(null);
      const next = idx + 1;
      if (next >= ayatList.length) setHabis(true);
      else setIdx(next);
    }, 1200);
  }

  function reset() {
    setSeed((s) => s + 1);
    setIdx(0);
    setMarkah(0);
    setHabis(false);
  }

  const bintang = markah >= ayatList.length * 0.9 ? 3 : markah >= ayatList.length * 0.6 ? 2 : markah > 0 ? 1 : 0;

  if (habis) {
    return (
      <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
        <Sparkles className="mx-auto h-12 w-12" style={{ color: EMAS }} />
        <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Syabas! 🎉</h2>
        <p className="mt-2 text-muted-foreground">
          Markah: <span className="font-extrabold" style={{ color: HIJAU }}>{markah}</span> / {ayatList.length}
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

  const lengkap = pilih.length === (ayatList[idx]?.perkataan.length ?? 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: HIJAU }}>
          Ayat {idx + 1} / {ayatList.length}
        </span>
        <span className="rounded-full px-3 py-1" style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}>
          Markah: {markah}
        </span>
      </div>

      <div
        className={`rounded-3xl bg-card p-5 shadow-card md:p-6 transition ${
          flash === "ok" ? "ring-4 ring-emerald-400/60" : flash === "no" ? "ring-4 ring-rose-400/60" : ""
        }`}
      >
        <p className="mb-2 text-center text-sm text-muted-foreground">
          Klik perkataan mengikut susunan yang betul.
        </p>

        <div
          className="min-h-[72px] rounded-2xl border-2 border-dashed p-3"
          style={{ borderColor: EMAS, backgroundColor: `${EMAS}10` }}
        >
          {pilih.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Susunan ayat akan muncul di sini…</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {pilih.map((w) => (
                <button
                  key={w.id}
                  onClick={() => unpick(w)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-display font-extrabold text-white shadow-soft"
                  style={{ backgroundColor: HIJAU }}
                >
                  {w.teks}
                  <Undo2 className="h-3 w-3 opacity-70" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {bank.map((w) => (
            <button
              key={w.id}
              onClick={() => pickBank(w)}
              className="rounded-xl border-2 px-3 py-2 font-display font-extrabold transition hover:-translate-y-0.5"
              style={{ borderColor: EMAS, backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
            >
              {w.teks}
            </button>
          ))}
        </div>

        <button
          onClick={semak}
          disabled={!lengkap || !!flash}
          className="mt-5 w-full rounded-2xl px-6 py-4 font-display text-lg font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: HIJAU }}
        >
          Semak Ayat
        </button>
      </div>
    </div>
  );
}
