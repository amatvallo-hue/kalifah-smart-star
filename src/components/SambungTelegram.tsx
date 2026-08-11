import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BOT = "kalifahassistantbot";

/**
 * Skrin "Sambung Telegram" — WAJIB sebelum mula Percubaan MPT4.
 * Additive: tidak mengubah apa-apa flow sedia ada.
 */
export function SambungTelegram({
  parentId,
  onLinked,
  source,
}: {
  parentId: string;
  onLinked: () => void;
  source?: "kali";
}) {
  const [menunggu, setMenunggu] = useState(false);
  const onLinkedRef = useRef(onLinked);
  onLinkedRef.current = onLinked;

  useEffect(() => {
    if (!menunggu) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("id", parentId)
        .maybeSingle();
      if (cancelled) return;
      const chatId = (data as { telegram_chat_id: number | null } | null)?.telegram_chat_id;
      if (chatId !== null && chatId !== undefined) {
        window.clearInterval(timer);
        onLinkedRef.current();
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [menunggu, parentId]);

  function buka() {
    setMenunggu(true);
    window.open(`https://t.me/${BOT}?start=hubung_${parentId}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="container mx-auto max-w-xl px-4 py-10">
      <section className="rounded-[2rem] bg-gradient-hero p-6 text-center shadow-card md:p-10">
        <span className="text-5xl">💬</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground">
          Sambung <span className="text-primary">Telegram</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sebelum mula, sambungkan Telegram supaya kami boleh hantar peringatan &amp; keputusan
          kepada ibu bapa.
        </p>
      </section>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={buka}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
        >
          <Send className="h-5 w-5" />
          Sambung ke Telegram
        </button>

        {menunggu ? (
          <p className="mt-4 animate-pulse font-display text-sm font-bold text-primary">
            Menunggu sambungan... Tekan “Start” dalam Telegram.
          </p>
        ) : null}
      </div>
    </main>
  );
}
