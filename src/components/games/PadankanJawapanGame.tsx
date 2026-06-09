import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { StarReward } from "@/components/StarReward";
import { getPadankan, type PJPair } from "@/lib/games-bank";
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

export function PadankanJawapanGame({ subjekId, darjah }: { subjekId: string; darjah?: string }) {
  const [useSet2, setUseSet2] = useState(() => Math.random() > 0.5);
  const pairs = useMemo<PJPair[]>(() => getPadankan(subjekId, useSet2).slice(0, 8), [subjekId, useSet2]);
  const kanan = useMemo(() => shuffle(pairs.map((p, i) => ({ ...p, id: i }))), [pairs]);

  const [pilihKiri, setPilihKiri] = useState<number | null>(null);
  const [pilihKanan, setPilihKanan] = useState<number | null>(null);
  const [betulSet, setBetulSet] = useState<Set<number>>(new Set());
  const [salahSet, setSalahSet] = useState<Set<number>>(new Set());
  const [cubaan, setCubaan] = useState(0);
  const [mulaMasa] = useState(() => Date.now());

  function pickKiri(i: number) {
    if (betulSet.has(i)) return;
    setPilihKiri(i);
    setSalahSet(new Set());
    if (pilihKanan !== null) tryMatch(i, pilihKanan);
  }
  function pickKanan(id: number) {
    if (betulSet.has(id)) return;
    setPilihKanan(id);
    setSalahSet(new Set());
    if (pilihKiri !== null) tryMatch(pilihKiri, id);
  }
  function tryMatch(kIdx: number, knId: number) {
    setCubaan((c) => c + 1);
    if (kIdx === knId) {
      const next = new Set(betulSet);
      next.add(kIdx);
      setBetulSet(next);
    } else {
      setSalahSet(new Set([kIdx, knId]));
    }
    setTimeout(() => {
      setPilihKiri(null);
      setPilihKanan(null);
      setSalahSet(new Set());
    }, 700);
  }

  function reset() {
    setUseSet2(Math.random() > 0.5);
    setPilihKiri(null);
    setPilihKanan(null);
    setBetulSet(new Set());
    setSalahSet(new Set());
    setCubaan(0);
  }

  const habis = betulSet.size === pairs.length && pairs.length > 0;
  const markah = betulSet.size;
  const bintang = cubaan <= pairs.length + 1 ? 3 : cubaan <= pairs.length + 4 ? 2 : 1;

  useEffect(() => {
    if (habis && darjah) {
      simpanProgress({
        darjah,
        subjek: subjekId,
        aktiviti: "game-padan",
        markah,
        jumlahSoalan: pairs.length,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: HIJAU }}>
          Padanan: {markah} / {pairs.length}
        </span>
        <span className="rounded-full px-3 py-1" style={{ backgroundColor: `${EMAS}33`, color: "#7a5300" }}>
          Cubaan: {cubaan}
        </span>
      </div>

      {habis ? (
        <div className="rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
          <Sparkles className="mx-auto h-12 w-12" style={{ color: EMAS }} />
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Hebat! 🎉</h2>
          <p className="mt-2 text-muted-foreground">Semua pasangan dijumpai dalam {cubaan} cubaan.</p>
          <div className="mt-4 flex justify-center"><StarReward earned={bintang} /></div>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            <RefreshCw className="h-4 w-4" /> Main Lagi
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-card p-5 shadow-card md:p-6">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Klik perkataan di kiri, kemudian klik maksudnya di kanan.
          </p>
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            <div className="space-y-3">
              {pairs.map((p, i) => {
                const done = betulSet.has(i);
                const pilih = pilihKiri === i;
                const salah = salahSet.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => pickKiri(i)}
                    disabled={done}
                    className="w-full rounded-2xl border-2 px-4 py-3 text-center font-display font-extrabold transition disabled:cursor-default"
                    style={{
                      borderColor: done ? HIJAU : salah ? "#dc2626" : pilih ? EMAS : "hsl(var(--border))",
                      backgroundColor: done ? `${HIJAU}20` : pilih ? `${EMAS}20` : "hsl(var(--background))",
                      color: done ? HIJAU : "hsl(var(--foreground))",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {p.kiri}
                  </button>
                );
              })}
            </div>
            <div className="space-y-3">
              {kanan.map((p) => {
                const done = betulSet.has(p.id);
                const pilih = pilihKanan === p.id;
                const salah = salahSet.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => pickKanan(p.id)}
                    disabled={done}
                    className="w-full rounded-2xl border-2 px-4 py-3 text-center font-bold transition disabled:cursor-default"
                    style={{
                      borderColor: done ? HIJAU : salah ? "#dc2626" : pilih ? EMAS : "hsl(var(--border))",
                      backgroundColor: done ? `${HIJAU}20` : pilih ? `${EMAS}20` : "hsl(var(--background))",
                      color: done ? HIJAU : "hsl(var(--foreground))",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {p.kanan}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
