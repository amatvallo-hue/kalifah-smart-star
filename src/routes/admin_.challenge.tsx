import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminAffiliateNav } from "@/components/AdminAffiliateNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/challenge")({
  head: () => ({ meta: [{ title: "Challenge Bulanan — Admin Kalifah.my" }] }),
  ssr: false,
  component: AdminChallengePage,
});

interface Challenge {
  id: string;
  bulan: number;
  tahun: number;
  target_jualan: number;
  bonus_rm: number;
  aktif: boolean;
  created_at: string;
}

const BULAN_LABEL = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

function AdminChallengePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [ranking, setRanking] = useState<{ id: string; nama: string; avatar_url: string | null; jualan: number }[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);

  const now = new Date();
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(now.getFullYear());
  const [target, setTarget] = useState<number>(10);
  const [bonus, setBonus] = useState<number>(50);
  const [aktif, setAktif] = useState<boolean>(true);

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
        await loadItems();
        await loadRanking();
      } else {
        navigate({ to: "/" });
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase
      .from("challenge_bulanan")
      .select("*")
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false });
    setItems((data as Challenge[]) ?? []);
    setLoading(false);
  }

  async function loadRanking() {
    setRankingLoading(true);
    const now = new Date();
    const bulanNow = now.getMonth() + 1;
    const tahunNow = now.getFullYear();
    const firstDay = new Date(tahunNow, bulanNow - 1, 1).toISOString();

    const { data: chData } = await supabase
      .from("challenge_bulanan")
      .select("*")
      .eq("bulan", bulanNow)
      .eq("tahun", tahunNow)
      .eq("aktif", true)
      .maybeSingle();
    const ch = (chData as Challenge | null) ?? null;
    setActiveChallenge(ch);

    if (!ch) {
      setRanking([]);
      setRankingLoading(false);
      return;
    }

    const { data: jualanData } = await supabase
      .from("affiliate_jualan")
      .select("affiliate_id")
      .gte("created_at", firstDay);

    const counts: Record<string, number> = {};
    for (const j of (jualanData ?? []) as { affiliate_id: string }[]) {
      counts[j.affiliate_id] = (counts[j.affiliate_id] || 0) + 1;
    }
    const ids = Object.keys(counts);
    if (ids.length === 0) {
      setRanking([]);
      setRankingLoading(false);
      return;
    }
    const { data: affData } = await supabase
      .from("affiliates")
      .select("id, nama, avatar_url")
      .in("id", ids);
    const affs = (affData ?? []) as { id: string; nama: string; avatar_url: string | null }[];
    const merged = affs
      .map((a) => ({ ...a, jualan: counts[a.id] ?? 0 }))
      .sort((a, b) => b.jualan - a.jualan);
    setRanking(merged);
    setRankingLoading(false);
  }

  async function simpan() {
    if (bulan < 1 || bulan > 12) {
      toast.error("Bulan mesti antara 1-12");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("challenge_bulanan")
      .upsert(
        { bulan, tahun, target_jualan: target, bonus_rm: bonus, aktif },
        { onConflict: "bulan,tahun" },
      );
    setSaving(false);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return;
    }
    toast.success("Challenge disimpan");
    await loadItems();
  }

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <AdminAffiliateNav />
        <h1 className="font-display text-3xl font-extrabold">Challenge Bulanan</h1>


        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-extrabold">Cipta / Kemaskini</h2>
          <p className="text-xs text-muted-foreground">
            Jika bulan & tahun sudah wujud, rekod akan dikemaskini.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bulan">Bulan (1-12)</Label>
              <Input
                id="bulan"
                type="number"
                min={1}
                max={12}
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="target">Target Jualan</Label>
              <Input
                id="target"
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="bonus">Bonus (RM)</Label>
              <Input
                id="bonus"
                type="number"
                step="0.01"
                min={0}
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="aktif"
              checked={aktif}
              onCheckedChange={(v) => setAktif(Boolean(v))}
            />
            <Label htmlFor="aktif" className="cursor-pointer">
              Aktif
            </Label>
          </div>
          <div className="mt-5">
            <Button onClick={simpan} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan Challenge
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-extrabold">Senarai Challenge</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan / Tahun</TableHead>
                  <TableHead>Target Jualan</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Memuatkan...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Tiada challenge lagi.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {BULAN_LABEL[c.bulan - 1]} {c.tahun}
                      </TableCell>
                      <TableCell>{c.target_jualan}</TableCell>
                      <TableCell>RM {Number(c.bonus_rm).toFixed(2)}</TableCell>
                      <TableCell>
                        {c.aktif ? (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                            Tidak aktif
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setBulan(c.bulan);
                            setTahun(c.tahun);
                            setTarget(c.target_jualan);
                            setBonus(Number(c.bonus_rm));
                            setAktif(c.aktif);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <Trophy className="h-5 w-5 text-amber-600" /> Ranking Bulan Ini
          </h2>
          {rankingLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuatkan…
            </div>
          ) : !activeChallenge ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Tiada challenge aktif bulan ini.
            </p>
          ) : ranking.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Belum ada jualan bulan ini.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Target: <span className="font-bold text-foreground">{activeChallenge.target_jualan} jualan</span> · Bonus: <span className="font-bold text-amber-700">RM {Number(activeChallenge.bonus_rm).toFixed(2)}</span>
              </p>
              <ul className="space-y-2">
                {ranking.map((r, i) => {
                  const pct = Math.min(100, Math.round((r.jualan / activeChallenge.target_jualan) * 100));
                  const isPemenang = r.jualan >= activeChallenge.target_jualan;
                  return (
                    <li key={r.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-extrabold text-foreground">
                          {i + 1}
                        </div>
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt={r.nama} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                            {r.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">{r.nama}</span>
                            {isPemenang && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                🏆 Pemenang
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {r.jualan} / {activeChallenge.target_jualan} jualan
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${isPemenang ? "bg-amber-500" : "bg-primary"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
