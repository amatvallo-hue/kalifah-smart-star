import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KalifahLogo } from "@/components/KalifahLogo";

const BOT_USERNAME = "kalifahassistantbot";

export const Route = createFileRoute("/cuba-kali")({
  head: () => ({
    meta: [
      { title: "Cuba KALI Percuma — Tak Perlu Daftar — Kalifah.my" },
      {
        name: "description",
        content:
          "Jawab 6 soalan ringkas dan lihat sendiri bagaimana KALI membaca corak jawapan anda. Tak perlu daftar, tak perlu kad.",
      },
      { property: "og:title", content: "Cuba KALI Percuma — Tak Perlu Daftar — Kalifah.my" },
      {
        property: "og:description",
        content: "Jawab 6 soalan ringkas dan lihat sendiri bagaimana KALI membaca corak jawapan anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: CubaKaliPage,
});

function sanitizeCampaign(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .slice(0, 40);
  return cleaned.length > 0 ? cleaned : null;
}

// Padanan sama macam sanitizeRef() di daftar.tsx/harga.tsx.
function sanitizeRef(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toUpperCase().slice(0, 64);
  return /^[A-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

// Ref affiliate diutamakan drpd campaign dalam payload /start (Telegram
// hadkan start param ~64 aksara) -- kali-telegram-bot v8 parse format
// "cuba_kali_ref_{KOD}" ni. Rujuk memory kali_flow_b_cuba_kali_guest_arch
// (gap: ref hilang merentas Telegram/device sebelum ni).
function buildTelegramLink(campaign: string | null, ref: string | null): string {
  if (ref) return `https://t.me/${BOT_USERNAME}?start=cuba_kali_ref_${ref.slice(0, 40)}`;
  const payload = campaign ? `cuba_kali_${campaign}` : "cuba_kali";
  return `https://t.me/${BOT_USERNAME}?start=${payload}`;
}

function CubaKaliPage() {
  const viewedRef = useRef(false);

  const campaign =
    typeof window !== "undefined"
      ? sanitizeCampaign(new URLSearchParams(window.location.search).get("utm_campaign"))
      : null;
  const ref =
    typeof window !== "undefined"
      ? sanitizeRef(new URLSearchParams(window.location.search).get("ref"))
      : null;
  const telegramLink = buildTelegramLink(campaign, ref);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Simpan attribution penuh (konsisten dengan landing page KALI lain macam /daftar-kali)
    const params = new URLSearchParams(window.location.search);
    const attributionKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
    ] as const;
    for (const key of attributionKeys) {
      const value = params.get(key);
      if (value && value.trim().length > 0) {
        window.localStorage.setItem(`kalifah_${key}`, value.trim());
      }
    }

    if (!viewedRef.current) {
      viewedRef.current = true;
      void supabase
        .from("analytics_events")
        .insert({
          event_name: "cuba_kali_landing_viewed",
          user_id: null,
          metadata: { landing_page: "cuba-kali", campaign },
        })
        .then(
          () => {},
          () => {},
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trackTelegramClick(position: "hero" | "how_it_works") {
    void supabase
      .from("analytics_events")
      .insert({
        event_name: "cuba_kali_telegram_clicked",
        user_id: null,
        metadata: { landing_page: "cuba-kali", cta_position: position, campaign },
      })
      .then(
        () => {},
        () => {},
      );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto max-w-xl px-4 py-12">
        {/* HERO */}
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-display text-xs font-bold text-primary">
            <Brain className="h-3.5 w-3.5" />
            KALI • Kalifah.my
          </span>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Anak selalu salah soalan…{" "}
            <span className="text-primary">tapi kita tahu tak dia mula tak faham dari mana?</span>
          </h1>

          <p className="mt-3 text-base text-muted-foreground">
            Kadang-kadang masalahnya bukan pada soalan yang dia salah hari ini. Ada kemahiran asas
            sebelumnya yang belum betul-betul kukuh. KALI cuba mencarinya.
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTelegramClick("hero")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
          >
            🧠 Cuba 6 Soalan — Biar KALI Cari
          </a>

          <p className="mt-3 text-xs font-bold text-muted-foreground">
            ✓ Percuma &nbsp; ✓ Tak perlu daftar &nbsp; ✓ ±2 minit
          </p>
        </section>

        {/* PROOF: contoh rantaian kemahiran */}
        <section className="mt-10 rounded-3xl bg-card p-6 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Contoh: Anak Dapat 6/10 Matematik
          </p>

          <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm font-bold text-foreground">🟢 Mengenal nilai wang</p>
            </div>
            <div className="text-center text-muted-foreground">↓</div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm font-bold text-foreground">🟠 Operasi melibatkan wang</p>
            </div>
            <div className="text-center text-muted-foreground">↓</div>
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm font-bold text-foreground">🔴 Penyelesaian masalah wang</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Markah cuma nampak
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold text-foreground">6/10</p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">KALI cuba nampak</p>
              <p className="mt-1 text-sm text-foreground">
                Kesukaran mula muncul apabila soalan memerlukan operasi wang. Jadi mungkin tak perlu
                ulang semuanya dari awal.
              </p>
            </div>
          </div>
        </section>

        {/* PROOF: dua anak, markah sama, punca berbeza */}
        <section className="mt-6 rounded-3xl bg-card p-6 shadow-card">
          <p className="font-display text-lg font-extrabold text-foreground">
            Dua anak sama-sama dapat 6/10. Puncanya belum tentu sama.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Anak A</p>
              <p className="mt-2 text-sm font-bold text-foreground">🔴 Lemah asas</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Anak B</p>
              <p className="mt-2 text-sm font-bold text-foreground">🟢 Asas kukuh</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                🔴 Tersangkut bila soalan jadi lebih kompleks
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-extrabold text-primary">
            Markah sama. Apa yang perlu mereka belajar selepas ini berbeza.
          </p>
        </section>

        {/* MECHANISM / emotional bridge */}
        <section className="mt-6 rounded-3xl bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">
            Sebab itu kadang-kadang &ldquo;buat lebih banyak latihan&rdquo; belum tentu jawapannya.
            Kalau kita tak tahu bahagian mana yang sebenarnya belum kukuh, anak mungkin terus diberi
            soalan yang terlalu sukar — atau mengulang perkara yang dia sebenarnya sudah tahu.
          </p>
          <p className="mt-2 text-sm font-bold text-foreground">KALI cuba mulakan dari tempat yang betul.</p>
        </section>

        {/* PERSONAL CURIOSITY + CTA akhir */}
        <section className="mt-6 rounded-3xl bg-card p-6 shadow-card">
          <p className="font-display text-lg font-extrabold text-foreground">
            Sekarang cuba pada diri anda dulu.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih darjah anak → Jawab 6 soalan → Lihat apa KALI jumpa
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTelegramClick("how_it_works")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
          >
            Cuba KALI Sekarang →
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Anda akan dibawa ke Telegram untuk memulakan demo.
          </p>
        </section>

        {/* BOTTOM */}
        <section className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Tak perlu daftar. Tak perlu masukkan email. Cuba dulu, kemudian baru buat keputusan.
          </p>
          <div className="mt-5 flex flex-col items-center gap-1">
            <KalifahLogo className="h-6" />
            <p className="text-xs text-muted-foreground">Kalifah.my · Belajar Bersama KALI</p>
          </div>
        </section>
      </div>
    </div>
  );
}
