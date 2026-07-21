import { Link, useLocation } from "@tanstack/react-router";

const TABS = [
  { to: "/admin/affiliates/dashboard", label: "📊 Dashboard", match: "/admin/affiliates/dashboard" },
  { to: "/admin/affiliates", label: "👥 Affiliate", match: "/admin/affiliates" },
  { to: "/admin/challenge", label: "🏆 Challenge", match: "/admin/challenge" },
] as const;

export function AdminAffiliateNav() {
  const pathname = useLocation({ select: (s) => s.pathname });

  const isActive = (match: string) => {
    if (match === "/admin/affiliates") {
      // Exact "/admin/affiliates" only — not the dashboard sub-route.
      return pathname === "/admin/affiliates" || (pathname.startsWith("/admin/affiliates/") && !pathname.startsWith("/admin/affiliates/dashboard"));
    }
    return pathname === match || pathname.startsWith(match + "/");
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = isActive(t.match);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Link
        to="/admin"
        className="text-sm font-bold text-muted-foreground hover:text-primary hover:underline"
      >
        ← Kembali ke Admin
      </Link>
    </div>
  );
}
