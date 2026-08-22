import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { markSkipChildGuard } from "@/lib/child-auth";

export const Route = createFileRoute("/kali-test/mula-percubaan")({
  head: () => ({
    meta: [
      { title: "Mula Percubaan KALI | Kalifah.my" },
      {
        name: "description",
        content:
          "Mulakan ujian ringkas KALI terus dari pelayar web — pilih darjah anak dan mula dalam beberapa saat.",
      },
      { property: "og:title", content: "Mula Percubaan KALI | Kalifah.my" },
      {
        property: "og:description",
        content: "Ujian ringkas KALI terus dari pelayar web, tanpa daftar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: MulaPercubaanPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const DARJAH_LIST = [1, 2, 3, 4, 5, 6];

interface SesiTetamuResponse {
  child_user_id: string;
  hashed_token: string;
  claim_token: string;
  darjah: number;
  creation_request_id: string;
}

function requestIdUntukDarjah(darjah: number): string {
  const key = `kalifah_kali_web_req_${darjah}`;
  if (typeof window === "undefined") return crypto.randomUUID();
  const sedia = window.sessionStorage.getItem(key);
  if (sedia) return sedia;
  const baharu = crypto.randomUUID();
  window.sessionStorage.setItem(key, baharu);
  return baharu;
}

function MulaPercubaanPage() {
  const navigate = useNavigate();
  const [loadingDarjah, setLoadingDarjah] = useState<number | null>(null);
  const [ralat, setRalat] = useState<string | null>(null);

  const mula = async (darjah: number) => {
    if (loadingDarjah !== null) return;
    setRalat(null);
    setLoadingDarjah(darjah);
    try {
      const creationRequestId = requestIdUntukDarjah(darjah);
      const { data, error } = await supabase.functions.invoke("kali-cipta-sesi-tetamu-web", {
        body: { darjah, nama_anak: "Anak", creation_request_id: creationRequestId },
      });

      if (error) {
        const mesej = String(error.message ?? "");
        const kadar =
          mesej.includes("429") ||
          mesej.toLowerCase().includes("rate limit") ||
          (error as { status?: number }).status === 429;
        setRalat(
          kadar
            ? "Terlalu banyak percubaan, sila cuba lagi sebentar."
            : "Maaf, ada masalah teknikal. Sila cuba lagi.",
        );
        setLoadingDarjah(null);
        return;
      }

      const sesi = data as SesiTetamuResponse | null;
      if (!sesi?.hashed_token || !sesi.claim_token) {
        setRalat("Maaf, ada masalah teknikal. Sila cuba lagi.");
        setLoadingDarjah(null);
        return;
      }

      const { error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: sesi.hashed_token,
        type: "recovery",
      });
      if (otpErr) {
        setRalat("Gagal memulakan sesi ujian. Sila cuba lagi.");
        setLoadingDarjah(null);
        return;
      }

      markSkipChildGuard();
      void navigate({
        to: "/kali-test/belajar-untuk-saya",
        search: {
          src: "same_device",
          ct: sesi.claim_token,
          d: String(sesi.darjah ?? darjah),
        },
      });
    } catch {
      setRalat("Maaf, ada masalah teknikal. Sila cuba lagi.");
      setLoadingDarjah(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div
          className="rounded-3xl border-2 bg-card p-6 shadow-soft sm:p-8"
          style={{ borderColor: `${EMAS}55` }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-wider text-white"
            style={{ backgroundColor: HIJAU }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Percubaan KALI
          </div>

          <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            Mula percubaan KALI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pilih darjah anak. KALI akan tanya 10 soalan ringkas untuk kesan di mana jurang
            pembelajaran sebenar anak.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DARJAH_LIST.map((d) => {
              const sedangLoad = loadingDarjah === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={loadingDarjah !== null}
                  onClick={() => void mula(d)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 font-display text-sm font-extrabold text-foreground transition hover:text-white disabled:opacity-60"
                  style={{
                    borderColor: `${HIJAU}55`,
                    backgroundColor: sedangLoad ? HIJAU : "transparent",
                    color: sedangLoad ? "#fff" : undefined,
                  }}
                >
                  {sedangLoad && <Loader2 className="h-4 w-4 animate-spin" />}
                  Darjah {d}
                </button>
              );
            })}
          </div>

          {ralat && (
            <p
              className="mt-5 rounded-2xl border-2 px-4 py-3 text-sm font-semibold"
              style={{ borderColor: "#EF444455", color: "#B91C1C" }}
            >
              {ralat}
            </p>
          )}

          <p className="mt-6 text-[11px] leading-snug text-muted-foreground">
            Tiada pendaftaran diperlukan. Akaun sementara akan dicipta automatik untuk sesi ujian
            ini.
          </p>
        </div>
      </main>
    </div>
  );
}
