import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { User, Mail, Phone, Sparkles, CheckCircle2, Send, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field } from "./login";

export const Route = createFileRoute("/ujian-percuma")({
  head: () => ({
    meta: [
      { title: "Ujian Akademik Percuma — Kalifah.my" },
      {
        name: "description",
        content:
          "Semak tahap penguasaan silibus sekolah anak anda dalam 3 minit. 25 soalan ikut darjah, laporan automatik ke email. 100% percuma.",
      },
      { property: "og:title", content: "Ujian Akademik Percuma untuk Anak Anda — Kalifah.my" },
      {
        property: "og:description",
        content: "Semak tahap penguasaan silibus sekolah anak dalam 3 minit. Percuma, tiada kad kredit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: UjianPercumaPage,
});

const DARJAH_OPTIONS = [
  { num: 1, color: "#F4C542" },
  { num: 2, color: "#F28C28" },
  { num: 3, color: "#2E9F5B" },
  { num: 4, color: "#3B82F6" },
  { num: 5, color: "#8B5CF6" },
  { num: 6, color: "#EF4444" },
] as const;

type CreateSessionRow = {
  o_session_id: string;
  o_report_token: string;
  o_is_new: boolean;
  o_current_question: number | null;
  o_status: string | null;
};

function UjianPercumaPage() {
  const [nama, setNama] = useState("");
  const [darjah, setDarjah] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CreateSessionRow | null>(null);
  const [showLinkPanel, setShowLinkPanel] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!darjah) {
      setError("Sila pilih darjah anak.");
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("create_kuiz_sesi", {
      p_nama_anak: nama.trim(),
      p_darjah: darjah,
      p_email: email.trim(),
      p_whatsapp: whatsapp.trim() || null,
    });
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }
    const row = Array.isArray(data) ? (data[0] as CreateSessionRow | undefined) : (data as CreateSessionRow | null);
    if (!row) {
      setError("Ralat tidak dijangka. Sila cuba lagi.");
      setLoading(false);
      return;
    }
    setSession(row);
    setLoading(false);

    if (row.o_is_new && typeof window !== "undefined") {
      if (typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Lead");
      }
      if (typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "generate_lead");
      }
    }
  }

  const soalanUrl =
    session && typeof window !== "undefined"
      ? `${window.location.origin}/ujian-percuma/soalan/${session.o_session_id}`
      : "";

  function copyLink() {
    if (!soalanUrl) return;
    navigator.clipboard.writeText(soalanUrl).then(
      () => toast.success("Link disalin!"),
      () => toast.error("Gagal salin link"),
    );
  }

  function shareWhatsApp() {
    if (!soalanUrl) return;
    const msg = `Assalamualaikum ${nama}, mama/papa dah daftarkan Ujian Akademik Percuma untuk kamu. Sila jawab 25 soalan ni ya (ambil masa lebih kurang 3 minit sahaja): ${soalanUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function goToSoalan() {
    if (!session) return;
    window.location.href = `/ujian-percuma/soalan/${session.o_session_id}`;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-2xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </div>

        <div className="w-full rounded-3xl bg-card p-6 shadow-card md:p-8">
          {!session ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-primary">
                <Sparkles className="h-3 w-3" />
                Ujian Percuma
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
                Adakah anak anda menguasai silibus sekolah?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Semak tahap penguasaan anak dalam 3 minit. 100% percuma.
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 rounded-2xl bg-green-50 px-4 py-3 text-xs font-bold text-green-700 md:text-sm">
                <li className="inline-flex items-center gap-1">✓ 25 soalan ikut darjah</li>
                <li className="inline-flex items-center gap-1">✓ Laporan automatik ke email</li>
                <li className="inline-flex items-center gap-1">✓ Percuma, tiada kad kredit</li>
              </ul>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field icon={User} label="Nama Anak" type="text" value={nama} onChange={setNama} placeholder="cth: Aisyah" autoComplete="off" />

                <div>
                  <span className="mb-1.5 block font-display text-sm font-bold text-foreground">Darjah</span>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {DARJAH_OPTIONS.map((d) => {
                      const selected = darjah === d.num;
                      return (
                        <button
                          type="button"
                          key={d.num}
                          onClick={() => setDarjah(d.num)}
                          className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 font-display text-sm font-extrabold transition ${
                            selected
                              ? "text-white shadow-soft -translate-y-0.5"
                              : "border-border bg-background text-foreground hover:-translate-y-0.5"
                          }`}
                          style={
                            selected
                              ? { backgroundColor: d.color, borderColor: d.color }
                              : undefined
                          }
                        >
                          <span className="text-lg">D{d.num}</span>
                          <span className={`text-[10px] font-bold ${selected ? "text-white/90" : "text-muted-foreground"}`}>
                            Darjah {d.num}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field icon={Mail} label="Email Ibu/Bapa" type="email" value={email} onChange={setEmail} placeholder="contoh@email.com" autoComplete="email" />
                <Field icon={Phone} label="WhatsApp (pilihan)" type="tel" value={whatsapp} onChange={setWhatsapp} placeholder="cth: 0123456789" autoComplete="tel" />

                {error && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {loading ? "Sila tunggu..." : "Mula Semakan"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Tiada kad kredit diperlukan. Laporan dihantar ke email anda.
                </p>
              </form>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-primary">
                <CheckCircle2 className="h-3 w-3" />
                Sesi Dicipta
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
                Bagaimana {nama || "anak anda"} akan menjawab?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pilih salah satu di bawah untuk teruskan.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={goToSoalan}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-6 text-center font-display font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
                >
                  <CheckCircle2 className="h-7 w-7" />
                  <span className="text-lg">Jawab Sekarang</span>
                  <span className="text-xs font-bold opacity-90">Anak ada sebelah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkPanel((v) => !v)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card px-5 py-6 text-center font-display font-extrabold text-primary transition hover:-translate-y-0.5 hover:bg-primary/5"
                >
                  <Send className="h-7 w-7" />
                  <span className="text-lg">Hantar Link Kepada Anak</span>
                  <span className="text-xs font-bold text-muted-foreground">Anak jawab kemudian</span>
                </button>
              </div>

              {showLinkPanel && (
                <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
                  <span className="mb-2 block font-display text-sm font-bold text-foreground">
                    Link untuk anak:
                  </span>
                  <div className="mb-3 break-all rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground md:text-sm">
                    {soalanUrl}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={shareWhatsApp}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Kongsi via WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2.5 font-display text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-primary"
                    >
                      <Copy className="h-4 w-4" />
                      Salin Link
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
