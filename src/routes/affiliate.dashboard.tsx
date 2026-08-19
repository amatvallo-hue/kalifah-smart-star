import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PAKEJ_LIST } from "@/lib/curriculum";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Copy, Loader2, MousePointerClick, ShoppingBag, Coins, Share2, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/affiliate/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Affiliate — Kalifah.my" }] }),
  ssr: false,
  component: AffiliateDashboardPage,
});

interface Affiliate {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  custom_ref_code?: string;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
  komisyen_rate: number;
  avatar_url?: string | null;
}

interface Jualan {
  id: string;
  jumlah_bayar: number;
  komisyen: number;
  status_bayar: string;
  produk: string;
  created_at: string;
}

interface Challenge {
  id: string;
  bulan: number;
  tahun: number;
  target_jualan: number;
  bonus_rm: number;
  aktif: boolean;
}

interface KempenFamily {
  klaim_id: string;
  nama_anak: string;
  darjah: number;
  status: "claimed" | "active" | "at_risk";
  boleh_diganti: boolean;
  claimed_at: string;
  hari_aktif: number;
  sesi: number;
  kali_sesi: number;
}

type KempenSumber = {
  sumber: string | null;
  kempen: string | null;
  klik: number;
  daftar: number;
  claim: number;
  aktif: number;
};

type KempenTraffic = {
  klik_kempen: number;
  daftar_dari_link: number;
  claim_tajaan: number;
  nota: string;
};

type KempenFunnel = {
  klik: number;
  daftar: number;
  claim: number;
  mula_belajar: number;
  aktif: number;
  renew: number;
};

type KempenAffDash = {
  ok: boolean;
  ada_kempen: boolean;
  kempen?: { id: string; nama: string; slug: string; tarikh_mula?: string };
  traffic?: KempenTraffic;
  funnel?: KempenFunnel;
  sumber?: KempenSumber[];
  alokasi?: {
    slot_kuota: number;
    slot_digunakan: number;
    slot_kosong: number;
    telah_mula: number;
    aktif: number;
    at_risk: number;
    boleh_diganti: number;
  };
  families?: KempenFamily[];
};


function rm(ringgit: number) {
  return `RM ${(ringgit ?? 0).toFixed(2)}`;
}

function unslug(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function namaSumber(slug: string): string {
  const map: Record<string, string> = {
    threads: "Threads",
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    "status-whatsapp": "Status WhatsApp",
  };
  return map[slug] ?? unslug(slug);
}

function labelSumberBaris(s: KempenSumber): string {
  if (s.sumber && s.kempen) {
    return `${namaSumber(s.sumber)} / ${unslug(s.kempen)}`;
  }
  if (s.sumber) {
    return namaSumber(s.sumber);
  }
  if (s.kempen) {
    return unslug(s.kempen);
  }
  return "Tanpa Label";
}

const AYAT_HERO = [
  "Setiap ibu bapa yang anda bantu bermula dengan satu perkongsian hari ini.",
  "Misi anda hari ini: Kongsi kepada sekurang-kurangnya 10 ibu bapa.",
];

const NAMA_BULAN = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

function AffiliateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [aff, setAff] = useState<Affiliate | null>(null);
  const [jualan, setJualan] = useState<Jualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCubaKali, setCopiedCubaKali] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  const [sumberPilihan, setSumberPilihan] = useState("Threads");
  const [namaPost, setNamaPost] = useState("");
  const [sumberCustom, setSumberCustom] = useState("");
  const [copiedSourceLink, setCopiedSourceLink] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [jualanBulanIni, setJualanBulanIni] = useState<number>(0);
  const [metrikBulan, setMetrikBulan] = useState<{ klik: number; jualan: number; komisen: number }>({ klik: 0, jualan: 0, komisen: 0 });
  const [metrikBulanLepas, setMetrikBulanLepas] = useState<{ jualan: number; komisen: number }>({ jualan: 0, komisen: 0 });
  const [tipHariIni, setTipHariIni] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [kempenData, setKempenData] = useState<KempenAffDash | null>(null);
  const [kempenExpanded, setKempenExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !aff) return;
    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("affiliate-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("affiliate-avatars").getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("affiliates")
        .update({ avatar_url: publicUrl })
        .eq("id", aff.id);
      if (updErr) throw updErr;
      setAff({ ...aff, avatar_url: publicUrl });
      toast.success("Foto profil dikemaskini");
    } catch (err) {
      console.error("[avatar upload]", err);
      toast.error("Gagal muat naik foto. Cuba lagi.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data: a } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!a) {
        setLoading(false);
        return;
      }
      setAff(a as Affiliate);

      // Kempen tajaan (berasingan daripada funnel jualan)
      const { data: kd } = await supabase.rpc("kempen_affiliate_dashboard");
      if (kd && (kd as unknown as KempenAffDash).ok && (kd as unknown as KempenAffDash).ada_kempen) {
        setKempenData(kd as unknown as KempenAffDash);
      }


      // Tips jual hari ini (deterministic by day)
      const { data: tipsData } = await supabase.from("affiliate_tips").select("id, teks");
      if (tipsData && tipsData.length > 0) {
        const hariKeBerapa = Math.floor(Date.now() / 86400000);
        const index = hariKeBerapa % tipsData.length;
        setTipHariIni(tipsData[index].teks);
      }

      const { data: j } = await supabase
        .from("affiliate_jualan")
        .select("id, jumlah_bayar, komisyen, status_bayar, produk, created_at")
        .eq("affiliate_id", (a as Affiliate).id)
        .order("created_at", { ascending: false })
        .limit(50);
      setJualan((j as Jualan[]) ?? []);

      // Metrik bulan ini (shared: challenge + KPI cards)
      const now = new Date();
      const bulan = now.getMonth() + 1;
      const tahun = now.getFullYear();
      const firstDay = new Date(tahun, bulan - 1, 1).toISOString();

      // Jualan + komisen bulan ini
      const { data: jBulan } = await supabase
        .from("affiliate_jualan")
        .select("komisyen")
        .eq("affiliate_id", (a as Affiliate).id)
        .gte("created_at", firstDay);
      const jualanCount = jBulan?.length ?? 0;
      const komisenSum = (jBulan ?? []).reduce(
        (acc, row: { komisyen: number | null }) => acc + Number(row.komisyen ?? 0),
        0,
      );

      // Klik bulan ini
      const { count: klikCount } = await supabase
        .from("affiliate_klik_log")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", (a as Affiliate).id)
        .gte("created_at", firstDay);

      // Metrik bulan lepas (untuk trend arrow)
      const firstDayLepas = new Date(tahun, bulan - 2, 1).toISOString();
      const { data: jBulanLepas } = await supabase
        .from("affiliate_jualan")
        .select("komisyen")
        .eq("affiliate_id", (a as Affiliate).id)
        .gte("created_at", firstDayLepas)
        .lt("created_at", firstDay);
      const jualanLepasCount = jBulanLepas?.length ?? 0;
      const komisenLepasSum = (jBulanLepas ?? []).reduce(
        (acc, row: { komisyen: number | null }) => acc + Number(row.komisyen ?? 0),
        0,
      );

      setMetrikBulan({
        klik: klikCount ?? 0,
        jualan: jualanCount,
        komisen: komisenSum,
      });
      setMetrikBulanLepas({ jualan: jualanLepasCount, komisen: komisenLepasSum });
      setJualanBulanIni(jualanCount);

      // Challenge bulan ini
      const { data: ch } = await supabase
        .from("challenge_bulanan")
        .select("*")
        .eq("aktif", true)
        .eq("bulan", bulan)
        .eq("tahun", tahun)
        .maybeSingle();
      if (ch) {
        setChallenge(ch as Challenge);
      }

      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const refLink = useMemo(() => {
    if (!aff) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
    return `${origin}/daftar?ref=${aff.custom_ref_code ?? aff.ref_code}`;
  }, [aff]);

  const cubaKaliLink = useMemo(() => {
    if (!aff) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
    return `${origin}/cuba-kali?ref=${aff.custom_ref_code ?? aff.ref_code}`;
  }, [aff]);

  const baki = aff ? (aff.total_komisyen ?? 0) - (aff.total_dibayar ?? 0) : 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function copyCubaKaliLink() {
    try {
      await navigator.clipboard.writeText(cubaKaliLink);
      setCopiedCubaKali(true);
      setTimeout(() => setCopiedCubaKali(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const sourceLink = useMemo(() => {
    if (!aff) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
    const base = `${origin}/daftar?ref=${aff.custom_ref_code ?? aff.ref_code}`;
    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/-$/g, "");
    const sumber = sumberPilihan === "Lain-lain" ? sumberCustom : sumberPilihan;
    const sourceSlug = slugify(sumber);
    const campaignSlug = slugify(namaPost);
    if (!sourceSlug && !campaignSlug) return base;
    if (!campaignSlug) return `${base}&utm_source=${sourceSlug}`;
    return `${base}&utm_source=${sourceSlug}&utm_campaign=${campaignSlug}`;
  }, [aff, sumberPilihan, sumberCustom, namaPost]);

  async function copySourceLink() {
    try {
      await navigator.clipboard.writeText(sourceLink);
      setCopiedSourceLink(true);
      setTimeout(() => setCopiedSourceLink(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function copyCaption(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(key);
      setTimeout(() => setCopiedCaption((c) => (c === key ? null : c)), 2500);
    } catch {
      /* ignore */
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!aff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="font-display text-2xl font-extrabold">
            Anda belum berdaftar sebagai affiliate
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sertai program affiliate Kalifah.my dan dapatkan komisyen 30% bagi
            setiap jualan.
          </p>
          <Link
            to="/affiliate/daftar"
            className="mt-6 inline-block rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Hero affiliate */}
        <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="group relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative block h-16 w-16 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/20 shadow-soft transition hover:border-primary/60"
                  aria-label="Tukar foto profil"
                >
                  {aff.avatar_url ? (
                    <img
                      src={aff.avatar_url}
                      alt={aff.nama}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold text-primary">
                      {aff.nama.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </span>
                  {uploadingAvatar && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  ⭐ Affiliate Rasmi Kalifah.my
                </div>
                <h1 className="mt-3 font-display text-3xl font-extrabold">
                  Selamat Datang, {aff.nama.split(" ")[0]} 👋
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Dashboard Affiliate Kalifah.my
                </p>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  {AYAT_HERO[Math.floor(Date.now() / 86400000) % AYAT_HERO.length]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-3">
              <div className="text-3xl font-extrabold text-gold-foreground">
                {Math.round((aff.komisyen_rate ?? 0) * 100)}%
              </div>
              <div className="text-xs font-bold leading-tight text-gold-foreground/80">
                Kadar
                <br />
                Komisen
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
            <p className="font-display text-lg font-extrabold text-amber-900">
              💰 Jika anda berjaya jual 1 langganan hari ini, anda akan dapat
              RM
              {(
                (PAKEJ_LIST.find((p) => p.id === "satu")?.jumlahBayar ?? 0) *
                (aff.komisyen_rate ?? 0)
              ).toFixed(2)}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-display font-extrabold text-primary-foreground shadow-soft hover:opacity-90"
            >
              📋 Copy Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Assalamualaikum! 👋 Risau anak tak belajar bila kita tak tengok? Di Kalifah.my, anak buat latih tubi sendiri & ibu bapa boleh pantau progress bila-bila masa 📊 Tenang hati, anak pun seronok belajar! Darjah 1-6 | 32,000+ soalan. Cuba percuma: ${refLink}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-display font-extrabold text-white shadow-soft hover:opacity-90"
            >
              💬 Share WhatsApp
            </a>
          </div>
        </div>

        {/* KPI Bulan Ini */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Coins className="h-5 w-5" />}
            label="Komisen Bulan Ini"
            value={rm(metrikBulan.komisen)}
            emptyText={metrikBulan.komisen === 0 ? "Tiada komisen bulan ini." : undefined}
            subtext={`Jumlah Keseluruhan: ${rm(aff.total_komisyen)}`}
            trend={
              metrikBulan.komisen === 0
                ? undefined
                : metrikBulanLepas.komisen === 0
                  ? { arah: "naik", teks: "🎉 Komisen pertama bulan ini!" }
                  : metrikBulan.komisen > metrikBulanLepas.komisen
                    ? { arah: "naik", teks: `↑ RM${Math.abs(metrikBulan.komisen - metrikBulanLepas.komisen).toFixed(2)} daripada bulan lepas` }
                    : metrikBulan.komisen < metrikBulanLepas.komisen
                      ? { arah: "turun", teks: `↓ RM${Math.abs(metrikBulan.komisen - metrikBulanLepas.komisen).toFixed(2)} daripada bulan lepas` }
                      : { arah: "sama", teks: "Sama macam bulan lepas" }
            }
            highlight
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Jualan Bulan Ini"
            value={String(metrikBulan.jualan)}
            emptyText={metrikBulan.jualan === 0 ? "Tiada jualan bulan ini." : undefined}
            subtext={`Jumlah Keseluruhan: ${aff.total_jualan}`}
            trend={
              metrikBulan.jualan === 0
                ? undefined
                : metrikBulanLepas.jualan === 0
                  ? { arah: "naik", teks: "🎉 Jualan pertama bulan ini!" }
                  : metrikBulan.jualan > metrikBulanLepas.jualan
                    ? { arah: "naik", teks: `↑ +${Math.abs(metrikBulan.jualan - metrikBulanLepas.jualan)} jualan berbanding bulan lepas` }
                    : metrikBulan.jualan < metrikBulanLepas.jualan
                      ? { arah: "turun", teks: `↓ -${Math.abs(metrikBulan.jualan - metrikBulanLepas.jualan)} jualan berbanding bulan lepas` }
                      : { arah: "sama", teks: "Sama macam bulan lepas" }
            }
          />
          <StatCard
            icon={<MousePointerClick className="h-5 w-5" />}
            label="Klik Bulan Ini"
            value={String(metrikBulan.klik)}
            subtext={`Jumlah Keseluruhan: ${aff.total_klik}`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Conversion Bulan Ini"
            value={
              metrikBulan.klik > 0
                ? ((metrikBulan.jualan / metrikBulan.klik) * 100).toFixed(1) + "%"
                : "0%"
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div>
            Baki Belum Dibayar:{" "}
            <strong className="text-primary">{rm(baki)}</strong>
          </div>
          <div>
            Sudah Dibayar: <strong>{rm(aff.total_dibayar)}</strong>
          </div>
        </div>

        {/* Kempen Kalifah Belanja 10 Akaun */}
        {kempenData?.ok && kempenData.ada_kempen && kempenData.alokasi ? (
          <KempenKad
            alokasi={kempenData.alokasi}
            families={kempenData.families ?? []}
            traffic={kempenData.traffic}
            funnel={kempenData.funnel}
            sumber={kempenData.sumber}
            expanded={kempenExpanded}
            onToggle={() => setKempenExpanded((v) => !v)}
            onCopyLink={copyLink}
            onLepasSlot={(klaimId) => {
              setKempenData((prev) =>
                prev
                  ? {
                      ...prev,
                      alokasi: prev.alokasi
                        ? {
                            ...prev.alokasi,
                            slot_digunakan: Math.max(0, prev.alokasi.slot_digunakan - 1),
                            slot_kosong: prev.alokasi.slot_kosong + 1,
                            boleh_diganti: Math.max(0, prev.alokasi.boleh_diganti - 1),
                          }
                        : prev.alokasi,
                      families: (prev.families ?? []).filter((f) => f.klaim_id !== klaimId),
                    }
                  : prev,
              );
            }}
          />
        ) : null}



        {/* Marketing Tools */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl font-extrabold">🧰 Marketing Tools</h2>

          {/* Copy Link */}
          <div className="mt-4">
            <div className="text-xs font-bold uppercase text-muted-foreground">
              Pautan Affiliate Anda
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={refLink}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Disalin" : "Salin Pautan"}
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="mt-5 flex flex-row items-center gap-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(refLink)}`}
              alt="QR Code Affiliate"
              className="rounded-lg bg-white p-2"
            />
            <div className="flex flex-col gap-1">
              <div className="text-xs font-bold uppercase text-muted-foreground">
                QR Code Pautan Anda
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(refLink)}`}
                download="qr-affiliate.png"
                className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
              >
                Muat Turun QR
              </a>
            </div>
          </div>

          {/* Link Cuba KALI */}
          <div className="mt-5">
            <div className="text-xs font-bold uppercase text-muted-foreground">
              Link Cuba KALI (Percuma, Tanpa Daftar)
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              /cuba-kali = demo percuma dulu, tanpa borang. /daftar = terus daftar akaun.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={cubaKaliLink}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={copyCubaKaliLink}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                {copiedCubaKali ? "Disalin" : "Salin Pautan"}
              </button>
            </div>
            <div className="mt-3 flex flex-row items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(cubaKaliLink)}`}
                alt="QR Code Cuba KALI"
                className="rounded-lg bg-white p-2"
              />
              <div className="flex flex-col gap-1">
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  QR Code Cuba KALI
                </div>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(cubaKaliLink)}`}
                  download="qr-cuba-kali.png"
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Muat Turun QR
                </a>
              </div>
            </div>
          </div>

          {/* Jana Pautan Ikut Sumber */}
          <div className="mt-5">
            <div className="text-xs font-bold uppercase text-muted-foreground">
              Jana Pautan Ikut Sumber
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tambah UTM pada pautan affiliate supaya anda boleh nampak prestasi ikut channel/kempen.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Sumber
                </label>
                <select
                  value={sumberPilihan}
                  onChange={(e) => setSumberPilihan(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Threads</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Status WhatsApp</option>
                  <option>Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Nama Post / Kempen (pilihan)
                </label>
                <input
                  type="text"
                  value={namaPost}
                  onChange={(e) => setNamaPost(e.target.value)}
                  placeholder="cth. ogos-1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            {sumberPilihan === "Lain-lain" ? (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                  Nama Sumber Custom
                </label>
                <input
                  type="text"
                  value={sumberCustom}
                  onChange={(e) => setSumberCustom(e.target.value)}
                  placeholder="cth. newsletter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : null}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={sourceLink}
                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={copySourceLink}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                {copiedSourceLink ? "Disalin" : "Salin Pautan"}
              </button>
            </div>
          </div>

          {/* Captions */}
          <div className="mt-5">
            <div className="text-xs font-bold uppercase text-muted-foreground">
              Pilih caption ikut saluran
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Assalamualaikum! 👋 Risau anak tak belajar bila kita tak tengok? Di Kalifah.my, anak buat latih tubi sendiri & ibu bapa boleh pantau progress bila-bila masa 📊 Tenang hati, anak pun seronok belajar! Darjah 1-6 | 32,000+ soalan. Cuba percuma: ${refLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-md bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Share2 className="h-4 w-4" />
                💬 Caption WhatsApp
              </a>
              <button
                type="button"
                onClick={() =>
                  copyCaption(
                    "fb",
                    `Sebagai ibu bapa, kita semua nak anak cemerlang dalam pelajaran — tapi selalu risau: "Anak dah faham ke belum bab ni?" 🤔 Kalifah.my ialah portal pembelajaran Darjah 1-6 yang bagi ibu bapa DASHBOARD PANTAU sebenar — bukan sekadar anak buat soalan, tapi kita nampak terus progress & topik mana perlu tumpuan. 32,000+ soalan latihan, sijil automatik, dan yang penting — anak belajar sendiri tanpa kita perlu duduk sebelah dia. Cuba percuma dulu: ${refLink}`,
                  )
                }
                className="inline-flex items-center justify-center gap-1 rounded-md bg-[#1877F2] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                {copiedCaption === "fb" ? "Disalin!" : "📘 Caption Facebook"}
              </button>
              <button
                type="button"
                onClick={() =>
                  copyCaption(
                    "tt",
                    `POV: anak buat homework, korang tak tahu dia faham ke tak 😅 Kalifah.my — portal yang bagi korang nampak progress anak REAL-TIME. Darjah 1-6, 32,000+ soalan, percuma nak cuba! 🔥 ${refLink}`,
                  )
                }
                className="inline-flex items-center justify-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Copy className="h-4 w-4" />
                {copiedCaption === "tt" ? "Disalin!" : "🎵 Caption TikTok"}
              </button>
            </div>
            {copiedCaption && copiedCaption !== "wa" ? (
              <div className="mt-2 text-xs font-bold text-primary">
                Disalin! Tampal di {copiedCaption === "fb" ? "Facebook" : "TikTok"} anda.
              </div>
            ) : null}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Kod: <span className="font-bold text-primary">{aff.custom_ref_code ?? aff.ref_code}</span>
          </div>
        </div>

        {/* Pendapatan Anda */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-extrabold">💰 Pendapatan Anda</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarikh</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Komisyen</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jualan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada jualan lagi. Kongsikan pautan anda!
                    </TableCell>
                  </TableRow>
                ) : (
                  jualan.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell>
                        {new Date(j.created_at).toLocaleDateString("ms-MY")}
                      </TableCell>
                      <TableCell>{j.produk}</TableCell>
                      <TableCell>{rm(j.jumlah_bayar)}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {rm(j.komisyen)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            j.status_bayar === "dibayar"
                              ? "rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-700"
                              : "rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-bold text-yellow-700"
                          }
                        >
                          {j.status_bayar === "dibayar" ? "Dibayar" : "Belum Dibayar"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Challenge bulan ini */}
        {challenge ? (
          <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-soft">
            <div className="flex items-center gap-2 text-amber-700">
              <Trophy className="h-6 w-6" />
              <h2 className="font-display text-xl font-extrabold">
                🏆 Challenge {NAMA_BULAN[challenge.bulan - 1]}
              </h2>
            </div>
            <p className="mt-1 text-sm font-bold text-amber-900">
              Jual {challenge.target_jualan} Langganan
            </p>
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Bonus</div>
              <div className="font-display text-4xl font-extrabold text-amber-600">
                RM{Number(challenge.bonus_rm).toFixed(2)}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>
                  {jualanBulanIni} / {challenge.target_jualan} jualan
                </span>
                <span>
                  {Math.min(
                    100,
                    Math.round(
                      (jualanBulanIni / challenge.target_jualan) * 100,
                    ),
                  )}
                  %
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                  style={{
                    width: `${Math.min(100, (jualanBulanIni / challenge.target_jualan) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {jualanBulanIni >= challenge.target_jualan ? (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-sm font-extrabold text-green-700">
                ✅ Tahniah! Anda layak dapat bonus RM
                {Number(challenge.bonus_rm).toFixed(2)}
              </div>
            ) : (
              <div className="mt-3 text-sm font-bold text-amber-700">
                Lagi {challenge.target_jualan - jualanBulanIni} jualan untuk
                capai bonus!
              </div>
            )}
          </div>
        ) : null}

        {/* Tips Jual Hari Ini */}
        {tipHariIni ? (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-soft">
            <h2 className="font-display text-lg font-extrabold text-sky-900">
              💡 Tips Jual Hari Ini
            </h2>
            <p className="mt-2 text-sky-900/90">{tipHariIni}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  emptyText,
  subtext,
  trend,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emptyText?: string;
  subtext?: string;
  trend?: { arah: "naik" | "turun" | "sama"; teks: string };
  highlight?: boolean;
}) {
  const isEmpty = emptyText && (value === "0" || value === "RM 0.00" || value === "0%");
  const trendColor =
    trend?.arah === "naik"
      ? "text-green-600"
      : trend?.arah === "turun"
        ? "text-red-600"
        : "text-muted-foreground";
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      {isEmpty ? (
        <div className="mt-2 text-base text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
      )}
      {subtext ? (
        <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>
      ) : null}
      {trend ? (
        <div className={`mt-1 text-xs font-bold ${trendColor}`}>{trend.teks}</div>
      ) : null}
    </div>
  );
}

function KempenKad({
  alokasi,
  families,
  traffic,
  funnel,
  sumber,
  expanded,
  onToggle,
  onCopyLink,
  onLepasSlot,
}: {
  alokasi: NonNullable<KempenAffDash["alokasi"]>;
  families: KempenFamily[];
  traffic?: KempenTraffic;
  funnel?: KempenFunnel;
  sumber?: KempenSumber[];
  expanded: boolean;
  onToggle: () => void;
  onCopyLink: () => void;
  onLepasSlot: (klaimId: string) => void;
}) {
  const [memproses, setMemproses] = useState<string | null>(null);
  const peratus =
    alokasi.slot_kuota > 0
      ? Math.min(100, (alokasi.slot_digunakan / alokasi.slot_kuota) * 100)
      : 0;

  const conversionKlikClaim =
    (traffic?.klik_kempen ?? 0) > 0
      ? (((traffic?.claim_tajaan ?? 0) / traffic!.klik_kempen) * 100).toFixed(1) + "%"
      : "0%";

  const funnelSteps = funnel
    ? [
        { key: "klik", label: "Klik", value: funnel.klik },
        { key: "daftar", label: "Daftar", value: funnel.daftar },
        { key: "claim", label: "Claim", value: funnel.claim },
        { key: "mula_belajar", label: "Mula Belajar", value: funnel.mula_belajar },
        { key: "aktif", label: "Aktif", value: funnel.aktif },
        { key: "renew", label: "Renew", value: funnel.renew },
      ]
    : [];

  const sumberKosong =
    !sumber ||
    sumber.length === 0 ||
    sumber.every((s) => s.klik === 0 && s.daftar === 0 && s.claim === 0 && s.aktif === 0);

  async function gantiSlot(klaimId: string) {
    setMemproses(klaimId);
    try {
      const { data, error } = await supabase.rpc("lepaskan_slot", { p_klaim_id: klaimId });
      const res = data as unknown as { ok?: boolean; reason?: string } | null;
      if (error || !res?.ok) {
        toast.error(res?.reason ?? "Gagal melepaskan slot. Cuba lagi.");
        return;
      }
      toast.success("Slot dilepaskan — sedia untuk keluarga baru");
      onLepasSlot(klaimId);
    } finally {
      setMemproses(null);
    }
  }


  return (
    <div className="mt-6 rounded-2xl border border-emerald-300 bg-card p-5 shadow-soft">
      <h2 className="font-display text-xl font-extrabold">
        🎁 Kempen Kalifah Belanja 10 Akaun
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Matlamat anda: cari 10 pelajar yang benar-benar aktif, bukan sekadar 10 pendaftaran.
      </p>

      {/* Traffic / Acquisition */}
      <div className="mt-5">
        <h3 className="font-display text-lg font-extrabold">📈 Traffic / Acquisition</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Klik Kempen" value={String(traffic?.klik_kempen ?? 0)} tone="emerald" />
          <MiniStat label="Daftar dari Link" value={String(traffic?.daftar_dari_link ?? 0)} />
          <MiniStat label="Claim Tajaan" value={String(traffic?.claim_tajaan ?? 0)} tone="amber" />
          <MiniStat label="Conversion Klik→Claim" value={conversionKlikClaim} tone="emerald" />
        </div>
        {traffic?.nota ? (
          <p className="mt-2 text-xs italic text-muted-foreground">{traffic.nota}</p>
        ) : null}

        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase text-muted-foreground">Pecahan ikut sumber</h4>
          {sumberKosong ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Belum ada data tracking ikut sumber lagi. Guna pautan macam{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                ?ref=KOD&utm_source=tiktok&utm_campaign=ogos-1
              </code>{" "}
              untuk pantau prestasi ikut iklan/channel.
            </p>
          ) : (
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Sumber</TableHead>
                    <TableHead className="text-xs text-right">Klik</TableHead>
                    <TableHead className="text-xs text-right">Daftar</TableHead>
                    <TableHead className="text-xs text-right">Claim</TableHead>
                    <TableHead className="text-xs text-right">Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sumber!.map((s) => (
                    <TableRow key={s.label}>
                      <TableCell className="text-sm font-medium">
                        {s.label === "Tanpa Label" ? (
                          <span className="text-muted-foreground">Tiada label (klik/kod terus)</span>
                        ) : (
                          s.label
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{s.klik}</TableCell>
                      <TableCell className="text-right text-sm">{s.daftar}</TableCell>
                      <TableCell className="text-right text-sm">{s.claim}</TableCell>
                      <TableCell className="text-right text-sm">{s.aktif}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Funnel Kempen */}
      {funnelSteps.length > 0 ? (
        <div className="mt-5">
          <h3 className="font-display text-lg font-extrabold">🎯 Funnel Kempen</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {funnelSteps.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className="flex min-w-[4.5rem] flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <span className="font-display text-lg font-extrabold text-emerald-700">
                    {step.value}
                  </span>
                  <span className="text-center text-[10px] font-bold uppercase text-emerald-700/80">
                    {step.label}
                  </span>
                </div>
                {idx < funnelSteps.length - 1 ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Engagement Pelajar */}
      <div className="mt-5 border-t border-emerald-200 pt-5">
        <h3 className="font-display text-lg font-extrabold">👨‍👩‍👧 Engagement Pelajar</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label="Slot Digunakan" value={`${alokasi.slot_digunakan}/${alokasi.slot_kuota}`} />
          <MiniStat label="Slot Masih Ada" value={String(alokasi.slot_kosong)} />
          <MiniStat label="Pelajar Mula Belajar" value={String(alokasi.telah_mula)} />
          <MiniStat label="Pelajar Aktif Penuh" value={String(alokasi.aktif)} tone="emerald" />
          <MiniStat label="At Risk" value={String(alokasi.at_risk)} tone="amber" />
          <MiniStat label="Boleh Diganti" value={String(alokasi.boleh_diganti)} tone="amber" />
        </div>

        <div className="mt-4">
          <div className="mb-1 text-xs font-bold text-muted-foreground">
            {alokasi.slot_digunakan} daripada {alokasi.slot_kuota} slot sedang digunakan
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${peratus}%` }}
            />
          </div>
        </div>

        {alokasi.slot_kosong > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              🔍 Masih ada {alokasi.slot_kosong} slot kosong — cari keluarga baru untuk kongsi kod
              tajaan anda
            </span>
            <button
              onClick={onCopyLink}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <Copy className="h-3 w-3" /> Salin Pautan
            </button>
          </div>
        ) : null}

        <button
          onClick={onToggle}
          className="mt-4 w-full rounded-full bg-primary px-5 py-3 font-display font-extrabold text-primary-foreground shadow-soft hover:opacity-90"
        >
          Lihat Pelajar & Follow-up ({families.length})
        </button>

        {expanded ? (
          <div className="mt-4 space-y-2">
            {families.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Belum ada keluarga claim slot lagi.
              </div>
            ) : (
              families.map((f) => {
                const penuh = f.hari_aktif >= 5 && f.sesi >= 10 && f.kali_sesi >= 3;
                const belumMula = f.hari_aktif === 0 && f.sesi === 0 && f.kali_sesi === 0;
                return (
                  <div
                    key={f.klaim_id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{f.nama_anak}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                          Darjah {f.darjah}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {f.hari_aktif}/5 hari aktif · {f.sesi}/10 sesi · {f.kali_sesi}/3 KALI
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {f.boleh_diganti ? (
                        <>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            ⚠️ Boleh Diganti
                          </span>
                          <button
                            disabled={memproses === f.klaim_id}
                            onClick={() => gantiSlot(f.klaim_id)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {memproses === f.klaim_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Ganti Slot
                          </button>
                        </>
                      ) : penuh ? (
                        <>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            🟢 Aktif
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tiada tindakan diperlukan
                          </span>
                        </>
                      ) : belumMula ? (
                        <>
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            🔴 Belum Mula
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Kalifah.my dah follow-up automatik
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                            🟡 Hampir Aktif
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Kalifah.my dah follow-up automatik
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-3 shadow-soft ${cls}`}>
      <div className="text-[11px] font-bold uppercase opacity-70">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}
