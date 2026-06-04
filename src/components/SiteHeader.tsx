import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export function SiteHeader({ stars = 0 }: { stars?: number }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <span className="font-display text-xl font-extrabold">ك</span>
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Kalifah<span className="text-primary">.my</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Dashboard" },
            { to: "/kuiz", label: "Kuiz" },
            { to: "/latihan", label: "Latihan" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="rounded-full px-4 py-2 font-display text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 shadow-gold">
          <Star className="h-4 w-4 fill-gold-foreground text-gold-foreground" />
          <span className="font-display text-sm font-extrabold text-gold-foreground">
            {stars}
          </span>
        </div>
      </div>
    </header>
  );
}
