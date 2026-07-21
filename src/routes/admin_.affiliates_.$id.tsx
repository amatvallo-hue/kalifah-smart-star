import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, ArrowLeft, Copy, Share2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin_/affiliates_/$id")({
  head: () => ({ meta: [{ title: "Profil Affiliate — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliateProfile,
});

type AffRow = {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  custom_ref_code?: string | null;
  avatar_url?: string | null;
  nama_bank?: string | null;
  no_akaun_bank?: string | null;
  nama_pemilik_bank?: string | null;
  no_telefon?: string | null;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
  platform_promosi?: string[] | null;
  last_klik_at?: string | null;
  created_at?: string | null;
  admin_tags?: string[] | null;
};

type JualanRow = {
  id: string;
  created_at: string | null;
  produk?: string | null;
  jumlah_bayar: number | null;
  komisyen: number | null;
  status_bayar: string | null;
};

type Bucket = { date: string; klik: number; jualan: number; komisen: number };

function isInactive(ts: string | null | undefined): boolean {
  if (!ts) return true;
  const diffDays = (Date.now() - new Date(ts).getTime()) / 86400000;
  return diffDays > 14;
}

function statusBadge(r: AffRow): { label: string; className: string } {
  const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
  const ageDays = createdAt ? (Date.now() - createdAt) / 86400000 : Infinity;
  if (ageDays <= 7) return { label: "🟡 Baru", className: "bg-amber-100 text-amber-700" };
  if (!isInactive(r.last_klik_at)) return { label: "🟢 Aktif", className: "bg-emerald-100 text-emerald-700" };
  return { label: "🔴 Tidak Aktif", className: "bg-red-100 text-red-700" };
}

function healthScore(r: AffRow, maxKlik: number, maxJualan: number): number {
  const klikScore = maxKlik > 0 ? ((r.total_klik ?? 0) / maxKlik) * 100 : 0;
  const jualanScore = maxJualan > 0 ? ((r.total_jualan ?? 0) / maxJualan) * 100 : 0;
  const days = r.last_klik_at
    ? (Date.now() - new Date(r.last_klik_at).getTime()) / 86400000
    : Infinity;
  const konsistenScore = days <= 7 ? 100 : days >= 30 ? 0 : 100 - ((days - 7) / 23) * 100;
  const score = Math.round(klikScore * 0.3 + jualanScore * 0.5 + konsistenScore * 0.2);
  return Math.max(0, Math.min(100, score));
}

function healthBadge(score: number): { label: string; className: string } {
  if (score >= 70) return { label: `🟢 ${score}`, className: "bg-emerald-100 text-emerald-700" };
  if (score >= 40) return { label: `🟡 ${score}`, className: "bg-amber-100 text-amber-700" };
  return { label: `🔴 ${score}`, className: "bg-red-100 text-red-700" };
}

function platformLabel(raw: string): { icon: string; label: string } {
  switch (raw) {
    case "WhatsApp/Telegram": return { icon: "📱", label: "WhatsApp" };
    case "Instagram/Facebook": return { icon: "📘", label: "Facebook" };
    case "TikTok": return { icon: "🎵", label: "TikTok" };
    case "Threads": return { icon: "🧵", label: "Threads" };
    case "Lain-lain": return { icon: "✨", label: "Lain-lain" };
    default: return { icon: "🔗", label: raw };
  }
}

function rm(n: number) { return `RM ${(n ?? 0).toFixed(2)}`; }

function fmtDate(ts: string | null | undefined): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const months = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function AdminAffiliateProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [aff, setAff] = useState<AffRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [prestasi, setPrestasi] = useState<Bucket[] | null>(null);
  const [jualan, setJualan] = useState<JualanRow[] | null>(null);

  const [newTag, setNewTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [maxKlik, setMaxKlik] = useState(0);
  const [maxJualan, setMaxJualan] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
      if ((data as { role?: string } | null)?.role === "admin") setIsAdmin(true);
      else navigate({ to: "/" });
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data: affData } = await supabase
        .from("affiliates").select("*").eq("id", id).maybeSingle();
      if (!affData) { setNotFound(true); setLoading(false); return; }
      const a = affData as AffRow;
      setAff(a);

      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);
      const sinceIso = since.toISOString();

      const [klikRes, jualRes, allJualan, allAff] = await Promise.all([
        supabase.from("affiliate_klik_log").select("created_at").eq("affiliate_id", id).gte("created_at", sinceIso),
        supabase.from("affiliate_jualan").select("created_at, komisyen").eq("affiliate_id", id).gte("created_at", sinceIso),
        supabase.from("affiliate_jualan").select("id, created_at, produk, jumlah_bayar, komisyen, status_bayar").eq("affiliate_id", id).order("created_at", { ascending: false }),
        supabase.from("affiliates").select("total_klik, total_jualan"),
      ]);

      let mk = 0;
      let mj = 0;
      for (const row of (allAff.data ?? []) as { total_klik: number | null; total_jualan: number | null }[]) {
        if ((row.total_klik ?? 0) > mk) mk = row.total_klik ?? 0;
        if ((row.total_jualan ?? 0) > mj) mj = row.total_jualan ?? 0;
      }
      setMaxKlik(mk);
      setMaxJualan(mj);

      const buckets = new Map<string, Bucket>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, { date: key, klik: 0, jualan: 0, komisen: 0 });
      }
      for (const row of (klikRes.data ?? []) as { created_at: string }[]) {
        const b = buckets.get(row.created_at.slice(0, 10));
        if (b) b.klik += 1;
      }
      for (const row of (jualRes.data ?? []) as { created_at: string; komisyen: number | null }[]) {
        const b = buckets.get(row.created_at.slice(0, 10));
        if (b) { b.jualan += 1; b.komisen += Number(row.komisyen ?? 0); }
      }
      setPrestasi(Array.from(buckets.values()));
      setJualan((allJualan.data ?? []) as JualanRow[]);
      setLoading(false);
    })();
  }, [isAdmin, id]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kalifah.my";
  const kod = aff?.custom_ref_code ?? aff?.ref_code ?? "";
  const refLink = `${origin}/daftar?ref=${kod}`;

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch { /* noop */ }
  };

  const addTag = async () => {
    const tag = newTag.trim();
    if (!tag || !aff) return;
    const tags = aff.admin_tags ?? [];
    if (tags.includes(tag)) { setNewTag(""); return; }
    const next = [...tags, tag];
    setSavingTag(true);
    const { error } = await supabase.from("affiliates").update({ admin_tags: next }).eq("id", aff.id);
    setSavingTag(false);
    if (!error) { setAff({ ...aff, admin_tags: next }); setNewTag(""); }
  };

  const removeTag = async (tag: string) => {
    if (!aff) return;
    const next = (aff.admin_tags ?? []).filter((t) => t !== tag);
    const prev = aff.admin_tags ?? [];
    setAff({ ...aff, admin_tags: next });
    const { error } = await supabase.from("affiliates").update({ admin_tags: next }).eq("id", aff.id);
    if (error) setAff({ ...aff, admin_tags: prev });
  };

  if (authLoading || checking || (isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  if (notFound || !aff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-bold">Affiliate tidak dijumpai.</p>
          <Link to="/admin/affiliates" className="mt-4 inline-block text-primary underline">← Kembali</Link>
        </div>
      </div>
    );
  }

  const badge = statusBadge(aff);
  const initial = (aff.nama?.[0] ?? "?").toUpperCase();

  const totalKlik30 = (prestasi ?? []).reduce((s, b) => s + b.klik, 0);
  const totalJualan30 = (prestasi ?? []).reduce((s, b) => s + b.jualan, 0);
  const totalKomisen30 = (prestasi ?? []).reduce((s, b) => s + b.komisen, 0);
  const conv30 = totalKlik30 > 0 ? ((totalJualan30 / totalKlik30) * 100).toFixed(1) + "%" : "0%";

  const emptyPrestasi = !prestasi || prestasi.every((d) => d.klik === 0 && d.jualan === 0 && d.komisen === 0);

  const waCaption = `Assalamualaikum! 👋 Risau anak tak belajar bila kita tak tengok? Di Kalifah.my, anak buat latih tubi sendiri & ibu bapa boleh pantau progress bila-bila masa 📊 Tenang hati, anak pun seronok belajar! Darjah 1-6 | 32,000+ soalan. Cuba percuma: ${refLink}`;
  const fbCaption = `Sebagai ibu bapa, kita semua nak anak cemerlang dalam pelajaran — tapi selalu risau: "Anak dah faham ke belum bab ni?" 🤔 Kalifah.my ialah portal pembelajaran Darjah 1-6 yang bagi ibu bapa DASHBOARD PANTAU sebenar — bukan sekadar anak buat soalan, tapi kita nampak terus progress & topik mana perlu tumpuan. 32,000+ soalan latihan, sijil automatik, dan yang penting — anak belajar sendiri tanpa kita perlu duduk sebelah dia. Cuba percuma dulu: ${refLink}`;
  const ttCaption = `POV: anak buat homework, korang tak tahu dia faham ke tak 😅 Kalifah.my — portal yang bagi korang nampak progress anak REAL-TIME. Darjah 1-6, 32,000+ soalan, percuma nak cuba! 🔥 ${refLink}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(refLink)}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to="/admin/affiliates"
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke senarai
        </Link>

        {/* Header */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            {aff.avatar_url ? (
              <img
                src={aff.avatar_url}
                alt={aff.nama}
                className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-3xl font-extrabold text-primary">
                {initial}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold">{aff.nama}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge.className}`}>
                  {badge.label}
                </span>
                {(() => {
                  const hb = healthBadge(healthScore(aff, maxKlik, maxJualan));
                  return (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${hb.className}`} title="Health Score">
                      {hb.label}
                    </span>
                  );
                })()}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{aff.email}</div>
              <div className="mt-1 text-sm">
                Kod: <span className="font-mono font-bold text-primary">{kod}</span>
              </div>
              {aff.no_telefon ? (
                <div className="mt-1 text-sm text-muted-foreground">📞 {aff.no_telefon}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Admin Notes (always visible) */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-soft">
          <h2 className="font-display text-lg font-extrabold">🏷️ Nota Admin</h2>
          <p className="mt-1 text-xs text-muted-foreground">Tag pendek untuk rujukan pantas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(aff.admin_tags ?? []).length === 0 ? (
              <span className="text-xs text-muted-foreground">Belum ada tag.</span>
            ) : (
              (aff.admin_tags ?? []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    title="Buang tag"
                    className="rounded-full p-0.5 hover:bg-amber-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); addTag(); }}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="cth: Leader TikTok"
              maxLength={40}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
            />
            <button
              type="submit"
              disabled={savingTag || !newTag.trim()}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Tambah
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="prestasi">
            <TabsList>
              <TabsTrigger value="prestasi">📊 Prestasi</TabsTrigger>
              <TabsTrigger value="marketing">🧰 Marketing</TabsTrigger>
              <TabsTrigger value="pendapatan">💰 Pendapatan</TabsTrigger>
            </TabsList>

            {/* Prestasi */}
            <TabsContent value="prestasi" className="mt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Klik (30h)" value={String(totalKlik30)} />
                <SummaryCard label="Jualan (30h)" value={String(totalJualan30)} />
                <SummaryCard label="Conversion (30h)" value={conv30} />
                <SummaryCard label="Komisen (30h)" value={rm(totalKomisen30)} />
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  Trend Harian (30 hari)
                </div>
                {emptyPrestasi ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    Tiada data 30 hari lepas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={prestasi ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="klik" stroke="#0ea5e9" name="Klik" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="jualan" stroke="#10b981" name="Jualan" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="komisen" stroke="#f59e0b" name="Komisen (RM)" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            {/* Marketing */}
            <TabsContent value="marketing" className="mt-4 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="text-xs font-bold uppercase text-muted-foreground">Platform Promosi</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(aff.platform_promosi ?? []).length === 0 ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : (
                    (aff.platform_promosi ?? []).map((p) => {
                      const pl = platformLabel(p);
                      return (
                        <span key={p} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold">
                          {pl.icon} {pl.label}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="text-xs font-bold uppercase text-muted-foreground">Pautan Referral</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={refLink}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copy("link", refLink)}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    <Copy className="h-4 w-4" /> {copied === "link" ? "Disalin" : "Salin"}
                  </button>
                </div>

                <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <img src={qrUrl} alt="QR Code" className="rounded-lg bg-white p-2" />
                  <a
                    href={qrUrl}
                    download="qr-affiliate.png"
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted"
                  >
                    Muat Turun QR
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="text-xs font-bold uppercase text-muted-foreground">Caption Sedia (preview)</div>
                <div className="mt-3 space-y-3">
                  <CaptionPreview
                    label="💬 Caption WhatsApp"
                    text={waCaption}
                    copied={copied === "wa"}
                    onCopy={() => copy("wa", waCaption)}
                  />
                  <CaptionPreview
                    label="📘 Caption Facebook"
                    text={fbCaption}
                    copied={copied === "fb"}
                    onCopy={() => copy("fb", fbCaption)}
                  />
                  <CaptionPreview
                    label="🎵 Caption TikTok"
                    text={ttCaption}
                    copied={copied === "tt"}
                    onCopy={() => copy("tt", ttCaption)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pendapatan */}
            <TabsContent value="pendapatan" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-extrabold">Sejarah Jualan Penuh</h3>
                  <div className="text-xs text-muted-foreground">
                    Jumlah: {jualan?.length ?? 0} rekod · Lifetime Komisen: <strong>{rm(aff.total_komisyen)}</strong> · Dibayar: <strong>{rm(aff.total_dibayar)}</strong>
                  </div>
                </div>
                {!jualan || jualan.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Belum ada jualan.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarikh</TableHead>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Jumlah Bayar</TableHead>
                          <TableHead className="text-right">Komisyen</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jualan.map((j) => (
                          <TableRow key={j.id}>
                            <TableCell>{fmtDate(j.created_at)}</TableCell>
                            <TableCell>{j.produk ?? "-"}</TableCell>
                            <TableCell className="text-right">{rm(Number(j.jumlah_bayar ?? 0))}</TableCell>
                            <TableCell className="text-right">{rm(Number(j.komisyen ?? 0))}</TableCell>
                            <TableCell>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                j.status_bayar === "dibayar"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {j.status_bayar ?? "-"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}

function CaptionPreview({
  label, text, copied, onCopy,
}: { label: string; text: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold">{label}</div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-bold hover:bg-muted"
        >
          <Share2 className="h-3 w-3" /> {copied ? "Disalin" : "Salin"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
