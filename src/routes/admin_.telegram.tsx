import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, Bot, Pencil, Trash2, Plus, X, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminAffiliateNav } from "@/components/AdminAffiliateNav";

const KATEGORI_SUGGESTIONS = [
  "Pendaftaran",
  "Pembayaran",
  "Affiliate",
  "Harga",
  "Lain-lain",
];

type KbRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  source: string | null;
  source_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/admin_/telegram")({
  head: () => ({
    meta: [
      { title: "Statistik Bot Telegram — Admin Kalifah.my" },
      {
        name: "description",
        content:
          "Pantau penggunaan bot Telegram Kalifah Assistant: pengguna unik, event harian dan perbualan AI terkini.",
      },
      { property: "og:title", content: "Statistik Bot Telegram — Admin Kalifah.my" },
      {
        property: "og:description",
        content: "Pantau penggunaan bot Telegram Kalifah Assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AdminTelegramPage,
});

type EventRow = {
  id: string;
  created_at: string;
  chat_id: number | string;
  chat_type: string | null;
  event_type: string;
  message_text: string | null;
  reply_text: string | null;
  needs_admin: boolean | null;
  feedback: string | null;
  corrected_at: string | null;
};

type RingkasRow = {
  id: string;
  created_at: string;
  chat_id: number | string;
  event_type: string;
  message_text: string | null;
  needs_admin: boolean | null;
  feedback: string | null;
  corrected_at: string | null;
};

type DomainRow = {
  id: string;
  domain: string;
  created_at: string;
  created_by: string | null;
};

type ModLogRow = {
  id: string;
  chat_id: number | string;
  user_id: number | string | null;
  username: string | null;
  action: string;
  reason: string | null;
  message_text: string | null;
  performed_by: string | null;
  created_at: string;
};

type TopQItem = { title: string; count: number; example: string };

type TopQCache = {
  id: string;
  generated_at: string;
  period_days: number;
  total_messages: number;
  results: TopQItem[] | null;
  generated_by: string | null;
};

type TabKey = "overview" | "conversations" | "knowledge" | "moderation" | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "📊 Overview" },
  { key: "conversations", label: "💬 Conversations" },
  { key: "knowledge", label: "📚 Knowledge" },
  { key: "moderation", label: "🛡️ Moderation" },
  { key: "settings", label: "⚙️ Settings" },
];

const AI_TYPES = ["ai_dm", "ai_group"];



const EVENT_LABEL: Record<string, string> = {
  start: "🚀 Start",
  komisen_success: "✅ Komisen (berjaya)",
  komisen_fail: "⚠️ Komisen (gagal)",
  admin_tag: "🔔 Tag Admin",
  broadcast: "📢 Broadcast",
  scam_flag: "🚩 Scam Flag",
  ai_dm: "🤖 AI (DM)",
  ai_group: "🤖 AI (Group)",
  welcome: "👋 Welcome",
};

function formatMasa(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ms-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function masaRelatif(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const minit = Math.floor(diff / 60000);
  if (minit < 1) return "baru sahaja";
  if (minit < 60) return `${minit} minit lalu`;
  const jam = Math.floor(minit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  return `${hari} hari lalu`;
}

function potong(t: string | null, n = 80) {
  if (!t) return "—";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function AdminTelegramPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ralat, setRalat] = useState<string | null>(null);

  const [uniqueChats, setUniqueChats] = useState(0);
  const [pecahan, setPecahan] = useState<{ event_type: string; bil: number }[]>([]);
  const [aiRows, setAiRows] = useState<EventRow[]>([]);
  const [minggu, setMinggu] = useState<RingkasRow[]>([]);
  const [soalanHariIni, setSoalanHariIni] = useState(0);
  const [perluAdminHariIni, setPerluAdminHariIni] = useState(0);

  const [kbRows, setKbRows] = useState<KbRow[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [showKbForm, setShowKbForm] = useState(false);
  const [editKb, setEditKb] = useState<KbRow | null>(null);
  const [correctEvent, setCorrectEvent] = useState<EventRow | null>(null);
  const [expandedKb, setExpandedKb] = useState<Record<string, boolean>>({});

  // ---- Fasa 3: Moderation ----
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [modLog, setModLog] = useState<ModLogRow[]>([]);
  const [modLoading, setModLoading] = useState(false);
  const [modBusyId, setModBusyId] = useState<string | null>(null);

  // ---- Fasa 4: Tab + Top Questions ----
  const [tab, setTab] = useState<TabKey>("overview");
  const [topQ, setTopQ] = useState<TopQCache | null>(null);
  const [topQBusy, setTopQBusy] = useState(false);
  const [topQRalat, setTopQRalat] = useState<string | null>(null);

  const loadTopQ = async () => {
    const { data } = await supabase
      .from("bot_top_questions_cache")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setTopQ(data as TopQCache);
  };

  const janaTopQ = async () => {
    setTopQBusy(true);
    setTopQRalat(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "telegram-top-questions-generate",
        { body: { days: 30 } },
      );
      const res = data as
        | { success?: boolean; cache?: TopQCache; error?: string; detail?: string }
        | null;
      if (error || res?.error) {
        setTopQRalat(res?.detail ?? res?.error ?? error?.message ?? "Ralat tidak diketahui.");
      } else if (res?.cache) {
        setTopQ(res.cache);
      }
    } catch (e) {
      setTopQRalat((e as Error).message);
    } finally {
      setTopQBusy(false);
    }
  };

  const setSettingValue = async (key: string, value: string) => {
    const { error } = await supabase
      .from("bot_settings")
      .upsert({ key, value, updated_by: user?.id ?? null }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    setSettings((s) => ({ ...s, [key]: value }));
  };


  const loadModeration = async () => {
    setModLoading(true);
    const [s, d, l] = await Promise.all([
      supabase.from("bot_settings").select("key, value"),
      supabase.from("bot_domain_whitelist").select("*").order("domain", { ascending: true }),
      supabase
        .from("bot_moderation_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (s.data) {
      const m: Record<string, string> = {};
      for (const r of s.data as { key: string; value: string }[]) m[r.key] = r.value;
      setSettings(m);
    }
    setDomains((d.data ?? []) as DomainRow[]);
    setModLog((l.data ?? []) as ModLogRow[]);
    setModLoading(false);
  };

  const setSetting = async (key: string, next: boolean) => {
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: next ? "true" : "false" }));
    const { error } = await supabase
      .from("bot_settings")
      .upsert({ key, value: next ? "true" : "false", updated_by: user?.id ?? null }, { onConflict: "key" });
    if (error) {
      alert("Gagal simpan tetapan: " + error.message);
      setSettings((s) => ({ ...s, [key]: prev ?? "false" }));
    }
  };

  const tambahDomain = async (raw: string) => {
    const domain = raw.trim().toLowerCase();
    if (!domain) return;
    if (domains.some((d) => d.domain === domain)) {
      alert("Domain ni dah ada dalam senarai.");
      return;
    }
    const { data, error } = await supabase
      .from("bot_domain_whitelist")
      .insert({ domain, created_by: user?.id ?? null })
      .select("*")
      .maybeSingle();
    if (error) {
      alert("Gagal tambah domain: " + error.message);
      return;
    }
    if (data) setDomains((prev) => [...prev, data as DomainRow].sort((a, b) => a.domain.localeCompare(b.domain)));
  };

  const padamDomain = async (row: DomainRow) => {
    if (!window.confirm(`Padam domain "${row.domain}"?`)) return;
    const { error } = await supabase.from("bot_domain_whitelist").delete().eq("id", row.id);
    if (error) {
      alert("Gagal padam: " + error.message);
      return;
    }
    setDomains((prev) => prev.filter((d) => d.id !== row.id));
  };

  const tindakanModerasi = async (row: ModLogRow, action: "ban" | "unban") => {
    if (row.user_id == null) return;
    const soalan =
      action === "ban" ? "Block user ni dari group?" : "Buang block (unban) user ni?";
    if (!window.confirm(soalan)) return;
    setModBusyId(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-moderation-action", {
        body: {
          action,
          chat_id: Number(row.chat_id),
          user_id: Number(row.user_id),
          username: row.username ?? undefined,
          reason: action === "ban" ? "Block manual oleh admin" : "Unban manual oleh admin",
        },
      });
      const res = data as { success?: boolean; error?: string; detail?: string } | null;
      if (error || res?.error) {
        alert("Gagal: " + (res?.detail ?? res?.error ?? error?.message ?? "ralat tidak diketahui"));
      } else {
        alert(action === "ban" ? "✅ User berjaya diblock." : "✅ User berjaya di-unban.");
        await loadModeration();
      }
    } catch (e) {
      alert("Gagal: " + (e as Error).message);
    } finally {
      setModBusyId(null);
    }
  };


  const loadKb = async () => {
    setKbLoading(true);
    const { data, error } = await supabase
      .from("bot_knowledge_base")
      .select("*")
      .order("category", { ascending: true })
      .order("title", { ascending: true });
    if (error) console.error("[admin/telegram] KB", error);
    setKbRows((data ?? []) as KbRow[]);
    setKbLoading(false);
  };

  const toggleKbActive = async (row: KbRow, next: boolean) => {
    setKbRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r)));
    const { error } = await supabase
      .from("bot_knowledge_base")
      .update({ is_active: next })
      .eq("id", row.id);
    if (error) {
      console.error(error);
      setKbRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !next } : r)));
    }
  };

  const deleteKb = async (row: KbRow) => {
    if (!window.confirm(`Padam "${row.title}"?`)) return;
    const { error } = await supabase.from("bot_knowledge_base").delete().eq("id", row.id);
    if (error) {
      alert("Gagal padam: " + error.message);
      return;
    }
    setKbRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const saveKb = async (payload: {
    id?: string;
    category: string;
    title: string;
    content: string;
  }) => {
    if (payload.id) {
      const { error } = await supabase
        .from("bot_knowledge_base")
        .update({
          category: payload.category,
          title: payload.title,
          content: payload.content,
        })
        .eq("id", payload.id);
      if (error) {
        alert("Gagal simpan: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("bot_knowledge_base").insert({
        category: payload.category,
        title: payload.title,
        content: payload.content,
        source: "manual",
        created_by: user?.id ?? null,
        is_active: true,
      });
      if (error) {
        alert("Gagal simpan: " + error.message);
        return;
      }
    }
    setShowKbForm(false);
    setEditKb(null);
    await loadKb();
  };

  const saveCorrection = async (payload: {
    eventId: string;
    category: string;
    title: string;
    content: string;
  }) => {
    const { error: insErr } = await supabase.from("bot_knowledge_base").insert({
      category: payload.category,
      title: payload.title,
      content: payload.content,
      source: "correction",
      source_event_id: payload.eventId,
      created_by: user?.id ?? null,
      is_active: true,
    });
    if (insErr) {
      alert("Gagal simpan: " + insErr.message);
      return;
    }
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("telegram_bot_events")
      .update({ corrected_at: nowIso })
      .eq("id", payload.eventId);
    if (updErr) console.error(updErr);
    setAiRows((prev) =>
      prev.map((r) => (r.id === payload.eventId ? { ...r, corrected_at: nowIso } : r)),
    );
    setMinggu((prev) =>
      prev.map((r) => (r.id === payload.eventId ? { ...r, corrected_at: nowIso } : r)),
    );
    setCorrectEvent(null);
    await loadKb();
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadKb();
    loadModeration();

  }, [isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if ((data as { role?: string } | null)?.role === "admin") {
        setIsAdmin(true);
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      setRalat(null);

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [semua, mingguRes, ai] = await Promise.all([
        supabase.from("telegram_bot_events").select("chat_id, event_type"),
        supabase
          .from("telegram_bot_events")
          .select("id, created_at, chat_id, event_type, message_text, needs_admin, feedback, corrected_at")
          .gte("created_at", weekStart)
          .order("created_at", { ascending: false }),
        supabase
          .from("telegram_bot_events")
          .select(
            "id, created_at, chat_id, chat_type, event_type, message_text, reply_text, needs_admin, feedback, corrected_at",
          )
          .in("event_type", AI_TYPES)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const err = semua.error || mingguRes.error || ai.error;
      if (err) {
        console.error("[admin/telegram]", err);
        setRalat(err.message);
      }

      const rows = (semua.data ?? []) as { chat_id: number | string; event_type: string }[];

      const kira = new Map<string, number>();
      for (const r of rows) kira.set(r.event_type, (kira.get(r.event_type) ?? 0) + 1);
      setPecahan(
        [...kira.entries()]
          .map(([event_type, bil]) => ({ event_type, bil }))
          .sort((a, b) => b.bil - a.bil),
      );

      const wk = (mingguRes.data ?? []) as RingkasRow[];
      setMinggu(wk);
      setUniqueChats(new Set(wk.map((r) => String(r.chat_id))).size);

      const aiHariIni = wk.filter(
        (r) => AI_TYPES.includes(r.event_type) && r.created_at >= todayStart,
      );
      setSoalanHariIni(aiHariIni.length);
      setPerluAdminHariIni(aiHariIni.filter((r) => r.needs_admin === true).length);

      setAiRows((ai.data ?? []) as EventRow[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  const maxBil = useMemo(
    () => pecahan.reduce((m, p) => Math.max(m, p.bil), 0),
    [pecahan],
  );

  const aiMinggu = useMemo(
    () => minggu.filter((r) => AI_TYPES.includes(r.event_type)),
    [minggu],
  );

  const dijawabAiPct = useMemo(() => {
    if (aiMinggu.length === 0) return "—";
    const ok = aiMinggu.filter((r) => r.needs_admin === false).length;
    return `${Math.round((ok / aiMinggu.length) * 100)}%`;
  }, [aiMinggu]);

  const spamDisekat = useMemo(
    () => minggu.filter((r) => r.event_type === "scam_flag").length,
    [minggu],
  );

  const kualitiPct = useMemo(() => {
    const berfeedback = minggu.filter((r) => r.feedback === "up" || r.feedback === "down");
    if (berfeedback.length === 0) return "—";
    const up = berfeedback.filter((r) => r.feedback === "up").length;
    return `${Math.round((up / berfeedback.length) * 100)}%`;
  }, [minggu]);

  const perluPerhatian = useMemo(
    () =>
      aiMinggu
        .filter((r) => r.needs_admin === true && !r.feedback && !r.corrected_at)
        .slice(0, 5),
    [aiMinggu],
  );

  const bilThumbsDown = useMemo(
    () => minggu.filter((r) => r.feedback === "down").length,
    [minggu],
  );

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader userName={user?.user_metadata?.name as string | undefined} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="mt-3 text-muted-foreground">Akses ditolak.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <AdminAffiliateNav />
      <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold">
        <Bot className="h-7 w-7 text-primary" /> Bot Telegram — Kalifah Assistant
      </h1>
      <p className="mt-1 text-muted-foreground">
        Statistik penggunaan bot affiliate/presales di Telegram.
      </p>

      {ralat && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Gagal baca data: {ralat}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "border border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
          <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatCard label="👥 Pengguna Aktif (7 hari)" value={String(uniqueChats)} />
            <StatCard label="❓ Soalan Hari Ini" value={String(soalanHariIni)} />
            <StatCard label="🤖 Dijawab AI % (7 hari)" value={dijawabAiPct} highlight />
            <StatCard label="⚠️ Perlu Admin (hari ini)" value={String(perluAdminHariIni)} />
            <StatCard label="🚩 Spam Disekat (7 hari)" value={String(spamDisekat)} />
            <StatCard label="👍 Kualiti Jawapan % (7 hari)" value={kualitiPct} />
          </div>

          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg font-extrabold">Pecahan Ikut Jenis Event</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {pecahan.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Tiada event lagi.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Jenis Event</th>
                      <th className="px-4 py-3">Bilangan</th>
                      <th className="px-4 py-3 w-1/2">Graf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pecahan.map((p) => (
                      <tr key={p.event_type} className="border-t border-border">
                        <td className="px-4 py-3 font-bold">
                          {EVENT_LABEL[p.event_type] ?? p.event_type}
                        </td>
                        <td className="px-4 py-3 font-display font-extrabold">{p.bil}</td>
                        <td className="px-4 py-3">
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${maxBil ? (p.bil / maxBil) * 100 : 0}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {(perluPerhatian.length > 0 || bilThumbsDown > 0) && (
            <section className="mt-8">
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-soft">
                <h2 className="mb-3 font-display text-lg font-extrabold">🚨 Perlu Perhatian</h2>

                {perluPerhatian.length > 0 && (
                  <ul className="space-y-2">
                    {perluPerhatian.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-bold">{masaRelatif(r.created_at)}</span>
                          <span>·</span>
                          <span>chat {String(r.chat_id)}</span>
                        </div>
                        <p className="mt-1 font-medium">{potong(r.message_text)}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {bilThumbsDown > 0 && (
                  <p className="mt-3 text-sm font-bold text-destructive">
                    👎 {bilThumbsDown} jawapan AI ditandakan tak membantu minggu ini —{" "}
                    <a href="#perbualan-ai" className="underline">
                      lihat jadual di bawah
                    </a>
                  </p>
                )}
              </div>
            </section>
          )}

          <TopQuestionsCard
            cache={topQ}
            busy={topQBusy}
            ralat={topQRalat}
            onGenerate={janaTopQ}
          />
          </>
          )}

          {tab === "knowledge" && (
          <KnowledgeBaseSection

            rows={kbRows}
            loading={kbLoading}
            expanded={expandedKb}
            setExpanded={setExpandedKb}
            onAdd={() => {
              setEditKb(null);
              setShowKbForm(true);
            }}
            onEdit={(row) => {
              setEditKb(row);
              setShowKbForm(true);
            }}
            onToggle={toggleKbActive}
            onDelete={deleteKb}
          />
          )}

          {tab === "moderation" && (
          <ModerationSection
            settings={settings}
            onSetting={setSetting}
            domains={domains}
            onAddDomain={tambahDomain}
            onDeleteDomain={padamDomain}
            log={modLog}
            loading={modLoading}
            busyId={modBusyId}
            onAction={tindakanModerasi}
          />
          )}

          {tab === "settings" && (
            <SettingsSection settings={settings} onSave={setSettingValue} />
          )}

          {tab === "conversations" && (
          <section className="mt-8" id="perbualan-ai">


            <h2 className="mb-1 font-display text-lg font-extrabold">💬 Perbualan AI Terkini</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              50 rekod terbaru (ai_dm &amp; ai_group) — untuk nilai kualiti jawapan AI.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
              {aiRows.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Belum ada perbualan AI direkod.
                </div>
              ) : (
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Masa</th>
                      <th className="px-4 py-3">Jenis Chat</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Soalan</th>
                      <th className="px-4 py-3">Jawapan Bot</th>
                      <th className="px-4 py-3">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiRows.map((r) => (
                      <tr key={r.id} className="border-t border-border align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatMasa(r.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-bold">
                            {r.chat_type === "private" ? "Private" : "Group"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge needsAdmin={r.needs_admin} feedback={r.feedback} />
                        </td>
                        <td className="max-w-xs px-4 py-3 whitespace-pre-line">
                          {r.message_text ?? "—"}
                        </td>
                        <td className="max-w-md px-4 py-3 whitespace-pre-line text-muted-foreground">
                          {r.reply_text ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setCorrectEvent(r)}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" /> Betulkan
                          </button>
                          {r.corrected_at && (
                            <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ✅ Dah dibetulkan
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          )}



          {showKbForm && (
            <KbFormModal
              initial={editKb}
              onClose={() => {
                setShowKbForm(false);
                setEditKb(null);
              }}
              onSave={saveKb}
            />
          )}

          {correctEvent && (
            <CorrectionModal
              event={correctEvent}
              onClose={() => setCorrectEvent(null)}
              onSave={saveCorrection}
            />
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({
  needsAdmin,
  feedback,
}: {
  needsAdmin: boolean | null;
  feedback: string | null;
}) {
  if (needsAdmin === true) {
    return (
      <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
        ⚠️ Perlu Admin
      </span>
    );
  }
  if (feedback === "up") {
    return (
      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-bold">
        👍
      </span>
    );
  }
  if (feedback === "down") {
    return (
      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
        👎
      </span>
    );
  }
  return (
    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
      ✓ AI Jawab
    </span>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function KnowledgeBaseSection({
  rows,
  loading,
  expanded,
  setExpanded,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: {
  rows: KbRow[];
  loading: boolean;
  expanded: Record<string, boolean>;
  setExpanded: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  onAdd: () => void;
  onEdit: (row: KbRow) => void;
  onToggle: (row: KbRow, next: boolean) => void;
  onDelete: (row: KbRow) => void;
}) {
  const grouped = useMemo(() => {
    const m = new Map<string, KbRow[]>();
    for (const r of rows) {
      const arr = m.get(r.category) ?? [];
      arr.push(r);
      m.set(r.category, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
          <BookOpen className="h-5 w-5 text-primary" /> Knowledge Base
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Knowledge
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Belum ada entri knowledge base. Klik <b>+ Tambah Knowledge</b> untuk mula.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, list]) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-extrabold uppercase text-muted-foreground">
                {cat}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((row) => {
                  const isLong = row.content.length > 150;
                  const isOpen = expanded[row.id] ?? false;
                  const shown = !isLong || isOpen ? row.content : row.content.slice(0, 150) + "…";
                  return (
                    <div
                      key={row.id}
                      className={`rounded-2xl border p-4 shadow-soft ${
                        row.is_active ? "border-border bg-card" : "border-border bg-muted/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{row.title}</p>
                            {row.source === "correction" && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                Daripada Pembetulan
                              </span>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                            {shown}
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [row.id]: !isOpen }))
                              }
                              className="mt-1 text-xs font-bold text-primary hover:underline"
                            >
                              {isOpen ? "Tutup" : "Baca lagi"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
                          <input
                            type="checkbox"
                            checked={row.is_active}
                            onChange={(e) => onToggle(row, e.target.checked)}
                          />
                          {row.is_active ? "Aktif" : "Tidak Aktif"}
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-bold hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs font-bold text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> Padam
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KbFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: KbRow | null;
  onClose: () => void;
  onSave: (p: { id?: string; category: string; title: string; content: string }) => Promise<void>;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({ id: initial?.id, category: category.trim(), title: title.trim(), content: content.trim() });
    setSaving(false);
  };

  return (
    <ModalShell title={initial ? "Edit Knowledge" : "Tambah Knowledge"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
            Kategori
          </label>
          <input
            list="kb-kategori-list"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <datalist id="kb-kategori-list">
            {KATEGORI_SUGGESTIONS.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Tajuk</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
            Kandungan
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function CorrectionModal({
  event,
  onClose,
  onSave,
}: {
  event: EventRow;
  onClose: () => void;
  onSave: (p: { eventId: string; category: string; title: string; content: string }) => Promise<void>;
}) {
  const defaultTitle = (event.message_text ?? "").slice(0, 80);
  const [category, setCategory] = useState("Lain-lain");
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(event.reply_text ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({
      eventId: String(event.id),
      category: category.trim(),
      title: title.trim(),
      content: content.trim(),
    });
    setSaving(false);
  };

  return (
    <ModalShell title="Betulkan Jawapan" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">Soalan asal</div>
          <p className="whitespace-pre-line">{event.message_text ?? "—"}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {KATEGORI_SUGGESTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Tajuk</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
            Jawapan Betul
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />} Simpan Pembetulan
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const MOD_ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  flagged: { label: "🚩 Flagged", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  auto_deleted: { label: "🗑️ Auto-Padam", cls: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  auto_warned: { label: "⚠️ Auto-Amaran", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  banned: { label: "🚫 Banned", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  unbanned: { label: "✅ Unbanned", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
};

function ModActionBadge({ action }: { action: string }) {
  const s = MOD_ACTION_STYLE[action] ?? {
    label: action,
    cls: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ToggleRow({
  label,
  caption,
  checked,
  onChange,
}: {
  label: string;
  caption: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-4">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ModerationSection({
  settings,
  onSetting,
  domains,
  onAddDomain,
  onDeleteDomain,
  log,
  loading,
  busyId,
  onAction,
}: {
  settings: Record<string, string>;
  onSetting: (key: string, next: boolean) => void;
  domains: DomainRow[];
  onAddDomain: (domain: string) => void;
  onDeleteDomain: (row: DomainRow) => void;
  log: ModLogRow[];
  loading: boolean;
  busyId: string | null;
  onAction: (row: ModLogRow, action: "ban" | "unban") => void;
}) {
  const [domainBaru, setDomainBaru] = useState("");

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-extrabold">🛡️ Moderation</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-3 text-sm font-extrabold uppercase text-muted-foreground">Tetapan Auto</h3>
          <div className="space-y-3">
            <ToggleRow
              label="Auto-Padam Mesej Scam"
              caption="Bot akan cuba padam terus mesej disyaki scam (perlukan bot jadi admin dalam group)"
              checked={settings["scam_auto_delete"] === "true"}
              onChange={(n) => onSetting("scam_auto_delete", n)}
            />
            <ToggleRow
              label="Auto-Amaran Pengguna dalam Group"
              caption="Bot akan reply amaran terus kepada penghantar dalam group"
              checked={settings["scam_auto_warn"] === "true"}
              onChange={(n) => onSetting("scam_auto_warn", n)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-1 text-sm font-extrabold uppercase text-muted-foreground">
            Domain Whitelist
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Bot anggap link ke domain ni selamat (tak flag sebagai scam/spam).
          </p>
          <div className="flex flex-wrap gap-2">
            {domains.length === 0 && (
              <span className="text-sm text-muted-foreground">Tiada domain lagi.</span>
            )}
            {domains.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold"
              >
                {d.domain}
                <button
                  type="button"
                  aria-label={`Padam ${d.domain}`}
                  onClick={() => onDeleteDomain(d)}
                  className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAddDomain(domainBaru);
              setDomainBaru("");
            }}
          >
            <input
              value={domainBaru}
              onChange={(e) => setDomainBaru(e.target.value)}
              placeholder="contoh.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Tambah
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-3 text-sm font-extrabold">
          Log Moderation (30 terkini)
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : log.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Tiada rekod moderation lagi.</div>
        ) : (
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Masa</th>
                <th className="px-4 py-3">Chat ID</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Tindakan</th>
                <th className="px-4 py-3">Sebab / Mesej</th>
                <th className="px-4 py-3">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody>
              {log.map((r) => {
                const boleh =
                  r.user_id != null &&
                  ["flagged", "auto_deleted", "auto_warned"].includes(r.action);
                const bolehUnban = r.user_id != null && r.action === "banned";
                const busy = busyId === r.id;
                return (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatMasa(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">{String(r.chat_id)}</td>
                    <td className="px-4 py-3 text-xs font-bold">
                      {r.username ? `@${r.username}` : `user ${r.user_id ?? "—"}`}
                    </td>
                    <td className="px-4 py-3">
                      <ModActionBadge action={r.action} />
                    </td>
                    <td className="px-4 py-3">{potong(r.reason ?? r.message_text, 60)}</td>
                    <td className="px-4 py-3">
                      {boleh && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAction(r, "ban")}
                          className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} 🚫 Block User
                        </button>
                      )}
                      {bolehUnban && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAction(r, "unban")}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} ✅ Unban
                        </button>
                      )}
                      {!boleh && !bolehUnban && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function TopQuestionsCard({
  cache,
  busy,
  ralat,
  onGenerate,
}: {
  cache: TopQCache | null;
  busy: boolean;
  ralat: string | null;
  onGenerate: () => void;
}) {
  const items = (cache?.results ?? []) as TopQItem[];
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold">🔎 Top Questions</h2>
            {cache ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Dijana {masaRelatif(cache.generated_at)} (analisis {cache.total_messages} soalan,{" "}
                {cache.period_days} hari terakhir)
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Belum ada analisis Top Questions lagi.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {cache ? "🔄 Jana Semula" : "Jana Sekarang"}
          </button>
        </div>

        {ralat && (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {ralat}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {cache ? "Tiada tema dikesan." : "Klik butang di atas untuk jana analisis."}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{it.title}</p>
                  <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                    {it.count}
                  </span>
                </div>
                {it.example && (
                  <p className="mt-1 text-sm italic text-muted-foreground">“{it.example}”</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SettingField({
  label,
  caption,
  value,
  onSave,
  children,
}: {
  label: string;
  caption?: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  children: (v: string, set: (v: string) => void) => React.ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const simpan = async () => {
    setSaving(true);
    setErr(null);
    setOk(false);
    try {
      await onSave(draft);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="font-display text-base font-extrabold">{label}</p>
      {caption && <p className="mt-1 text-xs text-muted-foreground">{caption}</p>}
      <div className="mt-3">{children(draft, setDraft)}</div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={simpan}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
        </button>
        {ok && <span className="text-sm font-bold text-emerald-600">✅ Tersimpan</span>}
        {err && <span className="text-sm font-bold text-destructive">{err}</span>}
      </div>
    </div>
  );
}

function SettingsSection({
  settings,
  onSave,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <SettingField
        label="Model AI"
        value={settings.ai_model ?? ""}
        onSave={(v) => onSave("ai_model", v)}
      >
        {(v, set) => (
          <input
            value={v}
            onChange={(e) => set(e.target.value)}
            placeholder="cth: gpt-5.4-mini"
            className={inputCls}
          />
        )}
      </SettingField>

      <SettingField
        label="Ketepatan Jawapan (Temperature)"
        caption="Nilai rendah = jawapan lebih konsisten. Nilai tinggi = jawapan lebih pelbagai/kreatif."
        value={settings.ai_temperature ?? "0.4"}
        onSave={(v) => onSave("ai_temperature", v)}
      >
        {(v, set) => (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={Number(v) || 0}
              onChange={(e) => set(e.target.value)}
              className="w-full"
            />
            <span className="w-12 shrink-0 text-center font-display font-extrabold">
              {Number(v) || 0}
            </span>
          </div>
        )}
      </SettingField>

      <SettingField
        label="Arahan Tambahan AI"
        caption="Arahan ni akan disertakan terus dalam setiap jawapan AI, tambahan kepada arahan asal."
        value={settings.extra_instructions ?? ""}
        onSave={(v) => onSave("extra_instructions", v)}
      >
        {(v, set) => (
          <textarea
            value={v}
            onChange={(e) => set(e.target.value)}
            rows={8}
            className={inputCls}
          />
        )}
      </SettingField>

      <SettingField
        label="Mesej Alu-aluan Ahli Baru"
        caption="Guna {{name}} untuk letak nama ahli baru secara automatik."
        value={settings.welcome_message_template ?? ""}
        onSave={(v) => onSave("welcome_message_template", v)}
      >
        {(v, set) => (
          <textarea
            value={v}
            onChange={(e) => set(e.target.value)}
            rows={5}
            className={inputCls}
          />
        )}
      </SettingField>
    </section>
  );
}
