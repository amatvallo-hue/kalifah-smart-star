import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Testimoni {
  id: string;
  telegram_first_name: string | null;
  telegram_username: string | null;
  feedback_text: string | null;
  consent: boolean | null;
  used_in_marketing: boolean | null;
  created_at: string;
}

type FilterKey = "semua" | "boleh" | "peribadi" | "belum";

const BULAN = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

function tarikhMs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function AdminTestimoni() {
  const [rows, setRows] = useState<Testimoni[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("semua");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("testimoni")
        .select(
          "id, telegram_first_name, telegram_username, feedback_text, consent, used_in_marketing, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[AdminTestimoni]", error);
        toast.error("Gagal memuatkan testimoni.");
      }
      setRows((data as Testimoni[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  const counts = useMemo(
    () => ({
      semua: rows.length,
      boleh: rows.filter((r) => r.consent === true).length,
      peribadi: rows.filter((r) => r.consent === false).length,
      belum: rows.filter((r) => r.consent === null).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    if (filter === "boleh") return rows.filter((r) => r.consent === true);
    if (filter === "peribadi") return rows.filter((r) => r.consent === false);
    if (filter === "belum") return rows.filter((r) => r.consent === null);
    return rows;
  }, [rows, filter]);

  async function toggleUsed(row: Testimoni, next: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, used_in_marketing: next } : r)),
    );
    const { error } = await supabase
      .from("testimoni")
      .update({ used_in_marketing: next })
      .eq("id", row.id);
    if (error) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, used_in_marketing: !next } : r,
        ),
      );
      toast.error("Gagal kemaskini status marketing.");
    } else {
      toast.success(next ? "Ditanda sebagai digunakan." : "Tanda dibuang.");
    }
  }

  async function salin(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Disalin!");
    } catch {
      toast.error("Gagal salin teks.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "boleh", label: "Boleh Guna Testimoni" },
    { key: "peribadi", label: "Peribadi" },
    { key: "belum", label: "Belum Jawab" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Jumlah Testimoni" value={counts.semua} />
        <Kpi label="Boleh Guna" value={counts.boleh} tone="ok" />
        <Kpi label="Belum Jawab" value={counts.belum} tone="warn" />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
          Belum ada testimoni/feedback setakat ini.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-extrabold text-foreground">
                    {r.telegram_first_name?.trim() || "Parent"}
                    {r.telegram_username ? (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        @{r.telegram_username}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tarikhMs(r.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge consent={r.consent} />
                  {r.consent === true && r.used_in_marketing ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      Digunakan ✓
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {r.feedback_text || <span className="text-muted-foreground">(tiada teks)</span>}
              </p>

              {r.consent === true && (
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => salin(r.feedback_text ?? "")}
                  >
                    📋 Salin Teks
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Checkbox
                      checked={!!r.used_in_marketing}
                      onCheckedChange={(v) => toggleUsed(r, v === true)}
                    />
                    Dah digunakan dalam marketing
                  </label>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  const toneClass =
    tone === "ok"
      ? "text-primary"
      : tone === "warn"
      ? "text-gold-foreground"
      : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ consent }: { consent: boolean | null }) {
  if (consent === true)
    return (
      <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
        ✅ Boleh guna testimoni
      </span>
    );
  if (consent === false)
    return (
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
        🔒 Peribadi sahaja
      </span>
    );
  return (
    <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold-foreground">
      ⏳ Belum jawab kebenaran
    </span>
  );
}
