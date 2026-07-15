import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { renderSoalanSvg } from "@/lib/render-soalan-svg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { useProfile } from "@/hooks/use-profile";
import { getDarjah, getSubjek, TONE_GRADIENT } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId")({
  head: () => ({
    meta: [{ title: "Percubaan MPT4 — Jawab Soalan — Kalifah.my" }],
  }),
  ssr: false,
  component: PercubaanMpt4JawabPage,
});

interface Mpt4Set {
  id: string;
  subjek: string;
  nombor_set: number;
  tajuk: string | null;
  jumlah_markah: number | null;
  tempoh_minit: number | null;
}

type JenisItem = "OAP" | "OPB" | "SRTd" | "SRTb";
type KaedahPenskoran = "dikotomus" | "analitikal" | "holistik";

interface Mpt4Soalan {
  id: string;
  set_id: string;
  bahagian: string;
  no_soalan: number;
  sub_bahagian: string | null;
  teks_soalan: string;
  konteks: string | null;
  stimulus_keterangan: string | null;
  stimulus_svg: { svg_type: string; params: any; bahasa?: "bm" | "en" } | null;
  jenis_item: JenisItem;
  kaedah_penskoran: KaedahPenskoran;
  pilihan_a: string | null;
  pilihan_b: string | null;
  pilihan_c: string | null;
  pilihan_d: string | null;
  markah: number;
}

interface Mpt4Keputusan {
  id: string;
  jawapan: Record<string, string> | null;
  started_at: string | null;
  status: string | null;
}

type Jawapan = Record<string, string>;

function formatTempoh(minit: number | null): string {
  if (!minit || minit <= 0) return "—";
  const jam = Math.floor(minit / 60);
  const baki = minit % 60;
  if (jam === 0) return `${baki} minit`;
  if (baki === 0) return `${jam} jam`;
  return `${jam} jam ${baki} minit`;
}

function formatMs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function splitBilingual(teks: string): { bm: string; en: string | null } {
  const parts = teks.split("\n").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { bm: teks, en: null };
  return { bm: parts[0], en: parts.slice(1).join(" ") };
}

function countWords(str: string): number {
  const t = str.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function PercubaanMpt4JawabPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId, setId } = useParams({
    from: "/darjah/$darjahId_/percubaan-mpt4_/$subjekId_/$setId",
  });
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);
  const mata = usePoints();
  const studentName = user?.user_metadata?.name as string | undefined;

  const [setInfo, setSetInfo] = useState<Mpt4Set | null>(null);
  const [soalanList, setSoalanList] = useState<Mpt4Soalan[] | null>(null);
  const [keputusan, setKeputusan] = useState<Mpt4Keputusan | null>(null);
  const [jawapan, setJawapan] = useState<Jawapan>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Fetch set + soalan
  useEffect(() => {
    if (!setId) return;
    let cancelled = false;
    (async () => {
      const [setRes, soalanRes] = await Promise.all([
        supabase
          .from("mpt4_set")
          .select("id, subjek, nombor_set, tajuk, jumlah_markah, tempoh_minit")
          .eq("id", setId)
          .maybeSingle(),
        supabase
          .from("mpt4_soalan")
          .select(
            "id, set_id, bahagian, no_soalan, sub_bahagian, teks_soalan, konteks, stimulus_keterangan, stimulus_svg, jenis_item, kaedah_penskoran, pilihan_a, pilihan_b, pilihan_c, pilihan_d, markah",
          )
          .eq("set_id", setId)
          .order("bahagian", { ascending: true })
          .order("no_soalan", { ascending: true }),
      ]);
      if (cancelled) return;
      if (setRes.error) {
        setFetchError(setRes.error.message);
        return;
      }
      if (soalanRes.error) {
        setFetchError(soalanRes.error.message);
        return;
      }
      setSetInfo(setRes.data as Mpt4Set | null);
      setSoalanList((soalanRes.data ?? []) as Mpt4Soalan[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  // Get-or-create keputusan
  useEffect(() => {
    if (!user || !setId) return;
    let cancelled = false;
    (async () => {
      // 1. Resume in_progress attempt first (so a fresh "Cuba Lagi" row wins over the old completed one)
      const { data: existing, error: qErr } = await supabase
        .from("mpt4_keputusan")
        .select("id, jawapan, started_at, status")
        .eq("user_id", user.id)
        .eq("set_id", setId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (qErr) {
        setFetchError(qErr.message);
        return;
      }
      if (existing) {
        setKeputusan(existing as Mpt4Keputusan);
        setJawapan(((existing as Mpt4Keputusan).jawapan ?? {}) as Jawapan);
        return;
      }

      // 2. Otherwise, if there is a submitted/completed attempt → redirect to keputusan
      const { data: doneRow, error: doneErr } = await supabase
        .from("mpt4_keputusan")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("set_id", setId)
        .in("status", ["submitted", "completed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (doneErr) {
        setFetchError(doneErr.message);
        return;
      }
      if (doneRow) {
        navigate({
          to: "/darjah/$darjahId/percubaan-mpt4/$subjekId/$setId/keputusan",
          params: { darjahId, subjekId, setId },
          replace: true,
        });
        return;
      }

      // 3. Otherwise create fresh
      const { data: inserted, error: iErr } = await supabase
        .from("mpt4_keputusan")
        .insert({ user_id: user.id, set_id: setId, jawapan: {}, status: "in_progress" })
        .select("id, jawapan, started_at, status")
        .single();
      if (cancelled) return;
      if (iErr) {
        setFetchError(iErr.message);
        return;
      }
      setKeputusan(inserted as Mpt4Keputusan);
      setJawapan({});
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setId, darjahId, subjekId, navigate]);

  // Elapsed timer
  useEffect(() => {
    if (!keputusan?.started_at) return;
    const start = new Date(keputusan.started_at).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [keputusan?.started_at]);

  // Debounced autosave
  const saveTimer = useRef<number | null>(null);
  const lastSaved = useRef<string>("{}");
  const scheduleSave = useCallback(
    (next: Jawapan) => {
      if (!keputusan) return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        const payload = JSON.stringify(next);
        if (payload === lastSaved.current) return;
        setSaveState("saving");
        const { error } = await supabase
          .from("mpt4_keputusan")
          .update({ jawapan: next })
          .eq("id", keputusan.id);
        if (error) {
          setSaveState("idle");
          return;
        }
        lastSaved.current = payload;
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1500);
      }, 1500);
    },
    [keputusan],
  );

  const updateJawapan = useCallback(
    (soalanId: string, value: string) => {
      setJawapan((prev) => {
        const next = { ...prev, [soalanId]: value };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const bahagianGroups = useMemo(() => {
    if (!soalanList) return [];
    const map = new Map<string, Mpt4Soalan[]>();
    for (const s of soalanList) {
      const arr = map.get(s.bahagian) ?? [];
      arr.push(s);
      map.set(s.bahagian, arr);
    }
    return Array.from(map.entries()).map(([bahagian, items]) => ({ bahagian, items }));
  }, [soalanList]);

  const jumlahDijawab = useMemo(
    () => (soalanList ?? []).filter((s) => (jawapan[s.id] ?? "").trim().length > 0).length,
    [soalanList, jawapan],
  );
  const jumlahSoalan = soalanList?.length ?? 0;

  async function handleHantar() {
    if (!keputusan) return;
    setSubmitting(true);
    // Flush any pending save synchronously
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await supabase
      .from("mpt4_keputusan")
      .update({ jawapan, status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", keputusan.id);
    setSubmitting(false);
    navigate({
      to: "/darjah/$darjahId/percubaan-mpt4/$subjekId/$setId/keputusan",
      params: { darjahId, subjekId, setId },
    });
  }

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const darjahAkses = profile?.darjah_akses ?? [];
  const hasAccess = darjah ? darjahAkses.includes(Number(darjah.id)) : false;

  if (!darjah || !subjek || !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Tidak dijumpai</h1>
          <Link
            to="/darjah/$darjahId/percubaan-mpt4"
            params={{ darjahId }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <SiteHeader stars={mata} userName={studentName} onLogout={handleLogout} />

      {/* Sticky info bar */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${TONE_GRADIENT[subjek.tone]} shadow-soft`}>
            <span className="text-lg">{subjek.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-extrabold text-foreground">
              {setInfo?.tajuk || (setInfo ? `Set ${setInfo.nombor_set}` : "Memuatkan...")}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-bold text-muted-foreground">
              <span>{subjek.title}</span>
              {setInfo?.jumlah_markah != null && <span>Jumlah: {setInfo.jumlah_markah} markah</span>}
              {setInfo?.tempoh_minit != null && <span>Tempoh disyorkan: {formatTempoh(setInfo.tempoh_minit)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-secondary/70 px-3 py-1.5 font-mono text-sm font-extrabold text-foreground tabular-nums">
              ⏱ {formatMs(elapsed)}
            </div>
            <div className="hidden text-xs text-muted-foreground sm:block">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1 text-primary"><Check className="h-3 w-3" /> Disimpan</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Link
          to="/darjah/$darjahId/percubaan-mpt4/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Senarai Set
        </Link>

        {fetchError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Ralat: {fetchError}
          </div>
        )}

        {soalanList === null && !fetchError && (
          <p className="mt-8 text-muted-foreground">Memuatkan soalan...</p>
        )}

        {soalanList !== null && soalanList.length === 0 && !fetchError && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center text-muted-foreground">
            Tiada soalan untuk set ini.
          </div>
        )}

        {bahagianGroups.map(({ bahagian, items }) => (
          <section key={bahagian} className="mt-8">
            <h2 className="font-display text-2xl font-extrabold text-primary">
              Bahagian {bahagian}
            </h2>
            <div className="mt-4 flex flex-col gap-5">
              {items.map((s) => (
                <SoalanCard
                  key={s.id}
                  soalan={s}
                  value={jawapan[s.id] ?? ""}
                  onChange={(v) => updateJawapan(s.id, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Sticky submit bar */}
      {soalanList && soalanList.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 shadow-card backdrop-blur">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm font-bold text-muted-foreground">
              {jumlahDijawab} / {jumlahSoalan} soalan dijawab
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft transition hover:translate-y-[-1px] disabled:opacity-60"
            >
              Hantar Jawapan →
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-extrabold text-foreground">Hantar sekarang?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {jumlahDijawab} daripada {jumlahSoalan} soalan telah dijawab. Selepas hantar, jawapan tidak boleh diubah.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-border/60 bg-secondary px-4 py-2.5 font-display text-sm font-extrabold text-foreground disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHantar}
                disabled={submitting}
                className="flex-1 rounded-full bg-gradient-primary px-4 py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {submitting ? "Menghantar..." : "Ya, Hantar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SoalanCard({
  soalan,
  value,
  onChange,
}: {
  soalan: Mpt4Soalan;
  value: string;
  onChange: (v: string) => void;
}) {
  const { bm, en } = splitBilingual(soalan.teks_soalan);
  const isMcq = soalan.kaedah_penskoran === "dikotomus" && soalan.pilihan_a != null;
  const isWordFill = soalan.kaedah_penskoran === "dikotomus" && soalan.pilihan_a == null;
  const isAnalitikal = soalan.kaedah_penskoran === "analitikal";
  const isHolistik = soalan.kaedah_penskoran === "holistik";

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-5 shadow-card md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2.5 font-display text-sm font-extrabold text-primary-foreground">
            {soalan.no_soalan}
          </span>
          {soalan.sub_bahagian && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {soalan.sub_bahagian}
            </span>
          )}
        </div>
        <span className="rounded-full bg-gold/20 px-3 py-1 font-display text-[11px] font-extrabold text-gold-foreground">
          {soalan.markah} markah
        </span>
      </div>

      {soalan.konteks && (
        <div className="mt-4 rounded-2xl bg-secondary/70 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {soalan.konteks}
        </div>
      )}

      {soalan.stimulus_svg ? (
        <div className="mt-4 flex justify-center rounded-2xl border border-border/60 bg-card p-4">
          {renderSoalanSvg(soalan.stimulus_svg.svg_type, soalan.stimulus_svg.params, soalan.stimulus_svg.bahasa)}
        </div>
      ) : soalan.stimulus_keterangan ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-border/70 bg-muted/30 p-4">
          <div className="mb-1 text-[11px] font-bold text-muted-foreground">
            📊 Rajah/Jadual (belum siap dilukis)
          </div>
          <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
            {soalan.stimulus_keterangan}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{bm}</p>
        {en && <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground whitespace-pre-wrap">{en}</p>}
      </div>

      <div className="mt-4">
        {isMcq && (
          <div className="grid gap-2 sm:grid-cols-2">
            {(["a", "b", "c", "d"] as const).map((k) => {
              const opt = soalan[`pilihan_${k}` as const];
              if (opt == null) return null;
              const huruf = k.toUpperCase();
              const selected = value === huruf;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange(huruf)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left text-sm transition ${
                    selected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/60 bg-card hover:border-primary/40"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${
                    selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    {huruf}
                  </span>
                  <span className="pt-1 whitespace-pre-wrap">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {isWordFill && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, 5))}
            maxLength={5}
            placeholder="Jawapan"
            className="w-32 rounded-xl border-2 border-border/60 bg-card px-4 py-2.5 text-center font-display text-lg font-extrabold uppercase tracking-widest text-foreground focus:border-primary focus:outline-none"
          />
        )}

        {isAnalitikal && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder="Tulis jawapan anda..."
            className="w-full rounded-2xl border-2 border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none"
          />
        )}

        {isHolistik && (
          <div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={10}
              placeholder="Tulis karangan / jawapan panjang anda di sini..."
              className="w-full rounded-2xl border-2 border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none"
            />
            <div className="mt-1 text-right text-[11px] font-bold text-muted-foreground">
              {countWords(value)} patah kata
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
