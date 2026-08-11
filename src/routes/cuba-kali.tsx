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

function buildTelegramLink(campaign: string | null): string {
  const payload = campaign ? `cuba_kali_${campaign}` : "cuba_kali";
  return `https://t.me/${BOT_USERNAME}?start=${payload}`;
}

function CubaKaliPage() {
  const viewedRef = useRef(false);

  const campaign =
    typeof window !== "undefined"
      ? sanitizeCampaign(new URLSearchParams(window.location.search).get("utm_campaign"))
      : null;
  const telegramLink = buildTelegramLink(campaign);

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
            Markah hanya beritahu berapa banyak yang salah.{" "}
            <span className="text-primary">KALI cuba cari di mana anak mula tak faham.</span>
          </h1>

          <p className="mt-3 text-base text-muted-foreground">
            Cuba sendiri 6 soalan ringkas dan lihat sendiri di mana pemahaman anak mula terputus.
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTelegramClick("hero")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
          >
            Cuba KALI — Tengok Sendiri →
          </a>

          <p className="mt-3 text-xs font-bold text-muted-foreground">
            ✓ Percuma &nbsp; ✓ Tak perlu daftar &nbsp; ✓ Beberapa minit sahaja
          </p>
        </section>

        {/* TEASER */}
        <section className="mt-10 rounded-3xl bg-card p-6 shadow-card">
          <p className="text-sm font-bold text-foreground">KALI bukan sekadar tengok markah.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Dua orang mungkin dapat markah yang sama, tetapi bahagian yang mereka belum kuasai
            boleh berbeza. KALI melihat kemahiran di sebalik setiap jawapan untuk memahami di mana
            kesukaran mula berlaku.
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              🧠 Contoh apa yang KALI boleh perasan
            </p>
            <ul className="mt-2 space-y-1.5">
              <li className="text-sm font-medium text-foreground">🟢 Kemahiran asas dikuasai</li>
              <li className="text-sm font-medium text-foreground">
                🟠 Ada bahagian yang belum konsisten
              </li>
              <li className="text-sm font-medium text-foreground">
                🔴 Kesan bahagian yang perlu diperkukuhkan
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              KALI kemudian menentukan apa yang patut diberi perhatian seterusnya.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-8 rounded-3xl bg-card p-6 shadow-card">
          <p className="font-display text-lg font-extrabold text-foreground">Cuba sendiri dulu.</p>

          <div className="mt-4 space-y-4">
            {[
              { num: "①", title: "Pilih darjah anak", desc: "Darjah 1 hingga Darjah 6." },
              {
                num: "②",
                title: "Anda jawab 6 soalan",
                desc: "Soalan sebenar berdasarkan darjah yang dipilih.",
              },
              {
                num: "③",
                title: "KALI baca corak jawapan anda",
                desc: "Lihat sendiri apa yang KALI dapat kesan.",
              },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-3">
                <span className="font-display text-xl font-extrabold text-primary">{s.num}</span>
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Lepas anda faham bagaimana KALI berfungsi, barulah cuba dengan anak anda.
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTelegramClick("how_it_works")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold"
          >
            Cuba KALI — Tengok Sendiri →
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
