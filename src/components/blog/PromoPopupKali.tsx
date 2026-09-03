import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KEY = "kalifah_blog_promo_shown";
const MASA_AKTIF_MS = 30_000;
const AMBANG_SCROLL = 0.5;

function sudahDipapar(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    // storage tak boleh diakses -> disable senyap
    return true;
  }
}

function tandaDipapar(): void {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // abaikan
  }
}

export function PromoPopupKali({
  kandunganRef,
}: {
  kandunganRef: React.RefObject<HTMLElement | null>;
}) {
  const navigate = useNavigate();
  const [buka, setBuka] = useState(false);
  const scrollCukup = useRef(false);
  const masaCukup = useRef(false);

  useEffect(() => {
    if (sudahDipapar()) return;

    let dibatalkan = false;
    let msTerkumpul = 0;
    let mulaKira = document.hidden ? null : Date.now();

    const papar = () => {
      if (dibatalkan) return;
      if (!scrollCukup.current || !masaCukup.current) return;
      if (sudahDipapar()) return;
      tandaDipapar();
      setBuka(true);
      bersihkan();
    };

    const semakScroll = () => {
      const el = kandunganRef.current;
      if (!el) return;
      if (window.scrollY <= 0) return;
      const rect = el.getBoundingClientRect();
      const tinggi = rect.height;
      if (tinggi <= 0) return;
      const dibaca = window.innerHeight - rect.top;
      if (dibaca / tinggi >= AMBANG_SCROLL) {
        scrollCukup.current = true;
        window.removeEventListener("scroll", semakScroll);
        papar();
      }
    };


    const tick = () => {
      if (mulaKira !== null) {
        msTerkumpul += Date.now() - mulaKira;
        mulaKira = Date.now();
      }
      if (msTerkumpul >= MASA_AKTIF_MS) {
        masaCukup.current = true;
        papar();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (mulaKira !== null) {
          msTerkumpul += Date.now() - mulaKira;
          mulaKira = null;
        }
      } else if (mulaKira === null) {
        mulaKira = Date.now();
      }
    };

    const interval = window.setInterval(tick, 1000);
    window.addEventListener("scroll", semakScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    semakScroll();

    function bersihkan() {
      window.clearInterval(interval);
      window.removeEventListener("scroll", semakScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    }

    return () => {
      dibatalkan = true;
      bersihkan();
    };
  }, [kandunganRef]);

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogContent className="max-w-md rounded-2xl border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold leading-snug text-foreground">
            Dah baca tips, tapi masih tak pasti nak mula di mana?
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed">
            Bantu anak jawab 10 soalan bersama KALI untuk dapatkan gambaran awal kemahiran yang
            mungkin perlukan perhatian.
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">Percuma. Tak perlu daftar untuk mula mencuba.</p>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => {
              setBuka(false);
              void navigate({ to: "/cuba-kali-web" });
            }}
            className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft transition hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: "#1B8A5A" }}
          >
            Cuba KALI Percuma
          </button>
          <button
            type="button"
            onClick={() => setBuka(false)}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 font-display text-sm font-bold text-muted-foreground transition hover:text-foreground sm:w-auto"
          >
            Sambung baca
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
