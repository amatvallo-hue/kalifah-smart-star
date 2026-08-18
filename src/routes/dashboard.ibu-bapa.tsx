import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Flame,
  Heart,
  Pencil,
  PlusCircle,
  Target,
  Trash2,
  TrendingUp,
  Users,
  KeyRound,
  Trophy,
  User,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { SUBJEK_LIST as ALL_SUBJEK, DARJAH_LIST } from "@/lib/curriculum";
// Ibu bapa tidak boleh nampak Jawi
const SUBJEK_LIST = ALL_SUBJEK.filter((s) => s.id !== "jawi");
import { padamAnak, senaraikanAnak, type ChildProfile } from "@/lib/parent";
import {
  ciptaAkaunAnak,
  CHILD_EMAIL_DOMAIN,
  PARENT_SESSION_BACKUP_KEY,
  markSkipChildGuard,
  shouldSkipChildGuard,
  clearSkipChildGuard,
  laluanCheckout,
} from "@/lib/child-auth";
import { senaraikanSijilAnak, type SijilRow } from "@/lib/sijil-rekod";
import { downloadSijil } from "@/lib/sijil";

export const Route = createFileRoute("/dashboard/ibu-bapa")({
  head: () => ({ meta: [{ title: "Dashboard Ibu Bapa — Kalifah.my" }] }),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    tambahAnak: search.tambahAnak === "1" || search.tambahAnak === 1 ? "1" : undefined,
  }),
  component: ParentDashboard,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
// Sistem warna kad statistik (semantik, gaya pale/soft konsisten)
const STAT_HIJAU = "#16A34A";
const STAT_BIRU = "#3B82F6";
const STAT_OREN = "#FB923C";
const STAT_EMAS = "#F5B82E";
const AKTIF_ANAK_KEY = "kalifah_ibubapa_aktif_anak";

interface ProgressRow {
  id: string;
  darjah: string;
  subjek: string;
  aktiviti: string;
  markah: number;
  jumlah_soalan: number;
  peratus: number;
  masa_ambil: number;
  created_at: string;
  topik?: string | null;
}
interface StatsRow {
  tarikh: string;
  soalan_dijawab: number;
  masa_belajar: number;
  bab_selesai: number;
}
interface BadgeRow {
  id: string;
  kod: string;
  nama: string;
  ikon: string;
  created_at: string;
}

interface Mpt4KeputusanRow {
  id: string;
  markah_keseluruhan: number | null;
  markah_penuh: number | null;
  completed_at: string | null;
  mpt4_set: {
    subjek: string;
    nombor_set: number;
    tajuk: string | null;
    jumlah_markah: number | null;
  } | null;
}

interface EmotionRow {
  id: string;
  emotion: string;
  intensity: number;
  situation: string;
  created_at: string;
}

interface AksesStatusRow {
  darjah: number;
  status: "lifetime" | "active" | "expiring_soon" | "expired_shadow" | "missing";
  expires_at: string | null;
  hari_baki: number | null;
}

const EMOTION_EMOJI: Record<string, string> = {
  gembira: "😊", sedih: "😢", marah: "😡", takut: "😨", tenang: "😌",
};

const EMOTION_LABEL: Record<string, string> = {
  gembira: "Gembira", sedih: "Sedih", marah: "Marah", takut: "Takut", tenang: "Tenang",
};

const EMOTION_COLOR: Record<string, string> = {
  gembira: "#1A7A4A", sedih: "#185FA5", marah: "#A32D2D", takut: "#7A5000", tenang: "#0F6E56",
};

const EMOTION_BG: Record<string, string> = {
  gembira: "#E8F5EE", sedih: "#E8F0FB", marah: "#FDECEA", takut: "#FEF6E4", tenang: "#E1F5EE",
};

const SITUATION_LABEL: Record<string, string> = {
  kawan: "👫 Kawan", study: "📚 Study", guru: "👩‍🏫 Guru",
  rumah: "🏠 Rumah", parents: "👨‍👩‍👧 Parents", aktiviti: "🎮 Aktiviti", lain: "💭 Lain-lain",
};


function todayKL(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}
function daysAgoKL(n: number): string {
  const t = new Date(todayKL() + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - n);
  return t.toISOString().slice(0, 10);
}
function toKLDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}
function kiraStreak(rows: StatsRow[]): number {
  const set = new Set(rows.map((r) => r.tarikh));
  let mula = set.has(todayKL()) ? 0 : set.has(daysAgoKL(1)) ? 1 : -1;
  if (mula < 0) return 0;
  let s = 0;
  while (set.has(daysAgoKL(mula))) {
    s++;
    mula++;
  }
  return s;
}
function formatMasa(minit: number): string {
  if (minit < 60) return `${minit} min`;
  const jam = Math.floor(minit / 60);
  const sisa = minit % 60;
  return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} min`;
}

function parseIsoUTC(iso: string): Date {
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso.replace(" ", "T") + "Z");
}
function formatTarikh(iso: string): string {
  const d = parseIsoUTC(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const min = Math.round(diff / 60000);
  if (min < 1) return "Sebentar tadi";
  if (min < 60) return `${min} minit lalu`;
  const jam = Math.round(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  return `${hari} hari lalu`;
}

const AKTIVITI_LABEL: Record<string, string> = {
  kuiz: "Kuiz",
  latihan: "Latihan Bertulis",
  "latih-tubi": "Latih Tubi",
  nota: "Nota Ringkas",
  "bergambar-rajah": "Soalan Bergambar Rajah",
  "isi-kosong": "Isi Tempat Kosong",
  "game-race": "Quiz Race",
  "game-cari": "Cari Perkataan",
  "game-betul": "Betul atau Salah",
  "game-padan": "Padankan",
  "game-susun": "Susun Ayat",
  "game-neon": "Game Neon",
  "game-drag": "Game Drag & Drop",
};

const HARI_PENDEK = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

function KalifahHatiSeksyen({ emotions }: { emotions: EmotionRow[] }) {

  const HIJAU_HATI = "#1A7A4A";

  const trend7 = useMemo(() => {

    return Array.from({ length: 7 }, (_, i) => {

      const tarikh = daysAgoKL(6 - i);

      const rows = emotions.filter((e) => toKLDate(e.created_at) === tarikh);

      const last = rows[rows.length - 1] ?? null;

      const d = new Date(tarikh + "T00:00:00Z");

      return { tarikh, label: HARI_PENDEK[d.getUTCDay()], row: last, isToday: i === 6 };

    });

  }, [emotions]);

  const mingguRows = emotions.filter((e) => {

    const t = toKLDate(e.created_at);

    return t >= daysAgoKL(6);

  });

  const emotionCount = mingguRows.reduce<Record<string, number>>((acc, e) => {

    acc[e.emotion] = (acc[e.emotion] ?? 0) + 1;

    return acc;

  }, {});

  const topEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const situationCount = mingguRows.reduce<Record<string, number>>((acc, e) => {

    acc[e.situation] = (acc[e.situation] ?? 0) + 1;

    return acc;

  }, {});

  const topSituation = Object.entries(situationCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const avgIntensity = mingguRows.length > 0

    ? (mingguRows.reduce((a, e) => a + e.intensity, 0) / mingguRows.length).toFixed(1)

    : null;

  const negativeEmotions = ["sedih", "marah", "takut"];

  const recentNegative = emotions

    .filter((e) => negativeEmotions.includes(e.emotion) && e.intensity >= 7)

    .slice(0, 3);

  if (emotions.length === 0) {

    return (

      <div className="rounded-2xl bg-card p-6 text-center shadow-soft">

        <Heart className="mx-auto mb-2 h-8 w-8" style={{ color: HIJAU_HATI }} />

        <p className="font-display text-sm font-extrabold text-foreground">Belum ada check-in</p>

        <p className="mt-1 text-xs text-muted-foreground">

          Anak anda belum mula check-in emosi. Pop-up akan muncul masa login.

        </p>

      </div>

    );

  }

  return (

    <div className="flex flex-col gap-4">

      {recentNegative.length > 0 && (

        <div className="rounded-2xl p-4" style={{ background: "#FDECEA", border: "2px solid #F5C4C4" }}>

          <p className="mb-2 text-xs font-extrabold" style={{ color: "#A32D2D" }}>⚠️ Perlu Perhatian</p>

          {recentNegative.map((e) => (

            <p key={e.id} className="text-xs" style={{ color: "#A32D2D" }}>

              {EMOTION_EMOJI[e.emotion]} {EMOTION_LABEL[e.emotion]} ({e.intensity}/9) — {SITUATION_LABEL[e.situation]} •{" "}

              {new Date(e.created_at).toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}

            </p>

          ))}

          <p className="mt-2 text-xs" style={{ color: "#7A1A1A" }}>

            Luangkan masa berbual dengan anak anda hari ini. 💚

          </p>

        </div>

      )}

      <div className="grid grid-cols-3 gap-3">

        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">

          <p className="text-2xl">{topEmotion ? EMOTION_EMOJI[topEmotion] : "—"}</p>

          <p className="text-[10px] text-muted-foreground mt-1">Paling Kerap</p>

          <p className="text-xs font-extrabold" style={{ color: topEmotion ? EMOTION_COLOR[topEmotion] : "#888" }}>

            {topEmotion ? EMOTION_LABEL[topEmotion] : "—"}

          </p>

        </div>

        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">

          <p className="font-display text-xl font-extrabold" style={{ color: HIJAU_HATI }}>{avgIntensity ?? "—"}</p>

          <p className="text-[10px] text-muted-foreground mt-1">Purata Intensiti</p>

          <p className="text-xs font-extrabold text-muted-foreground">dari 9</p>

        </div>

        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">

          <p className="text-xs font-extrabold" style={{ color: HIJAU_HATI }}>{topSituation ? SITUATION_LABEL[topSituation] : "—"}</p>

          <p className="text-[10px] text-muted-foreground mt-1">Situasi Kerap</p>

          <p className="text-xs font-extrabold" style={{ color: "#888" }}>{mingguRows.length} check-in</p>

        </div>

      </div>

      <div className="rounded-2xl bg-card p-4 shadow-soft">

        <p className="mb-3 text-xs font-extrabold text-muted-foreground">Trend Emosi 7 Hari</p>

        <div className="flex justify-between gap-1">

          {trend7.map((h) => (

            <div key={h.tarikh} className="flex flex-1 flex-col items-center gap-1">

              {h.row ? (

                <span className="text-lg">{EMOTION_EMOJI[h.row.emotion]}</span>

              ) : (

                <span className="text-lg opacity-20">—</span>

              )}

              <div

                className="w-full h-1.5 rounded-full"

                style={{

                  background: h.row ? EMOTION_BG[h.row.emotion] : "hsl(var(--border))",

                  border: h.row ? `1px solid ${EMOTION_COLOR[h.row.emotion]}` : undefined,

                }}

              />

              <span

                className="text-[10px] font-extrabold"

                style={{ color: h.isToday ? HIJAU_HATI : "hsl(var(--muted-foreground))" }}

              >

                {h.label}

              </span>

              {h.row && (

                <span className="text-[9px]" style={{ color: EMOTION_COLOR[h.row.emotion] }}>

                  {h.row.intensity}/9

                </span>

              )}

            </div>

          ))}

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft">

        <p className="px-4 pt-3 pb-2 text-xs font-extrabold text-muted-foreground">Rekod Terkini</p>

        {emotions.slice(0, 7).map((e, i) => (

          <div

            key={e.id}

            className="flex items-center justify-between gap-3 px-4 py-3"

            style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}

          >

            <div className="flex items-center gap-3">

              <div

                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"

                style={{ background: EMOTION_BG[e.emotion] }}

              >

                {EMOTION_EMOJI[e.emotion]}

              </div>

              <div>

                <p className="text-sm font-extrabold" style={{ color: EMOTION_COLOR[e.emotion] }}>

                  {EMOTION_LABEL[e.emotion]} — {e.intensity}/9

                </p>

                <p className="text-xs text-muted-foreground">{SITUATION_LABEL[e.situation]}</p>

              </div>

            </div>

            <p className="text-xs text-muted-foreground shrink-0">

              {new Date(e.created_at).toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}

            </p>

          </div>

        ))}

      </div>

    </div>

  );

}

function TrendChart({ stats }: { stats: StatsRow[] }) {
  const hari = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const tarikh = daysAgoKL(6 - i);
      const row = stats.find((s) => s.tarikh === tarikh);
      const d = new Date(tarikh + "T00:00:00Z");
      return {
        tarikh,
        label: HARI_PENDEK[d.getUTCDay()],
        soalan: row?.soalan_dijawab ?? 0,
        isToday: i === 6,
      };
    });
  }, [stats]);

  const max = Math.max(...hari.map((h) => h.soalan), 1);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-end justify-between gap-2 h-28">
        {hari.map((h) => (
          <div key={h.tarikh} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              {h.soalan > 0 ? h.soalan : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "72px" }}>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(4, (h.soalan / max) * 72)}px`,
                  backgroundColor: h.isToday ? HIJAU : h.soalan > 0 ? `${HIJAU}88` : `${HIJAU}1a`,
                }}
              />
            </div>
            <span
              className="text-[10px] font-extrabold"
              style={{ color: h.isToday ? HIJAU : "hsl(var(--muted-foreground))" }}
            >
              {h.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Soalan dijawab 7 hari lepas
      </p>
    </div>
  );
}

interface TopikAgg {
  subjek: string;
  darjah: string;
  topik: string;
  markah: number;
  jumlah: number;
  peratus: number;
  created_at: string;
}

function grupTopik(progress: ProgressRow[]): Map<string, TopikAgg[]> {
  const rows = progress.filter((r) => r.aktiviti === "latih-tubi" && r.topik);
  // subjek -> topik -> agg
  const bySubjek = new Map<string, Map<string, TopikAgg>>();
  rows.forEach((r) => {
    const topik = r.topik as string;
    if (!bySubjek.has(r.subjek)) bySubjek.set(r.subjek, new Map());
    const tmap = bySubjek.get(r.subjek)!;
    const cur = tmap.get(topik);
    const markah = Number(r.markah ?? 0);
    const jumlah = Number(r.jumlah_soalan ?? 0);
    if (cur) {
      cur.markah += markah;
      cur.jumlah += jumlah;
      if (r.created_at > cur.created_at) cur.created_at = r.created_at;
    } else {
      tmap.set(topik, {
        subjek: r.subjek,
        darjah: r.darjah,
        topik,
        markah,
        jumlah,
        peratus: 0,
        created_at: r.created_at,
      });
    }
  });
  const out = new Map<string, TopikAgg[]>();
  bySubjek.forEach((tmap, subjek) => {
    const arr = Array.from(tmap.values()).map((v) => ({
      ...v,
      peratus: v.jumlah > 0 ? Math.round((v.markah / v.jumlah) * 100) : 0,
    }));
    out.set(subjek, arr);
  });
  return out;
}

function warnaTopik(p: number): string {
  if (p >= 80) return HIJAU;
  if (p < 60) return "#dc2626";
  return "#7a5300";
}

function ParentDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [anakList, setAnakList] = useState<ChildProfile[]>([]);
  const [aktifId, setAktifId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AKTIF_ANAK_KEY);
  });
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [stats, setStats] = useState<StatsRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [sijilList, setSijilList] = useState<SijilRow[]>([]);
  const [emotions, setEmotions] = useState<EmotionRow[]>([]);
  const [mpt4Keputusan, setMpt4Keputusan] = useState<Mpt4KeputusanRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showMaklumat, setShowMaklumat] = useState(false);
  const [resetFor, setResetFor] = useState<ChildProfile | null>(null);
  const [lastSignInMap, setLastSignInMap] = useState<Map<string, string>>(new Map());

  const pilihAnak = useCallback((id: string | null) => {
    setAktifId(id);
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(AKTIF_ANAK_KEY, id);
    else localStorage.removeItem(AKTIF_ANAK_KEY);
  }, []);

  const isChild = !!user?.email?.includes(CHILD_EMAIL_DOMAIN);

  const { tambahAnak } = Route.useSearch();

  useEffect(() => {
    if (tambahAnak === "1") setShowAdd(true);
  }, [tambahAnak]);

  useEffect(() => {
    if (shouldSkipChildGuard()) return;
    if (!loading && !user) navigate({ to: "/login" });
    else if (!loading && isChild) {
      navigate({ to: "/dashboard/progress" });
    }
  }, [loading, user, isChild, navigate]);


  async function muatLastSignInAnak() {
    try {
      const { data, error } = await supabase.rpc("login_terakhir_semua_anak");
      if (error) {
        console.warn("[ParentDashboard] login_terakhir_semua_anak error:", error);
        return;
      }
      const rows = (data ?? []) as { child_user_id: string; last_sign_in_at: string | null }[];
      const map = new Map<string, string>();
      for (const r of rows) {
        if (r.last_sign_in_at) map.set(r.child_user_id, r.last_sign_in_at);
      }
      setLastSignInMap(map);
    } catch (e) {
      console.warn("[ParentDashboard] muatLastSignInAnak failed:", e);
    }
  }

  useEffect(() => {
    if (!user) return;
    senaraikanAnak().then((list) => {
      setAnakList(list);
      const saved = typeof window === "undefined" ? null : localStorage.getItem(AKTIF_ANAK_KEY);
      const savedValid = saved && list.some((a) => a.id === saved);
      if (savedValid) {
        if (saved !== aktifId) pilihAnak(saved);
      } else if (list.length > 0) {
        if (!aktifId) pilihAnak(list[0].id);
      }
      if (saved && !savedValid) {
        localStorage.removeItem(AKTIF_ANAK_KEY);
      }
    });
    muatLastSignInAnak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const anakAktif = anakList.find((a) => a.id === aktifId) ?? null;
  const anakUserId = anakAktif?.child_user_id ?? null;

  // Status bayaran anak aktif (untuk pilih antara KaliInsightCard penuh vs KaliUpdateCard percuma)
  const [anakPaid, setAnakPaid] = useState<boolean | null>(null);
  useEffect(() => {
    if (!anakUserId) {
      setAnakPaid(null);
      return;
    }
    let mounted = true;
    supabase
      .from("profiles")
      .select("darjah_akses")
      .eq("id", anakUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const akses = data?.darjah_akses;
        setAnakPaid(Array.isArray(akses) && akses.length > 0);
      });
    return () => {
      mounted = false;
    };
  }, [anakUserId]);

  async function fetchAnakData(uid: string, showSpinner = true) {
    if (showSpinner) setFetching(true);
    const [
      { data: p, error: pError },
      { data: s, error: sError },
      { data: b, error: bError },
      sj,
      { data: em },
      { data: mpt4 },
    ] = await Promise.all([
      supabase
        .from("user_progress")
        .select("id, darjah, subjek, aktiviti, markah, jumlah_soalan, peratus, masa_ambil, created_at, topik")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_stats")
        .select("tarikh, soalan_dijawab, masa_belajar, bab_selesai")
        .eq("user_id", uid)
        .order("tarikh", { ascending: false })
        .limit(60),
      supabase
        .from("user_badges")
        .select("id, kod, nama, ikon, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      senaraikanSijilAnak(uid),
      supabase
        .from("emotion_checkins")
        .select("id, emotion, intensity, situation, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("mpt4_keputusan")
        .select("id, markah_keseluruhan, markah_penuh, completed_at, mpt4_set(subjek, nombor_set, tajuk, jumlah_markah)")
        .eq("user_id", uid)
        .eq("status", "completed")
        .order("completed_at", { ascending: false }),
    ]);
    console.log("[ParentDashboard] fetchAnakData", {
      user_id: uid,
      user_progress_rows: p?.length ?? 0,
      user_stats_rows: s?.length ?? 0,
      user_badges_rows: b?.length ?? 0,
      sijil_rows: sj.length,
      errors: {
        user_progress: pError,
        user_stats: sError,
        user_badges: bError,
      },
    });
    setProgress((p ?? []) as ProgressRow[]);
    setStats((s ?? []) as StatsRow[]);
    setBadges((b ?? []) as BadgeRow[]);
    setSijilList(sj);
    setEmotions((em ?? []) as EmotionRow[]);
    setMpt4Keputusan((mpt4 ?? []) as unknown as Mpt4KeputusanRow[]);
    if (showSpinner) setFetching(false);
  }

  async function refreshAnak() {
    const [list] = await Promise.all([senaraikanAnak(), muatLastSignInAnak()]);
    setAnakList(list);
    const saved = typeof window === "undefined" ? null : localStorage.getItem(AKTIF_ANAK_KEY);
    const savedValid = saved && list.some((a) => a.id === saved);
    const nextAktifId = savedValid ? saved : list[0]?.id ?? null;
    if (nextAktifId !== aktifId) pilihAnak(nextAktifId);
    const uid =
      list.find((a) => a.id === nextAktifId)?.child_user_id ?? anakUserId ?? null;
    if (uid) {
      await fetchAnakData(uid, true);
    } else {
      // No linked child yet — clear stale data so UI reflects reality
      setProgress([]);
      setStats([]);
      setBadges([]);
      setSijilList([]);
    }
  }

  useEffect(() => {
    if (!anakUserId) {
      setProgress([]);
      setStats([]);
      setBadges([]);
      setSijilList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      await fetchAnakData(anakUserId, true);
      if (cancelled) return;
    })();

    // Realtime: auto-refresh when new progress/stats/badges arrive for this child
    const channel = supabase
      .channel(`anak-${anakUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_badges", filter: `user_id=eq.${anakUserId}` },
        () => { if (!cancelled) fetchAnakData(anakUserId, false); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anakUserId]);

  // ── Pengiraan ringkasan
  const tarikhMingguIni = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) arr.push(daysAgoKL(i));
    return new Set(arr);
  }, []);
  const tarikhBulanIni = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 30; i++) arr.push(daysAgoKL(i));
    return new Set(arr);
  }, []);

  const minggu = useMemo(() => {
    const p = progress.filter((r) => tarikhMingguIni.has(toKLDate(r.created_at)));
    const s = stats.filter((r) => tarikhMingguIni.has(r.tarikh));
    const soalanStats = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masaStats = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);
    const soalanProg = p.reduce((a, r) => a + (r.jumlah_soalan ?? 0), 0);
    const masaProg = Math.round(p.reduce((a, r) => a + (r.masa_ambil ?? 0), 0) / 60);
    const soalan = Math.max(soalanStats, soalanProg);
    const masa = Math.max(masaStats, masaProg);
    const bab = Math.max(s.reduce((a, r) => a + (r.bab_selesai ?? 0), 0), p.length);
    const peratus = p.length === 0 ? 0 : Math.round(p.reduce((a, r) => a + Number(r.peratus), 0) / p.length);
    return { soalan, masa, bab, peratus };
  }, [progress, stats, tarikhMingguIni]);

  const bulan = useMemo(() => {
    const p = progress.filter((r) => tarikhBulanIni.has(toKLDate(r.created_at)));
    const s = stats.filter((r) => tarikhBulanIni.has(r.tarikh));
    const soalanStats = s.reduce((a, r) => a + (r.soalan_dijawab ?? 0), 0);
    const masaStats = s.reduce((a, r) => a + (r.masa_belajar ?? 0), 0);
    const soalanProg = p.reduce((a, r) => a + (r.jumlah_soalan ?? 0), 0);
    const masaProg = Math.round(p.reduce((a, r) => a + (r.masa_ambil ?? 0), 0) / 60);
    const soalan = Math.max(soalanStats, soalanProg);
    const masa = Math.max(masaStats, masaProg);

    const perSubjek = new Map<string, { jumlah: number; bil: number }>();
    p.forEach((r) => {
      const cur = perSubjek.get(r.subjek) ?? { jumlah: 0, bil: 0 };
      cur.jumlah += Number(r.peratus);
      cur.bil += 1;
      perSubjek.set(r.subjek, cur);
    });
    const ranked = Array.from(perSubjek.entries())
      .map(([sj, v]) => ({ subjek: sj, purata: Math.round(v.jumlah / v.bil), bil: v.bil }))
      .sort((a, b) => b.purata - a.purata);
    const terkuat = ranked[0] ?? null;
    const lemah = ranked.length > 0 ? ranked[ranked.length - 1] : null;
    return { soalan, masa, terkuat, lemah };
  }, [progress, stats, tarikhBulanIni]);

  // Topik-topik lemah (purata < 60%) untuk bulan ini, dikumpul per subjek.
  // Kekalkan darjah terkini bagi setiap (subjek, topik) supaya butang "Latih Tubi Topik Ini"
  // pergi ke darjah yang tepat.
  const bulanTopikLemah = useMemo(() => {
    const p = progress.filter(
      (r) =>
        tarikhBulanIni.has(toKLDate(r.created_at)) &&
        r.aktiviti !== "nota" &&
        !!r.topik &&
        String(r.topik).trim() !== "",
    );
    const byKey = new Map<
      string,
      { subjek: string; topik: string; jumlah: number; bil: number; darjah: string; latest: string }
    >();
    p.forEach((r) => {
      const key = `${r.subjek}||${r.topik}`;
      const cur = byKey.get(key);
      if (cur) {
        cur.jumlah += Number(r.peratus);
        cur.bil += 1;
        if (r.created_at > cur.latest) {
          cur.latest = r.created_at;
          cur.darjah = r.darjah;
        }
      } else {
        byKey.set(key, {
          subjek: r.subjek,
          topik: r.topik as string,
          jumlah: Number(r.peratus),
          bil: 1,
          darjah: r.darjah,
          latest: r.created_at,
        });
      }
    });
    const bySubjek = new Map<string, { topik: string; purata: number; darjah: string }[]>();
    byKey.forEach((v) => {
      const purata = v.bil > 0 ? Math.round(v.jumlah / v.bil) : 0;
      if (purata >= 60) return;
      const arr = bySubjek.get(v.subjek) ?? [];
      arr.push({ topik: v.topik, purata, darjah: v.darjah });
      bySubjek.set(v.subjek, arr);
    });
    bySubjek.forEach((arr) => arr.sort((a, b) => a.purata - b.purata));
    return bySubjek;
  }, [progress, tarikhBulanIni]);

  const kemajuanSubjek = useMemo(() => {
    return SUBJEK_LIST.map((sj) => {
      const rows = progress.filter((p) => p.subjek === sj.id);
      const aktivitiUnik = new Set(rows.map((r) => r.aktiviti)).size;
      const peratusSiap = Math.min(100, Math.round((aktivitiUnik / 5) * 100));
      const purata = rows.length === 0 ? 0 : Math.round(rows.reduce((a, r) => a + Number(r.peratus), 0) / rows.length);
      const terkini = rows[0] ?? null;
      return { subjek: sj, peratusSiap, purata, terkini, jumlah: rows.length };
    });
  }, [progress]);

  const streak = kiraStreak(stats);

  const hariSejakAktif = useMemo(() => {
    const lastSignInAt = anakUserId ? lastSignInMap.get(anakUserId) : undefined;
    if (!lastSignInAt) return Number.POSITIVE_INFINITY;
    const last = parseIsoUTC(lastSignInAt);
    return Math.floor((Date.now() - last.getTime()) / 86400000);
  }, [anakUserId, lastSignInMap]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  const firstName =
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Ibu/Bapa";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={badges.length} userName={user.email?.split("@")[0]} onLogout={handleLogout} />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/pilih-darjah"
          className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-80"
          style={{ color: HIJAU }}
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Utama
        </Link>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold text-foreground">Assalamualaikum, {firstName}! 👋</h1>
              <p className="text-sm text-muted-foreground">
                {anakList.length === 0
                  ? "Tambah profil anak untuk mula pantau pembelajaran."
                  : anakList.length === 1
                    ? `Pantau pembelajaran ${anakList[0].nama}.`
                    : `Anda mempunyai ${anakList.length} orang anak. Pilih anak untuk dipantau.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={refreshAnak}
              className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 font-display text-sm font-extrabold text-muted-foreground shadow-soft hover:text-foreground"
            >
              Muat Semula
            </button>
            <button
              onClick={() => setShowMaklumat(true)}
              className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 font-display text-sm font-extrabold text-muted-foreground shadow-soft hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Maklumat Saya
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
              style={{ backgroundColor: HIJAU }}
            >
              <PlusCircle className="h-4 w-4" /> Tambah Anak
            </button>
          </div>
        </div>

        {/* Borang tambah anak (cipta akaun + auto-link) */}
        {showAdd && (
          <FormTambahAnak
            onAdded={async () => {
              const list = await senaraikanAnak();
              setAnakList(list);
              setShowAdd(false);
              // Fokus pada anak yang baru ditambah (terakhir mengikut created_at asc)
              if (list.length > 0) pilihAnak(list[list.length - 1].id);
            }}
          />
        )}

        <Dialog open={showMaklumat} onOpenChange={setShowMaklumat}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-extrabold">Maklumat Saya</DialogTitle>
            </DialogHeader>
            <MaklumatSaya />
          </DialogContent>
        </Dialog>

        {/* Pemilih anak */}
        {anakList.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-card p-8 text-center shadow-card">
            <p className="font-display text-lg font-extrabold text-foreground">Belum ada profil anak</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Klik <b>Tambah Anak</b> untuk mula. Anda akan dapat kod jemputan untuk diberikan kepada anak.
            </p>
          </div>
        ) : (
          <>
            <section className="mt-6 flex flex-wrap gap-2">
              {anakList.map((a) => {
                const aktif = a.id === aktifId;
                return (
                  <button
                    key={a.id}
                    onClick={() => pilihAnak(a.id)}
                    className="rounded-full px-4 py-2 font-display text-sm font-extrabold transition"
                    style={{
                      backgroundColor: aktif ? HIJAU : `${HIJAU}14`,
                      color: aktif ? "#fff" : HIJAU,
                      border: `2px solid ${aktif ? HIJAU : `${HIJAU}33`}`,
                    }}
                  >
                    {a.nama} • D{a.darjah}
                    {!a.child_user_id && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Belum link</span>
                    )}
                  </button>
                );
              })}
            </section>

            <PermintaanTebusanSeksyen anakList={anakList} parentUserId={user?.id} />


            {anakAktif && anakAktif.child_user_id && (
              <>
                {fetching ? (
                  <div className="mt-6 rounded-3xl bg-card p-10 text-center shadow-card">
                    <p className="text-muted-foreground">Memuatkan data anak...</p>
                  </div>
                ) : (
                  <>
                    {/* ALERT: Anak tidak aktif */}
                    {hariSejakAktif > 3 && (
                      <div
                        className="mt-6 flex items-center gap-3 rounded-2xl p-4 shadow-soft"
                        style={{ background: "#FFF4E5", border: "2px solid #FDBA74" }}
                      >
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <p className="font-display text-sm font-extrabold" style={{ color: "#9A3412" }}>
                            {anakAktif.nama} belum log masuk{" "}
                            {Number.isFinite(hariSejakAktif) ? `sejak ${hariSejakAktif} hari lalu` : "buat masa ini"}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: "#9A3412" }}>
                            Beri sedikit galakan supaya anak teruskan pembelajaran.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* KALI: Bukti Kemajuan + Cadangan (susunan bergantung data kemajuan) */}
                    <SeksyenKaliGabungan
                      childUserId={anakAktif.child_user_id}
                      childProfileId={anakAktif.id}
                      namaAnak={anakAktif.nama}
                      darjahAnak={anakAktif.darjah}
                      anakPaid={anakPaid}
                    />


                    {/* HERO SUMMARY: Subjek Terkuat & Perlukan Perhatian */}
                    <Seksyen tajuk="Ringkasan Prestasi" ikon={<Trophy className="h-5 w-5" />}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <KadSubjekTrend label="Subjek Terkuat 💪" sj={bulan.terkuat} warna={STAT_HIJAU} />
                        <KadSubjekTrend
                          label="Perlukan Perhatian ⚠️"
                          sj={bulan.lemah && bulan.terkuat?.subjek !== bulan.lemah.subjek ? bulan.lemah : null}
                          warna={STAT_OREN}
                          topikLemah={
                            bulan.lemah && bulan.terkuat?.subjek !== bulan.lemah.subjek
                              ? (bulanTopikLemah.get(bulan.lemah.subjek) ?? []).slice(0, 3)
                              : []
                          }
                          namaAnak={anakAktif.nama}
                        />
                      </div>
                    </Seksyen>

                    {/* PERCUBAAN MPT4 — Darjah 4 sahaja */}
                    {Number(anakAktif.darjah) === 4 && (
                      <Seksyen tajuk="Percubaan MPT4 (Darjah 4)" ikon={<Target className="h-5 w-5" />}>
                        <p className="-mt-2 mb-3 text-sm text-muted-foreground">
                          Percubaan ikut format peperiksaan sebenar.
                        </p>
                        <SeksyenMpt4 keputusan={mpt4Keputusan} />
                      </Seksyen>
                    )}


                    {/* MINGGU INI */}
                    <Seksyen tajuk="Minggu Ini" ikon={<Calendar className="h-5 w-5" />}>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Stat label="Soalan Dijawab" nilai={minggu.soalan} icon={<BookOpen className="h-5 w-5" />} warna={STAT_HIJAU} light />
                        <Stat label="Ketepatan" nilai={`${minggu.peratus}%`} icon={<Target className="h-5 w-5" />} warna={STAT_HIJAU} light />
                        <Stat label="Masa Belajar" nilai={formatMasa(minggu.masa)} icon={<Clock className="h-5 w-5" />} warna={STAT_BIRU} light />
                        <Stat label="Bab Selesai" nilai={minggu.bab} icon={<TrendingUp className="h-5 w-5" />} warna={STAT_OREN} light />
                      </div>
                    </Seksyen>

                    {/* TREND 7 HARI */}
                    <Seksyen tajuk="Trend 7 Hari" ikon={<TrendingUp className="h-5 w-5" />}>
                      <TrendChart stats={stats} />
                    </Seksyen>

                    {/* BULAN INI */}
                    <Seksyen tajuk="Bulan Ini" ikon={<TrendingUp className="h-5 w-5" />}>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Stat label="Jumlah Soalan" nilai={bulan.soalan} icon={<BookOpen className="h-5 w-5" />} warna={STAT_HIJAU} light />
                        <Stat label="Jumlah Masa" nilai={formatMasa(bulan.masa)} icon={<Clock className="h-5 w-5" />} warna={STAT_BIRU} light />
                      </div>
                    </Seksyen>

                    {/* KEMAJUAN SUBJEK */}
                    <Seksyen tajuk="Kemajuan Subjek" ikon={<BookOpen className="h-5 w-5" />}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {kemajuanSubjek.map((k) => (
                          <div
                            key={k.subjek.id}
                            className="rounded-2xl border-2 p-4 shadow-card"
                            style={{
                              background: "linear-gradient(135deg, #FFFCF0 0%, #FFFEFB 60%, #FFF8E5 100%)",
                              borderColor: "var(--brand-butter)",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-base font-extrabold text-foreground">{k.subjek.title}</h3>
                              <span
                                className="rounded-full bg-brand-butter px-3 py-1 text-xs font-extrabold text-brand-butter-foreground shadow-soft"
                              >
                                Skor: {k.purata}%
                              </span>
                            </div>
                            <div className="mt-2 h-3 overflow-hidden rounded-full" style={{ backgroundColor: `${HIJAU}1a` }}>
                              <div
                                className="h-full transition-all"
                                style={{ width: `${k.peratusSiap}%`, background: `linear-gradient(90deg, ${HIJAU}, #2AAE72)` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Kemajuan: {k.peratusSiap}% siap • {k.jumlah} aktiviti
                              {k.terkini && (
                                <>
                                  {" "}
                                  • Terkini: <b>{k.terkini.markah}/{k.terkini.jumlah_soalan}</b>
                                </>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Seksyen>

                    {(() => {
                      const topikMap = grupTopik(progress);
                      if (topikMap.size === 0) return null;
                      return (
                        <Seksyen tajuk="Latih Tubi — Rekod Topik" ikon={<Target className="h-5 w-5" />}>
                          <div className="flex flex-col gap-4">
                            {Array.from(topikMap.entries()).map(([subjekId, rows]) => {
                              const sj = SUBJEK_LIST.find((s) => s.id === subjekId);
                              return (
                                <div key={subjekId}>
                                  <p className="mb-2 font-display text-sm font-extrabold text-foreground">
                                    {sj?.title ?? subjekId}
                                  </p>
                                  <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
                                    {rows.sort((a, b) => b.peratus - a.peratus).map((r, i) => {
                                      const warna = warnaTopik(r.peratus);
                                      return (
                                        <div
                                          key={r.topik}
                                          className="flex items-center justify-between gap-3 px-4 py-3"
                                          style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">{r.topik}</p>
                                            <p className="text-xs text-muted-foreground">
                                              Darjah {r.darjah} • {r.jumlah} soalan dijawab • {formatTarikh(r.created_at)}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${HIJAU}1a` }}>
                                              <div
                                                className="h-full rounded-full"
                                                style={{ width: `${Math.min(100, r.peratus)}%`, backgroundColor: warna }}
                                              />
                                            </div>
                                            <div className="text-right w-16">
                                              <p className="font-display text-sm font-extrabold leading-tight" style={{ color: warna }}>
                                                {r.markah}/{r.jumlah}
                                              </p>
                                              <p className="text-[10px] font-bold leading-tight" style={{ color: warna }}>
                                                {r.peratus}%
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Seksyen>
                      );
                    })()}

                    {/* STREAK & LENCANA */}
                    <Seksyen tajuk="Streak & Lencana" ikon={<Flame className="h-5 w-5" />}>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Stat label="Streak Semasa" nilai={`${streak} hari 🔥`} icon={<Flame className="h-5 w-5" />} warna={STAT_OREN} light />
                        <Stat label="Jumlah Lencana" nilai={badges.length} icon={<Award className="h-5 w-5" />} warna={STAT_EMAS} light />
                        <Stat label="Bab Disiapkan" nilai={stats.reduce((a, r) => a + r.bab_selesai, 0)} icon={<TrendingUp className="h-5 w-5" />} warna={STAT_HIJAU} light />
                      </div>
                      {badges.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {badges.map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center gap-2 rounded-full bg-brand-butter px-3.5 py-1.5 text-brand-butter-foreground shadow-soft"
                            >
                              <span className="text-xl leading-none">{b.ikon}</span>
                              <span className="font-display text-xs font-extrabold">{b.nama}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Seksyen>

                    {/* KALIFAH HATI */}
                    <Seksyen tajuk="Kalifah Hati 💚" ikon={<Heart className="h-5 w-5" />}>
                      <KalifahHatiSeksyen emotions={emotions} />
                    </Seksyen>

                    {/* SIJIL CEMERLANG ANAK */}
                    <Seksyen tajuk="Sijil Cemerlang Anak" ikon={<Trophy className="h-5 w-5" />}>
                      {sijilList.length === 0 ? (
                        <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
                          <p className="text-sm text-muted-foreground">
                            Belum ada sijil cemerlang. Anak akan dapat sijil bila skor 100% dalam kuiz topik. 🏆
                          </p>
                        </div>
                      ) : (
                        <div
                          className="overflow-hidden rounded-2xl border-2 shadow-card"
                          style={{
                            background: "linear-gradient(135deg, #FFFCF0 0%, #FFFEFB 60%, #FFF8E5 100%)",
                            borderColor: "var(--brand-butter)",
                          }}
                        >
                          {sijilList.map((sj, i) => {
                            const subj = SUBJEK_LIST.find((s) => s.id === sj.subjek);
                            const subjekTitle = subj?.title ?? sj.subjek;
                            const darjahLabel = `Darjah ${sj.darjah}`;
                            const tarikhFmt = new Date(sj.tarikh + "T00:00:00").toLocaleDateString("ms-MY", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            });
                            return (
                              <div
                                key={sj.id}
                                className="flex flex-wrap items-center justify-between gap-3 p-4"
                                style={{ borderTop: i === 0 ? "none" : "1px solid var(--brand-butter)" }}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-butter text-brand-butter-foreground shadow-soft"
                                  >
                                    <Trophy className="h-5 w-5" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-display text-sm font-extrabold text-foreground">
                                      {sj.topik}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {subjekTitle} • {darjahLabel} • {tarikhFmt}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await downloadSijil(
                                        {
                                          jenis: "kuiz-cemerlang",
                                          namaMurid: sj.nama_pelajar,
                                          tajuk: `${subjekTitle} — ${sj.topik} — ${darjahLabel}`,
                                          tarikh: tarikhFmt,
                                          purata: 100,
                                          kodSijil: sj.kod_sijil,
                                        },
                                        `sijil-kuiz-${sj.subjek}-${sj.darjah}-${sj.topik.replace(/\s+/g, "-")}.pdf`,
                                      );
                                    } catch (e) {
                                      toast.error("Gagal muat turun sijil");
                                      console.error(e);
                                    }
                                  }}
                                  className="rounded-full px-4 py-2 font-display text-xs font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
                                  style={{ backgroundColor: HIJAU }}
                                >
                                  📥 Muat Turun Semula
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Seksyen>

                    {/* AKTIVITI TERKINI */}
                    <Seksyen tajuk="Aktiviti Terkini" ikon={<BookOpen className="h-5 w-5" />}>
                      {progress.length === 0 ? (
                        <div className="rounded-2xl bg-card p-5 text-center shadow-soft">
                          <p className="text-sm text-muted-foreground">Belum ada aktiviti direkodkan.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
                          {progress.slice(0, 10).map((row, i) => {
                            const sj = SUBJEK_LIST.find((s) => s.id === row.subjek);
                            const peratus = Number(row.peratus);
                            return (
                              <div
                                key={row.id}
                                className="flex items-center justify-between gap-3 p-4"
                                style={{ borderTop: i === 0 ? "none" : "1px solid hsl(var(--border))" }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-display text-sm font-extrabold text-foreground">
                                    {sj?.title ?? row.subjek}
                                    <span className="ml-1 font-normal text-muted-foreground">
                                      • {AKTIVITI_LABEL[row.aktiviti] ?? row.aktiviti}
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Darjah {row.darjah} • {formatTarikh(row.created_at)}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p
                                    className="font-display text-lg font-extrabold"
                                    style={{ color: peratus >= 60 ? HIJAU : "#dc2626" }}
                                  >
                                    {row.markah}/{row.jumlah_soalan}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{Math.round(peratus)}%</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Seksyen>

                    {/* TETAPAN AKAUN (collapsible) */}
                    <Seksyen tajuk="Tetapan Akaun" ikon={<KeyRound className="h-5 w-5" />}>
                      <details className="rounded-2xl bg-card shadow-soft" style={{ border: `2px solid ${HIJAU}1f` }}>
                        <summary className="cursor-pointer list-none px-4 py-3 font-display text-sm font-extrabold text-foreground">
                          🔐 Reset Password Anak
                        </summary>
                        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: `${HIJAU}1f` }}>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {anakList.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-background p-4 shadow-soft"
                                style={{ border: `2px solid ${HIJAU}1f` }}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-display text-base font-extrabold text-foreground">{a.nama}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    @{a.username ?? "—"} • Darjah {a.darjah}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setResetFor(a)}
                                  disabled={!a.child_user_id}
                                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-display text-xs font-extrabold text-white shadow-soft disabled:opacity-50"
                                  style={{ backgroundColor: HIJAU }}
                                  title={!a.child_user_id ? "Anak belum dipautkan" : "Reset password anak"}
                                >
                                  <KeyRound className="h-3.5 w-3.5" /> Reset Password
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </Seksyen>

                    <div className="mt-6 mb-12 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Padam profil ${anakAktif.nama}? Pautan ke akaun anak akan hilang.`)) return;
                          const ok = await padamAnak(anakAktif.id);
                          if (ok) {
                            const list = await senaraikanAnak();
                            setAnakList(list);
                            pilihAnak(list[0]?.id ?? null);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Padam profil ini
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
      {resetFor && (
        <ResetPasswordModal child={resetFor} onClose={() => setResetFor(null)} />
      )}
    </div>
  );
}

function ResetPasswordModal({
  child,
  onClose,
}: {
  child: ChildProfile;
  onClose: () => void;
}) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 6) {
      setErr("Password minimum 6 aksara.");
      return;
    }
    if (pw1 !== pw2) {
      setErr("Password tidak sepadan.");
      return;
    }
    if (!child.child_user_id) {
      setErr("Anak belum dipautkan.");
      return;
    }
    setLoading(true);
    try {
      // Get session — try refresh if null (mobile browsers sometimes lose session)
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn("[reset-child-password] no session, trying refresh");
        const refreshed = await supabase.auth.refreshSession();
        session = refreshed.data.session;
      }
      const token = session?.access_token;
      if (!token) {
        const msg = "Sesi tamat. Sila log masuk semula.";
        setErr(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const url =
        "https://pgpkqbdyxoejwvubluqq.supabase.co/functions/v1/reset-child-password";
      console.log("[reset-child-password] calling", url, {
        child_user_id: child.child_user_id,
        hasToken: !!token,
      });

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            child_user_id: child.child_user_id,
            new_password: pw1,
          }),
        });
      } catch (netErr) {
        console.error("[reset-child-password] network error", netErr);
        const msg = "Tiada sambungan internet. Cuba semula.";
        setErr(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const raw = await res.text();
      let data: { ok?: boolean; success?: boolean; error?: string; message?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        console.error("[reset-child-password] non-JSON response", res.status, raw);
      }
      console.log("[reset-child-password] response", res.status, "body:", raw);

      setLoading(false);
      const succeeded = res.ok && (data?.ok === true || data?.success === true || (data?.error == null && res.status === 200));
      if (!succeeded) {
        console.error("[reset-child-password] failed", res.status, raw);
        const msg = data?.error || data?.message || `Gagal reset password (HTTP ${res.status}).`;
        setErr(msg);
        toast.error(msg);
        return;
      }
      toast.success("Password berjaya ditukar!");
      onClose();
    } catch (e) {
      console.error("[reset-child-password] unexpected error", e);
      const msg = e instanceof Error ? e.message : "Ralat tidak dijangka.";
      setErr(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card"
      >
        <h3 className="font-display text-xl font-extrabold text-foreground">
          Reset Password — {child.nama}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Tetapkan password baharu untuk akaun <b>@{child.username ?? "—"}</b>.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Password Baharu</span>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="Minimum 6 aksara"
            minLength={6}
            required
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Sahkan Password</span>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Taip semula password"
            minLength={6}
            required
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          />
        </label>
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 font-display text-sm font-extrabold text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
            style={{ backgroundColor: HIJAU }}
          >
            {loading ? "Menukar..." : "Sahkan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormTambahAnak({ onAdded }: { onAdded: () => void }) {
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [darjah, setDarjah] = useState("1");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [kredensialAnak, setKredensialAnak] = useState<{
    nama: string;
    darjah: string;
    username: string;
    password: string;
    session: { access_token: string; refresh_token: string } | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function salinKredensial() {
    if (!kredensialAnak) return;
    try {
      await navigator.clipboard.writeText(
        `Username: ${kredensialAnak.username}\nPassword: ${kredensialAnak.password}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  }

  async function teruskan() {
    if (!kredensialAnak) return;
    const k = kredensialAnak;
    if (!k.session) {
      setKredensialAnak(null);
      onAdded();
      return;
    }
    // Simpan sesi parent supaya boleh kembali kemudian
    try {
      const { data: cur } = await supabase.auth.getSession();
      if (cur.session && typeof window !== "undefined") {
        window.sessionStorage.setItem(
          PARENT_SESSION_BACKUP_KEY,
          JSON.stringify({
            access_token: cur.session.access_token,
            refresh_token: cur.session.refresh_token,
          }),
        );
      }
    } catch {
      /* abaikan */
    }

    markSkipChildGuard();

    const { error: setErrSession } = await supabase.auth.setSession(k.session);
    if (setErrSession) {
      clearSkipChildGuard();
      setKredensialAnak(null);
      setErr("Gagal log masuk akaun anak. Sila log masuk manual.");
      return;
    }
    setKredensialAnak(null);
    onAdded();
    if (k.darjah === "4") {
      navigate({ to: "/darjah/$darjahId/percubaan-mpt4", params: { darjahId: "4" } });
    } else {
      navigate({ to: "/darjah/$darjahId", params: { darjahId: k.darjah } });
    }
  }


  useEffect(() => {
    if (typeof window === "undefined") return;
    const previewNama = window.localStorage.getItem("previewNamaAnak");
    if (previewNama) setNama(previewNama);
    const previewDarjah = window.localStorage.getItem("previewDarjah");
    if (previewDarjah) setDarjah(previewDarjah);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    // Guna requestId sedia ada (retry selepas gagal) atau jana baharu.
    const rid = requestId ?? crypto.randomUUID();
    if (!requestId) setRequestId(rid);
    const res = await ciptaAkaunAnak(nama, darjah, rid);
    if (!res.ok) {
      setLoading(false);
      setErr(res.mesej ?? "Gagal mencipta akaun anak.");
      return;
    }

    setKredensialAnak({
      nama: nama.trim(),
      darjah,
      username: res.username ?? "-",
      password: res.generatedPassword ?? "-",
      session: res.session ?? null,
    });
    setRequestId(null);
    setLoading(false);
    setNama("");
  }



  return (
    <>
    {kredensialAnak && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-display text-xl font-extrabold text-foreground">
            Akaun {kredensialAnak.nama} berjaya dicipta! 🎉
          </h3>
          <p className="mt-2 text-xs font-bold text-destructive">
            Simpan maklumat ni — anak akan perlukan untuk log masuk semula di peranti/hari lain.
          </p>
          <div className="mt-4 rounded-2xl bg-muted p-4 font-mono text-sm text-foreground">
            <div>Username: {kredensialAnak.username}</div>
            <div>Password: {kredensialAnak.password}</div>
          </div>
          <button
            type="button"
            onClick={salinKredensial}
            className="mt-3 w-full rounded-full bg-muted px-4 py-2.5 font-display text-sm font-extrabold text-foreground"
          >
            {copied ? "Disalin!" : "📋 Salin Password"}
          </button>
          <button
            type="button"
            onClick={teruskan}
            className="mt-2 w-full rounded-full px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-soft"
            style={{ backgroundColor: HIJAU }}
          >
            {kredensialAnak.session ? "Teruskan ke Aktiviti Pertama →" : "Faham, Tutup"}
          </button>
        </div>
      </div>
    )}
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-card p-5 shadow-card" style={{ border: `2px solid ${HIJAU}33` }}>

      <h3 className="font-display text-lg font-extrabold text-foreground">Cipta Akaun Anak</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Kami akan cipta akaun anak automatik — tiada emel, username atau password perlu diisi.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Nama Anak</span>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth: Aisyah binti Ali"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
            required
            maxLength={60}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-extrabold text-foreground">Darjah</span>
          <select
            value={darjah}
            onChange={(e) => setDarjah(e.target.value)}
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 font-display text-sm"
          >
            {DARJAH_LIST.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-xl px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
        style={{ backgroundColor: HIJAU }}
      >
        {loading ? "Mencipta akaun..." : "Cipta Akaun Anak"}
      </button>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      {ok && <p className="mt-2 rounded-xl bg-primary/10 p-2 text-xs font-bold text-primary">{ok}</p>}
    </form>
    </>
  );

}

interface KemajuanItem {
  micro_skill_id: string;
  nama: string;
  darjah: number | null;
  subjek: string | null;
  sebelum: { mastery_score: number | null; level: string | null } | null;
  selepas: { mastery_score: number | null; level: string | null } | null;
  perubahan_mata: number | null;
  naik_tier: boolean | null;
  jumlah_percubaan: number | null;
  jumlah_sesi_berasingan: number | null;
  hari_berbeza: number | null;
  bahasa_cadangan: string | null;
}
interface LaporanKemajuan {
  status: "belum_cukup_data" | "mengumpul_data" | "ok";
  anak_nama: string | null;
  mesej_belum_cukup: string | null;
  ringkasan_7_hari: {
    jumlah_sesi: number | null;
    jumlah_soalan: number | null;
    ketepatan_purata: number | null;
    peratus_daripada_kali: number | null;
  } | null;
  kemajuan_30_hari: KemajuanItem[] | null;
}

function pct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Math.round(v * 100)}%`;
}

function labelMasteryBand(m: number): string {
  if (m < 40) return "Perlu Bantuan";
  if (m < 60) return "Perlu Diperkukuhkan";
  if (m < 80) return "Sedang Berkembang";
  return "Sudah Dikuasai";
}

function SeksyenKaliGabungan({
  childUserId,
  childProfileId,
  namaAnak,
  darjahAnak,
  anakPaid,
}: {
  childUserId: string;
  childProfileId: string;
  namaAnak: string;
  darjahAnak: string;
  anakPaid: boolean | null;
}) {
  const [data, setData] = useState<LaporanKemajuan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data: res, error } = await supabase.rpc("kali_laporan_kemajuan", {
          p_student_id: childUserId,
        });
        if (error) throw error;
        if (mounted) setData((res as unknown as LaporanKemajuan) ?? null);
      } catch (e) {
        console.error("[SeksyenKaliGabungan] RPC error:", e);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [childUserId]);

  const adaKemajuan = (data?.kemajuan_30_hari?.length ?? 0) > 0;
  const nama = data?.anak_nama || namaAnak;

  const cadangan = (
    <Seksyen tajuk="Cadangan KALI Hari Ini" ikon={<Sparkles className="h-5 w-5" />}>
      {anakPaid === null ? (
        <div className="rounded-2xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Memuatkan cadangan KALI...</p>
        </div>
      ) : anakPaid ? (
        <KaliInsightCard childUserId={childUserId} namaAnak={namaAnak} darjahAnak={darjahAnak} />
      ) : (
        <KaliUpdateCard childProfileId={childProfileId} childDarjah={darjahAnak} namaAnak={namaAnak} />
      )}
    </Seksyen>
  );

  if (loading) {
    return cadangan;
  }

  if (adaKemajuan && data) {
    return (
      <>
        <Seksyen tajuk="Bukti Kemajuan Bersama KALI" ikon={<TrendingUp className="h-5 w-5" />}>
          <KaliBuktiKemajuanCard data={data} namaAnak={namaAnak} />
        </Seksyen>
        {cadangan}
      </>
    );
  }

  return (
    <>
      {cadangan}
      {data && <KaliKemajuanCompactCard nama={nama} />}
    </>
  );
}

function KaliKemajuanCompactCard({ nama }: { nama: string }) {
  return (
    <div
      className="rounded-2xl p-4 shadow-soft"
      style={{ background: "#F1FAF4", border: "2px solid #BFE7D2" }}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" style={{ color: HIJAU }} />
        <h3 className="font-display text-sm font-extrabold" style={{ color: "#013E37" }}>
          KALI mula merekod kemajuan {nama}
        </h3>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "#134E3A" }}>
        Selepas beberapa sesi pembelajaran, KALI akan membandingkan tahap sebelum dan selepas untuk menunjukkan
        perubahan penguasaan {nama}.
      </p>
      <span
        className="mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{ background: "#FFF7DC", color: "#7A5000" }}
      >
        Belum cukup data · Teruskan beberapa sesi bersama KALI
      </span>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Jawab beberapa sesi → KALI bandingkan penguasaan → Laporan tersedia
      </p>
    </div>
  );
}

function KaliBuktiKemajuanCard({
  data,
  namaAnak,
}: {
  data: LaporanKemajuan;
  namaAnak: string;
}) {
  const [expand, setExpand] = useState(false);

  const nama = data.anak_nama || namaAnak;
  const kemajuan = data.kemajuan_30_hari ?? [];
  const r7 = data.ringkasan_7_hari ?? null;

  const shell = (children: React.ReactNode) => (
    <div
      className="rounded-2xl p-5 shadow-card"
      style={{ background: "#F1FAF4", border: "2px solid #BFE7D2" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" style={{ color: HIJAU }} />
        <h3 className="font-display text-base font-extrabold" style={{ color: "#013E37" }}>
          Perkembangan {nama} Bersama KALI
        </h3>
      </div>
      {children}
    </div>
  );

  const ringkasan7 = r7 && (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        { l: "Sesi", v: `${r7.jumlah_sesi ?? 0}` },
        { l: "Soalan", v: `${r7.jumlah_soalan ?? 0}` },
        { l: "Ketepatan", v: pct(r7.ketepatan_purata) },
        { l: "Drpd KALI", v: pct(r7.peratus_daripada_kali) },
      ].map((x) => (
        <div key={x.l} className="rounded-xl bg-white/80 p-3 text-center">
          <p className="font-display text-lg font-extrabold" style={{ color: "#013E37" }}>{x.v}</p>
          <p className="text-[11px] text-muted-foreground">{x.l}</p>
        </div>
      ))}
    </div>
  );



  const utama = kemajuan[0];
  return shell(
    <div className="flex flex-col gap-4">
      {r7 && (r7.jumlah_soalan ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada sesi pembelajaran dalam 7 hari terakhir.</p>
      ) : (
        ringkasan7
      )}

      {utama && (
        <div className="rounded-2xl bg-white p-4" style={{ border: "2px solid #BFE7D2" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Kemajuan Terbesar</p>
          <p className="mt-1 font-display text-sm font-extrabold" style={{ color: "#013E37" }}>
            {utama.nama}
            {utama.subjek ? ` · ${utama.subjek}` : ""}
            {utama.darjah != null ? ` · Darjah ${utama.darjah}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold" style={{ color: "#B0872B" }}>
                {utama.sebelum?.mastery_score ?? 0}%
              </p>
              <p className="text-[11px] text-muted-foreground">Sebelum</p>
            </div>
            <span className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>→</span>
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold" style={{ color: HIJAU }}>
                {utama.selepas?.mastery_score ?? 0}%
              </p>
              <p className="text-[11px] text-muted-foreground">Selepas</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-extrabold"
              style={{ background: "#E3F6EA", color: HIJAU }}
            >
              +{utama.perubahan_mata ?? 0} mata penguasaan
            </span>
            {utama.naik_tier && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                style={{ background: "#FFEEB3", color: "#013E37" }}
              >
                Naik tahap: {utama.sebelum?.level ?? "—"} → {utama.selepas?.level ?? "—"}
              </span>
            )}
          </div>

          {utama.bahasa_cadangan && (
            <p className="mt-3 text-sm" style={{ color: "#134E3A" }}>{utama.bahasa_cadangan}</p>
          )}

          <p className="mt-2 text-[11px] text-muted-foreground">
            {utama.jumlah_percubaan ?? 0} percubaan · {utama.jumlah_sesi_berasingan ?? 0} sesi ·{" "}
            {utama.hari_berbeza ?? 0} hari pembelajaran
          </p>
        </div>
      )}

      {kemajuan.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setExpand((v) => !v)}
            className="rounded-xl px-3 py-2 text-xs font-extrabold"
            style={{ background: "#E3F6EA", color: HIJAU }}
          >
            {expand ? "Sembunyikan" : "Lihat semua kemajuan"}
          </button>
          {expand && (
            <ul className="mt-2 flex flex-col gap-2">
              {kemajuan.slice(1).map((k) => (
                <li
                  key={k.micro_skill_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2"
                >
                  <span className="text-xs font-bold" style={{ color: "#013E37" }}>
                    {k.nama}
                    {k.darjah != null ? ` · Darjah ${k.darjah}` : ""}
                  </span>
                  <span className="text-xs font-extrabold">
                    <span style={{ color: "#B0872B" }}>{k.sebelum?.mastery_score ?? 0}%</span>
                    <span className="mx-1" style={{ color: HIJAU }}>→</span>
                    <span style={{ color: HIJAU }}>{k.selepas?.mastery_score ?? 0}%</span>
                    <span className="ml-2" style={{ color: HIJAU }}>+{k.perubahan_mata ?? 0} mata</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>,
  );
}

function KaliInsightCard({

  childUserId,
  namaAnak,
  darjahAnak,
}: {
  childUserId: string;
  namaAnak: string;
  darjahAnak?: string | null;
}) {
  const [insight, setInsight] = useState<{
    micro_skill_nama: string;
    sebab: string;
    tindakan: string;
    tier: string | null;
    confidence_level: string | null;
    mastery_score: number | null;
    total_attempts: number | null;
    correct_attempts: number | null;
    micro_skill_darjah: number | null;
    original_skill_nama: string | null;
    original_skill_darjah: number | null;
    original_mastery_score: number | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  async function salinArahanKali() {
    try {
      await navigator.clipboard.writeText(
        `📋 Minta ${namaAnak} log masuk sendiri → buka "Belajar Bersama KALI" untuk sesi ${insight?.micro_skill_nama ?? ""} hari ini.`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) return;
      setLoading(true);
      setError(false);
      try {
        let darjah = darjahAnak ? Number(darjahAnak) : NaN;
        if (!Number.isFinite(darjah) || darjah <= 0) {
          const { data: prof } = await supabase
            .from("child_profiles")
            .select("darjah")
            .eq("child_user_id", childUserId)
            .maybeSingle();
          darjah = Number((prof as { darjah?: string | number } | null)?.darjah);
        }
        const { data, error: rpcError } = await supabase.rpc("kali_next_best_question", {
          p_student_id: childUserId,
          ...(Number.isFinite(darjah) && darjah > 0 ? { p_darjah: Number(darjah) } : {}),
        } as never);
        if (rpcError) throw rpcError;
        const row = (Array.isArray(data) ? data[0] : data) as
          | {
              micro_skill_nama?: string;
              sebab?: string;
              tindakan?: string;
              tier?: string | null;
              confidence_level?: string | null;
              mastery_score?: number | null;
              total_attempts?: number | null;
              correct_attempts?: number | null;
              micro_skill_darjah?: number | null;
              original_skill_nama?: string | null;
              original_skill_darjah?: number | null;
              original_mastery_score?: number | null;
            }
          | undefined;
        if (mounted) {
          setInsight(
            row && row.micro_skill_nama
              ? {
                  micro_skill_nama: row.micro_skill_nama,
                  sebab: row.sebab ?? "",
                  tindakan: row.tindakan ?? "",
                  tier: row.tier ?? null,
                  confidence_level: row.confidence_level ?? null,
                  mastery_score: row.mastery_score ?? null,
                  total_attempts: row.total_attempts ?? null,
                  correct_attempts: row.correct_attempts ?? null,
                  micro_skill_darjah: row.micro_skill_darjah ?? null,
                  original_skill_nama: row.original_skill_nama ?? null,
                  original_skill_darjah: row.original_skill_darjah ?? null,
                  original_mastery_score: row.original_mastery_score ?? null,
                }
              : null,
          );
        }

      } catch (e) {
        console.error("[KaliInsightCard] RPC error:", e);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [childUserId, darjahAnak]);

  const badge =
    insight?.confidence_level === "HIGH"
      ? { teks: "🟢 Keyakinan Tinggi", bg: "rgba(255,255,255,0.15)", fg: "#FFEEB3" }
      : insight?.confidence_level === "MEDIUM"
        ? { teks: "🟡 Sedang Dipelajari", bg: "rgba(255,255,255,0.15)", fg: "#FFEEB3" }
        : { teks: "🔵 Data Masih Terhad", bg: "rgba(255,255,255,0.15)", fg: "#ffffff" };

  // Guardrail: jangan trust `tier` membuta — kira badge dari mastery_score sendiri
  const tierBadge = useMemo(() => {
    if (!insight) return null;
    const m = insight.mastery_score;
    if (m == null) {
      return insight.tier === "BLUE"
        ? { teks: "🆕 Kemahiran Baharu", bg: "#3B82F6", fg: "#ffffff" }
        : null;
    }
    if (insight.original_skill_nama && m >= 80)
      return { teks: "🟡 Perlu Semakan Ringkas", bg: "#F59E0B", fg: "#1F2937" };
    if (m < 40) return { teks: "🔴 Perlu Bantuan", bg: "#EF4444", fg: "#ffffff" };
    if (m < 60) return { teks: "🟠 Perlu Diperkukuhkan", bg: "#F97316", fg: "#ffffff" };
    if (m < 80) return { teks: "🟡 Sedang Berkembang", bg: "#F59E0B", fg: "#1F2937" };
    return { teks: "✅ Sudah Dikuasai · Ulang Kaji", bg: "#1B8A5A", fg: "#ffffff" };
  }, [insight]);


  return (
    <div
      className="rounded-2xl border-2 p-5 shadow-card"
      style={{
        backgroundColor: "#013E37",
        borderColor: "#013E37",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-soft"
          style={{ backgroundColor: "#FFEEB3" }}
        >
          <Sparkles className="h-5 w-5 text-brand-deep" />
        </div>
        {!loading && !error && insight && (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ backgroundColor: badge.bg, color: badge.fg }}
          >
            {badge.teks}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-white/70">Memuatkan insight KALI...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-white/70">
          Cadangan KALI belum dapat dijana buat masa ini — cuba semak semula sebentar lagi.
        </p>
      ) : insight ? (
        <>
          <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wide text-white/60">Fokus Semasa</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="font-display text-xl font-extrabold text-white">
              {insight.micro_skill_nama}
              {insight.micro_skill_darjah ? (
                <span className="ml-1 text-sm font-bold text-white/70">(Darjah {insight.micro_skill_darjah})</span>
              ) : null}
            </p>

            {tierBadge && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: tierBadge.bg, color: tierBadge.fg }}
              >
                {tierBadge.teks}
              </span>
            )}
          </div>

          <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }} />

          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/60">
            Kenapa KALI Pilih Ini
          </p>
          <p className="mt-1 text-sm text-white/85">{insight.sebab}</p>
          {insight.mastery_score != null && (
            <p className="mt-1 text-xs text-white/60">
              {insight.original_skill_nama
                ? `Penguasaan asas Darjah ${insight.micro_skill_darjah}: ${insight.mastery_score}% · ${labelMasteryBand(insight.mastery_score)}`
                : `Tahap ${insight.micro_skill_nama}${insight.micro_skill_darjah ? ` (Darjah ${insight.micro_skill_darjah})` : ""}: ${insight.mastery_score}% · ${labelMasteryBand(insight.mastery_score)}`}
            </p>
          )}



          <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }} />

          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/60">Tindakan KALI</p>
          <p className="mt-1 text-sm text-white/85">{insight.tindakan}</p>

          <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }} />

          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/60">Cadangan KALI</p>
          <p className="mt-1 text-sm text-white/85">
            Galakkan {namaAnak} melengkapkan satu lagi sesi Belajar Bersama KALI hari ini.
          </p>
          <button
            type="button"
            onClick={salinArahanKali}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-butter px-3.5 py-1.5 text-xs font-extrabold text-brand-butter-foreground shadow-soft transition hover:opacity-90"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Disalin!" : "Salin Arahan untuk Anak"}
          </button>

          <p className="mt-3 text-[11px] italic text-white/50">
            Cadangan ini dijana berdasarkan jawapan sebenar {namaAnak} dan dikemas kini secara automatik setiap kali dia
            buat latihan.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-white/70">
          KALI sedang mula mengenali corak pembelajaran {namaAnak} — teruskan guna Kuiz atau Latih Tubi supaya cadangan
          akan jadi lebih tepat!
        </p>
      )}
    </div>
  );
}

function KaliUpdateCard({
  childProfileId,
  childDarjah,
  namaAnak,
}: {
  childProfileId: string;
  childDarjah: string;
  namaAnak: string;
}) {
  const [status, setStatus] = useState<"loading" | "belum" | "selesai">("loading");
  const [hasil, setHasil] = useState<{
    betul: number;
    jumlahMenguasai: number;
    jumlahDiperkukuh: number;
    bocorNama: string | null;
    bocorGejala: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function salinArahanMula() {
    try {
      await navigator.clipboard.writeText(
        `📋 Minta ${namaAnak} log masuk sendiri untuk mula sesi pertama percuma dengan Belajar Bersama KALI.`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  useEffect(() => {
    let mounted = true;
    supabase
      .from("child_profiles")
      .select(
        "kali_diagnostic_completed_at, kali_diagnostic_betul, kali_diagnostic_jumlah_menguasai, kali_diagnostic_jumlah_diperkukuh, kali_diagnostic_bocor_nama, kali_diagnostic_bocor_gejala",
      )
      .eq("id", childProfileId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data?.kali_diagnostic_completed_at) {
          setHasil({
            betul: data.kali_diagnostic_betul ?? 0,
            jumlahMenguasai: data.kali_diagnostic_jumlah_menguasai ?? 0,
            jumlahDiperkukuh: data.kali_diagnostic_jumlah_diperkukuh ?? 0,
            bocorNama: data.kali_diagnostic_bocor_nama ?? null,
            bocorGejala: data.kali_diagnostic_bocor_gejala ?? null,
          });
          setStatus("selesai");
        } else {
          setStatus("belum");
        }
      });
    return () => {
      mounted = false;
    };
  }, [childProfileId]);

  async function bukaAnalisis() {
    const url = await laluanCheckout(childDarjah);
    if (typeof window !== "undefined") window.location.href = url;
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#013E37",
    borderColor: "#013E37",
  };

  if (status === "loading") {
    return (
      <div className="rounded-2xl border-2 p-5 shadow-card" style={cardStyle}>
        <p className="text-sm text-white/70">Memuatkan status KALI...</p>
      </div>
    );
  }

  if (status === "belum") {
    return (
      <div className="rounded-2xl border-2 p-5 shadow-card" style={cardStyle}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-soft"
            style={{ backgroundColor: "#FFEEB3" }}
          >
            <Sparkles className="h-5 w-5 text-brand-deep" />
          </div>
          <p className="font-display text-lg font-extrabold text-white">KALI baru mula kenal {namaAnak}</p>
        </div>
        <p className="mt-3 text-sm text-white/85">
          {namaAnak} belum cuba sesi pertama dengan KALI. Sesi pertama percuma — KALI akan mula belajar cara{" "}
          {namaAnak} berfikir dan di mana dia perlukan bantuan.
        </p>
        <button
          type="button"
          onClick={salinArahanMula}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-butter px-3.5 py-1.5 text-xs font-extrabold text-brand-butter-foreground shadow-soft transition hover:opacity-90"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Disalin!" : "Salin Arahan untuk Anak"}
        </button>
      </div>
    );
  }

  const bakiDiperkukuh = hasil ? Math.max(0, hasil.jumlahDiperkukuh - (hasil.bocorNama ? 1 : 0)) : 0;

  return (
    <div className="rounded-2xl border-2 p-5 shadow-card" style={cardStyle}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-soft"
          style={{ backgroundColor: "#FFEEB3" }}
        >
          <Sparkles className="h-5 w-5 text-brand-deep" />
        </div>
        <p className="font-display text-lg font-extrabold text-white">
          KALI dah kenal {namaAnak} dengan lebih jelas
        </p>
      </div>

      {hasil && (
        <p className="mt-3 text-sm text-white/85">
          {namaAnak} jawab {hasil.betul}/10 betul dalam sesi pertama — 🟢 {hasil.jumlahMenguasai} kemahiran dikuasai,
          🔴 {hasil.jumlahDiperkukuh} kemahiran perlu diperkukuh.
        </p>
      )}

      {hasil?.bocorNama && (
        <>
          <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }} />
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/60">KALI Mengesan</p>
          <p className="mt-1 text-sm text-white/85">
            <span className="font-bold text-white">{hasil.bocorNama}</span>
            {hasil.bocorGejala ? ` — ${hasil.bocorGejala}` : ""}
          </p>
        </>
      )}

      <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <p className="text-sm text-white/85">
        🔒 Sebab kesilapan, kemahiran mana diutamakan, latihan yang dicadangkan, dan pelan pembelajaran seterusnya
        tersedia dalam Belajar Bersama KALI penuh
        {bakiDiperkukuh > 0 ? ` (termasuk ${bakiDiperkukuh} kemahiran lain yang belum dibuka)` : ""}.
      </p>

      <button
        onClick={bukaAnalisis}
        className="mt-4 rounded-full bg-brand-butter px-5 py-2.5 font-display text-sm font-extrabold text-brand-butter-foreground shadow-soft transition hover:opacity-90"
      >
        Buka Analisis Penuh & Belajar Bersama KALI
      </button>
    </div>
  );
}

function SeksyenMpt4({ keputusan }: { keputusan: Mpt4KeputusanRow[] }) {
  if (keputusan.length === 0) {
    return (
      <div
        className="rounded-3xl border-2 p-6 text-center shadow-card"
        style={{
          background: "linear-gradient(135deg, #FFFCF0 0%, #FFFEFB 60%, #FFF8E5 100%)",
          borderColor: "var(--brand-butter)",
        }}
      >
        <Trophy className="mx-auto mb-2 h-8 w-8 text-brand-deep" />
        <p className="font-display text-sm font-extrabold text-foreground">
          Belum ada keputusan Percubaan MPT4 lagi
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Keputusan akan muncul di sini selepas anak menyiapkan set percubaan.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border-2 p-4 shadow-card"
      style={{
        background: "linear-gradient(135deg, #FFFCF0 0%, #FFFEFB 60%, #FFF8E5 100%)",
        borderColor: "var(--brand-butter)",
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {keputusan.map((k) => {
          const markah = k.markah_keseluruhan ?? 0;
          const penuh = k.markah_penuh ?? k.mpt4_set?.jumlah_markah ?? 0;
          const peratus = penuh > 0 ? Math.round((markah / penuh) * 100) : 0;
          const warna = peratus >= 70 ? STAT_HIJAU : peratus >= 50 ? STAT_EMAS : STAT_OREN;
          const tarikh = k.completed_at ? formatTarikh(k.completed_at) : "—";
          const subjek = k.mpt4_set?.subjek ?? "—";
          const tajuk = k.mpt4_set?.tajuk ?? (k.mpt4_set ? `Set ${k.mpt4_set.nombor_set}` : "");
          return (
            <div
              key={k.id}
              className="rounded-2xl bg-card p-4 shadow-soft"
              style={{ border: `1.5px solid ${warna}55` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-extrabold text-foreground truncate">
                    {subjek}
                  </p>
                  {tajuk && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{tajuk}</p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-soft"
                  style={{ background: `linear-gradient(135deg, ${warna}, ${warna}cc)` }}
                >
                  {peratus}%
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="font-display text-2xl font-extrabold" style={{ color: warna }}>
                  {markah}
                  <span className="text-sm font-bold text-muted-foreground">/{penuh || "—"}</span>
                </p>
                <p className="text-xs text-muted-foreground">{tarikh}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}




function Seksyen({ tajuk, ikon, children }: { tajuk: string; ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-soft"
          style={{ background: `linear-gradient(135deg, ${HIJAU}, #2AAE72)` }}
        >
          {ikon}
        </span>
        <h2 className="font-display text-xl font-extrabold text-foreground">{tajuk}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  nilai,
  icon,
  warna,
}: {
  label: string;
  nilai: string | number;
  icon: React.ReactNode;
  warna: string;
  light?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 p-4 shadow-card"
      style={{
        background: `linear-gradient(135deg, ${warna}2e 0%, #ffffff 90%)`,
        borderColor: `${warna}66`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
          style={{ background: `linear-gradient(135deg, ${warna}, ${warna}cc)` }}
        >
          {icon}
        </div>
        <span className="text-xs font-extrabold text-foreground/80">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold" style={{ color: warna }}>{nilai}</p>
    </div>
  );
}

function KadSubjekTrend({
  label,
  sj,
  warna,
  topikLemah,
  namaAnak,
}: {
  label: string;
  sj: { subjek: string; purata: number; bil: number } | null;
  warna: string;
  topikLemah?: { topik: string; purata: number; darjah: string }[];
  namaAnak?: string;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const meta = sj ? SUBJEK_LIST.find((s) => s.id === sj.subjek) : null;

  async function salinArahan(topik: string, key: string) {
    const teks = `📋 Minta ${namaAnak ?? "anak"} log masuk sendiri → ${meta?.title ?? sj?.subjek ?? ""} → Latih Tubi → topik "${topik}"`;
    try {
      await navigator.clipboard.writeText(teks);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      // noop
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 shadow-card"
      style={{
        background: `linear-gradient(135deg, ${warna}1f 0%, #ffffff 90%)`,
        border: `3px solid ${warna}80`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft text-lg"
          style={{ background: `linear-gradient(135deg, ${warna}, ${warna}cc)` }}
        >
          {label.includes("Terkuat") ? "💪" : "⚠️"}
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: warna }}>{label}</p>
      </div>
      {meta && sj ? (
        <>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{meta.title}</p>
          <p className="text-xs text-muted-foreground">
            Purata {sj.purata}% • {sj.bil} aktiviti
          </p>
          {topikLemah && topikLemah.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Topik Lemah
              </p>
              {topikLemah.map((t) => {
                const key = `${sj.subjek}-${t.topik}`;
                return (
                  <div
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${warna}14` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{t.topik}</p>
                      <p className="text-xs font-extrabold" style={{ color: warna }}>
                        {t.purata}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] text-muted-foreground">
                        📋 Minta {namaAnak ?? "anak"} log masuk sendiri → {meta.title} → Latih Tubi → topik "{t.topik}"
                      </p>
                      <button
                        onClick={() => salinArahan(t.topik, key)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-white shadow-soft transition hover:opacity-90"
                        style={{ backgroundColor: warna }}
                        title="Salin arahan ke papan keratan"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedKey === key ? "Disalin!" : "Salin"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Belum cukup data</p>
      )}
    </div>
  );
}

const NEGERI_LIST = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "WP Kuala Lumpur", "WP Labuan", "WP Putrajaya",
];

function MaklumatSaya() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [nama, setNama] = useState("");
  const [telefon, setTelefon] = useState("");
  const [negeri, setNegeri] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftNama, setDraftNama] = useState("");
  const [draftTelefon, setDraftTelefon] = useState("");
  const [draftNegeri, setDraftNegeri] = useState("");

  useEffect(() => {
    if (!user || loaded) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nama_penuh, no_telefon, negeri")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setNama((data as { nama_penuh: string | null }).nama_penuh ?? "");
        setTelefon((data as { no_telefon: string | null }).no_telefon ?? "");
        setNegeri((data as { negeri: string | null }).negeri ?? "");
      }
      setLoaded(true);
    })();
  }, [user, loaded]);

  if (profileLoading || !profile) return null;
  if (!profile.darjah_akses || profile.darjah_akses.length === 0) return null;

  const belumDiisi = !nama.trim() && !telefon.trim() && !negeri.trim();

  function masukEditMode() {
    setDraftNama(nama);
    setDraftTelefon(telefon);
    setDraftNegeri(negeri);
    setIsEditing(true);
  }

  async function handleSimpan() {
    if (!user) {
      toast.error("Sila log masuk semula");
      return;
    }
    if (!draftNama.trim()) return toast.error("Sila isi nama penuh");
    const tel = draftTelefon.replace(/\D/g, "");
    if (tel.length < 10 || tel.length > 11) return toast.error("No telefon mesti 10-11 digit");
    if (!draftNegeri) return toast.error("Sila pilih negeri");
    setSaving(true);
    try {
      const payload = { nama_penuh: draftNama.trim(), no_telefon: tel, negeri: draftNegeri };
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("id, nama_penuh, no_telefon, negeri");
      if (error) {
        toast.error(`Gagal simpan: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        toast.error("Tiada rekod dikemaskini — semak RLS/profil.");
        return;
      }
      setNama(draftNama.trim());
      setTelefon(tel);
      setNegeri(draftNegeri);
      setIsEditing(false);
      toast.success("Maklumat berjaya disimpan! ✓", { duration: 4000 });
    } catch (e) {
      console.error("[MaklumatSaya] exception", e);
      toast.error(`Ralat: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function handleBatal() {
    setIsEditing(false);
  }

  return (
    <section className="mt-6 rounded-3xl bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Maklumat Saya</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Untuk komunikasi & rekod akaun anda.
          </p>
        </div>
        {!isEditing && !belumDiisi && (
          <button
            onClick={masukEditMode}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-border px-3 py-1.5 text-xs font-extrabold text-muted-foreground hover:bg-muted transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {belumDiisi && !isEditing ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Belum diisi</p>
          <button
            onClick={masukEditMode}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-xs font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
            style={{ backgroundColor: HIJAU }}
          >
            Lengkapkan Sekarang
          </button>
        </div>
      ) : isEditing ? (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-foreground">Nama Penuh</span>
              <input
                type="text"
                value={draftNama}
                onChange={(e) => setDraftNama(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2"
                placeholder="cth: Ahmad bin Ali"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-foreground">No Telefon</span>
              <input
                type="tel"
                inputMode="numeric"
                value={draftTelefon}
                onChange={(e) => setDraftTelefon(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="rounded-xl border border-input bg-background px-3 py-2"
                placeholder="cth: 0123456789"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-foreground">Negeri</span>
              <select
                value={draftNegeri}
                onChange={(e) => setDraftNegeri(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2"
              >
                <option value="">— Pilih negeri —</option>
                {NEGERI_LIST.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleBatal}
              className="rounded-full border-2 border-border bg-background px-5 py-2.5 font-display text-sm font-extrabold text-muted-foreground hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              onClick={handleSimpan}
              disabled={saving}
              className="rounded-full px-5 py-2.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60 transition hover:-translate-y-0.5"
              style={{ backgroundColor: HIJAU }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs font-extrabold text-muted-foreground">Nama Penuh</p>
            <p className="mt-1 text-sm font-bold text-foreground">{nama.trim() || "—"}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs font-extrabold text-muted-foreground">No Telefon</p>
            <p className="mt-1 text-sm font-bold text-foreground">{telefon || "—"}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs font-extrabold text-muted-foreground">Negeri</p>
            <p className="mt-1 text-sm font-bold text-foreground">{negeri || "—"}</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// PERMINTAAN TEBUSAN HADIAH (anak minta → parent sahkan)
// ============================================================
interface MintaTebusRow {
  id: string;
  child_user_id: string;
  hadiah_id: string | null;
  nama_hadiah_snapshot: string;
  kos_star: number;
  created_at: string;
  imej_url?: string | null;
  namaAnak: string;
  alamatDefault: string;
  bakiStar: number;
}

function PermintaanTebusanSeksyen({ anakList, parentUserId }: { anakList: ChildProfile[]; parentUserId?: string }) {
  const [rows, setRows] = useState<MintaTebusRow[]>([]);
  const [pilih, setPilih] = useState<MintaTebusRow | null>(null);
  const [alamat, setAlamat] = useState("");
  const [telefon, setTelefon] = useState("");
  const [ringkasan, setRingkasan] = useState<{ soalan_betul: number; sesi_kali: number; hari_aktif: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<MintaTebusRow | null>(null);

  const anakIds = useMemo(
    () => anakList.map((a) => a.child_user_id).filter((v): v is string => !!v),
    [anakList],
  );

  const muat = useCallback(async () => {
    if (anakIds.length === 0) {
      setRows([]);
      return;
    }
    const [{ data, error }, { data: pointsData, error: pointsError }] = await Promise.all([
      supabase
        .from("hadiah_tebusan")
        .select("id, child_user_id, hadiah_id, nama_hadiah_snapshot, kos_star, created_at, hadiah_katalog(imej_url)")
        .eq("status", "menunggu_parent")
        .in("child_user_id", anakIds)
        .order("created_at", { ascending: false }),
      supabase.from("user_points").select("user_id, jumlah_mata").in("user_id", anakIds),
    ]);
    if (error || pointsError) {
      console.warn("permintaan tebusan gagal:", error?.message || pointsError?.message);
      setRows([]);
      return;
    }
    const pointsMap = new Map<string, number>();
    (pointsData ?? []).forEach((p) => {
      if (p.user_id && typeof p.jumlah_mata === "number") {
        pointsMap.set(p.user_id, p.jumlah_mata);
      }
    });
    const list = ((data ?? []) as unknown as Array<
      Omit<MintaTebusRow, "imej_url" | "namaAnak" | "alamatDefault" | "bakiStar"> & {
        hadiah_katalog?: { imej_url: string | null } | null;
      }
    >).map((r) => {
      const anak = anakList.find((a) => a.child_user_id === r.child_user_id);
      return {
        ...r,
        imej_url: r.hadiah_katalog?.imej_url ?? null,
        namaAnak: anak?.nama ?? "Anak",
        alamatDefault: ((anak as unknown as { alamat_default?: string | null })?.alamat_default ?? "").trim(),
        bakiStar: pointsMap.get(r.child_user_id) ?? 0,
      } as MintaTebusRow;
    });
    setRows(list);
  }, [anakIds, anakList]);

  useEffect(() => {
    void muat();
  }, [muat]);

  // Realtime + polling fallback supaya parent nampak perubahan walaupun anak batal dari device lain
  useEffect(() => {
    if (anakIds.length === 0) return;
    const channel = supabase
      .channel("hadiah_tebusan_parent")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hadiah_tebusan" },
        () => {
          void muat();
        },
      )
      .subscribe();
    const interval = setInterval(() => {
      void muat();
    }, 15000);
    return () => {
      clearInterval(interval);
      void channel.unsubscribe();
    };
  }, [anakIds, muat]);

  async function bukaDialog(r: MintaTebusRow) {
    setPilih(r);
    setAlamat(r.alamatDefault);
    setTelefon("");
    setRingkasan(null);
    const [{ data }, { data: profil }] = await Promise.all([
      supabase.rpc("ringkasan_pembelajaran_anak" as never, {
        p_child_user_id: r.child_user_id,
      } as never),
      parentUserId
        ? supabase.from("profiles").select("no_telefon").eq("id", parentUserId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setRingkasan(row as { soalan_betul: number; sesi_kali: number; hari_aktif: number });
    const tel = (profil as { no_telefon?: string | null } | null)?.no_telefon ?? "";
    setTelefon(tel);
  }

  async function sahkan() {
    if (!pilih || !alamat.trim() || !telefon.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("sahkan_tebusan_parent" as never, {
      p_tebusan_id: pilih.id,
      p_alamat: alamat.trim(),
      p_telefon: telefon.trim(),
    } as never);
    setBusy(false);
    if (error) {
      toast.error(error.message || "Gagal sahkan tebusan");
      return;
    }
    const approved = pilih;
    setPilih(null);
    setSuccess(approved);
    void muat();
  }

  async function batal(id: string) {
    setBusy(true);
    const { error } = await supabase.rpc("batal_minta_tebus" as never, { p_tebusan_id: id } as never);
    setBusy(false);
    if (error) {
      toast.error(error.message || "Gagal batalkan permintaan");
      return;
    }
    toast.success("Permintaan dibatalkan.");
    setPilih(null);
    void muat();
  }

  if (rows.length === 0) return null;

  return (
    <section className="mt-6 flex flex-col gap-3">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-soft"
          style={{ background: "#FFF9E8", border: "2px solid #F5C86B" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#8A6100" }}>
                Permintaan Tebusan · Menunggu Pengesahan
              </p>
              <p className="font-display text-sm font-extrabold text-foreground">
                {r.namaAnak} nak tebus hadiah!
              </p>
              <p className="text-xs text-muted-foreground">
                {r.namaAnak} memilih: <b>{r.nama_hadiah_snapshot}</b> · ⭐ {r.kos_star} Star
              </p>
              <p className="text-[11px] font-semibold" style={{ color: "#8A6100" }}>
                Baki {r.namaAnak}: ⭐ {r.bakiStar}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => bukaDialog(r)}
            className="rounded-xl px-4 py-2 font-display text-sm font-extrabold text-white"
            style={{ background: HIJAU }}
          >
            Semak & Sahkan
          </button>
        </div>
      ))}

      <Dialog open={!!pilih} onOpenChange={(o) => !o && setPilih(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sahkan Tebusan Hadiah</DialogTitle>
          </DialogHeader>
          {pilih && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {pilih.imej_url ? (
                  <img
                    src={pilih.imej_url}
                    alt={pilih.nama_hadiah_snapshot}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted text-2xl">🎁</div>
                )}
                <div>
                  <p className="font-display text-base font-extrabold text-foreground">
                    {pilih.nama_hadiah_snapshot}
                  </p>
                  <p className="text-sm text-muted-foreground">⭐ {pilih.kos_star} Star</p>
                  <p className="text-[11px] font-semibold" style={{ color: "#8A6100" }}>
                    Baki {pilih.namaAnak}: ⭐ {pilih.bakiStar}
                    {pilih.bakiStar < pilih.kos_star ? " (tidak cukup — admin akan tahan)" : ""}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm text-foreground">
                  {pilih.namaAnak} mengumpul {pilih.kos_star}⭐ melalui aktiviti pembelajaran di Kalifah.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ringkasan
                    ? `${ringkasan.soalan_betul} soalan betul · ${ringkasan.sesi_kali} sesi KALI · ${ringkasan.hari_aktif} hari aktif`
                    : "Memuatkan ringkasan pembelajaran…"}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-bold text-foreground">No. Telefon</p>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value.replace(/\D/g, ""))}
                  placeholder="0123456789"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold text-foreground">Alamat Penghantaran</p>
                <Textarea
                  rows={4}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Alamat penuh untuk penghantaran hadiah…"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => batal(pilih.id)}
                  disabled={busy}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  Batal Permintaan
                </button>
                <button
                  type="button"
                  onClick={sahkan}
                  disabled={busy || !alamat.trim() || !telefon.trim()}
                  className="rounded-xl px-4 py-2 font-display text-sm font-extrabold text-white disabled:opacity-50"
                  style={{ background: HIJAU }}
                >
                  {busy ? "Memproses…" : "Sahkan Tebusan"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Berjaya Menebus!</DialogTitle>
          </DialogHeader>
          {success && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">🎁</div>
              <p className="text-sm text-foreground">
                <b>{success.namaAnak}</b> berjaya menebus hadiah menggunakan{" "}
                <b>⭐ {success.kos_star} Star</b> yang dikumpul melalui pembelajaran.
              </p>
              <p className="text-xs text-muted-foreground">
                Admin akan proses penghantaran hadiah <b>{success.nama_hadiah_snapshot}</b> secepat mungkin.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="rounded-xl px-6 py-2 font-display text-sm font-extrabold text-white"
                style={{ background: HIJAU }}
              >
                Okey!
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
