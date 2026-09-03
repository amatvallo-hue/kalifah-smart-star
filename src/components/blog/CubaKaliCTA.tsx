import { Link } from "@tanstack/react-router";

export function CubaKaliCTA({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card p-5 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-4 ${className}`}
    >
      <div>
        <p className="font-display text-base font-extrabold text-foreground">
          Tak pasti nak mula dari mana?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          KALI kesan kemahiran spesifik yang anak belum kuasai — percuma, tanpa daftar.
        </p>
      </div>
      <Link
        to="/cuba-kali-web"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft transition hover:opacity-90 sm:mt-0 sm:w-auto"
        style={{ backgroundColor: "#1B8A5A" }}
      >
        🧪 Cuba KALI Percuma
      </Link>
    </div>
  );
}
