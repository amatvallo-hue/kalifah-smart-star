import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminAffiliateNav } from "@/components/AdminAffiliateNav";

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
};

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

function AdminTelegramPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ralat, setRalat] = useState<string | null>(null);

  const [uniqueChats, setUniqueChats] = useState(0);
  const [eventHariIni, setEventHariIni] = useState(0);
  const [event7Hari, setEvent7Hari] = useState(0);
  const [pecahan, setPecahan] = useState<{ event_type: string; bil: number }[]>([]);
  const [aiRows, setAiRows] = useState<EventRow[]>([]);

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

      const [semua, hariIni, tujuhHari, ai] = await Promise.all([
        supabase.from("telegram_bot_events").select("chat_id, event_type"),
        supabase
          .from("telegram_bot_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart),
        supabase
          .from("telegram_bot_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekStart),
        supabase
          .from("telegram_bot_events")
          .select("id, created_at, chat_id, chat_type, event_type, message_text, reply_text")
          .in("event_type", ["ai_dm", "ai_group"])
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const err = semua.error || hariIni.error || tujuhHari.error || ai.error;
      if (err) {
        console.error("[admin/telegram]", err);
        setRalat(err.message);
      }

      const rows = (semua.data ?? []) as { chat_id: number | string; event_type: string }[];
      setUniqueChats(new Set(rows.map((r) => String(r.chat_id))).size);

      const kira = new Map<string, number>();
      for (const r of rows) kira.set(r.event_type, (kira.get(r.event_type) ?? 0) + 1);
      setPecahan(
        [...kira.entries()]
          .map(([event_type, bil]) => ({ event_type, bil }))
          .sort((a, b) => b.bil - a.bil),
      );

      setEventHariIni(hariIni.count ?? 0);
      setEvent7Hari(tujuhHari.count ?? 0);
      setAiRows((ai.data ?? []) as EventRow[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  const maxBil = useMemo(
    () => pecahan.reduce((m, p) => Math.max(m, p.bil), 0),
    [pecahan],
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
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="👥 Pengguna Unik (chat)" value={String(uniqueChats)} />
            <StatCard label="📅 Event Hari Ini" value={String(eventHariIni)} />
            <StatCard label="🗓️ Event 7 Hari" value={String(event7Hari)} highlight />
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

          <section className="mt-8">
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
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Masa</th>
                      <th className="px-4 py-3">Jenis Chat</th>
                      <th className="px-4 py-3">Soalan</th>
                      <th className="px-4 py-3">Jawapan Bot</th>
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
                        <td className="max-w-xs px-4 py-3 whitespace-pre-line">
                          {r.message_text ?? "—"}
                        </td>
                        <td className="max-w-md px-4 py-3 whitespace-pre-line text-muted-foreground">
                          {r.reply_text ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
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
