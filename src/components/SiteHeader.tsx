import { Link } from "@tanstack/react-router";
import { LogOut, Star, User } from "lucide-react";

export function SiteHeader({
  stars = 0,
  userName,
  onLogout,
}: {
  stars?: number;
  userName?: string;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-full px-4 py-2 font-display text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-primary" }}
          >
            Pilih Darjah
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {userName && (
            <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="font-display text-sm font-extrabold text-foreground">{userName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 shadow-gold">
            <Star className="h-4 w-4 fill-gold-foreground text-gold-foreground" />
            <span className="font-display text-sm font-extrabold text-gold-foreground">{stars}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Log keluar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
