import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, Star, User, Menu, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";

export function SiteHeader({
  stars = 0,
  userName,
  onLogout,
}: {
  stars?: number;
  userName?: string;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const isChild = !!user?.email?.includes(CHILD_EMAIL_DOMAIN);
  const isParentDashboard = location.pathname.startsWith("/dashboard/ibu-bapa");
  const hideStars = profile?.role === "parent" || isParentDashboard;

  const navLinks = (
    <>
      <Link
        to="/pilih-darjah"
        activeOptions={{ exact: true }}
        className="rounded-full px-4 py-2 font-display text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        activeProps={{ className: "bg-secondary text-primary" }}
        onClick={() => setOpen(false)}
      >
        Pilih Darjah
      </Link>
      {userName && isChild && (
        <Link
          to="/dashboard/progress"
          className="rounded-full px-4 py-2 font-display text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-secondary text-primary" }}
          onClick={() => setOpen(false)}
        >
          Progress Saya
        </Link>
      )}
      {userName && !isChild && (
        <Link
          to="/dashboard/ibu-bapa"
          className="rounded-full px-4 py-2 font-display text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "bg-secondary text-primary" }}
          onClick={() => setOpen(false)}
        >
          Ibu Bapa
        </Link>
      )}
    </>
  );

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
          {navLinks}
        </nav>

        <div className="flex items-center gap-2">
          {userName && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="hidden cursor-pointer items-center gap-2 rounded-full bg-secondary px-3 py-1.5 sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-display text-sm font-extrabold text-foreground">{userName}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!hideStars && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Lihat info mata"
                  className="flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 shadow-gold transition hover:-translate-y-0.5"
                >
                  <Star className="h-4 w-4 fill-gold-foreground text-gold-foreground" />
                  <span className="font-display text-sm font-extrabold text-gold-foreground">{stars}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                    <Star className="h-4 w-4 fill-gold-foreground text-gold-foreground" />
                  </span>
                  <div>
                    <p className="font-display text-base font-extrabold text-foreground">
                      Mata Kamu: {stars}
                    </p>
                    <p className="text-xs text-muted-foreground">Cara kumpul mata ⭐</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm font-medium text-foreground">
                  <li className="flex justify-between gap-2"><span>Kuiz</span><span className="font-bold">1 ⭐ / soalan betul</span></li>
                  <li className="flex justify-between gap-2"><span>Latih Tubi</span><span className="font-bold">1 ⭐ / soalan betul</span></li>
                  <li className="flex justify-between gap-2"><span>Game</span><span className="font-bold">1 ⭐ / jawapan betul</span></li>
                </ul>
                <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-primary">
                  Kumpul mata untuk reward istimewa! 🎁
                </p>
              </PopoverContent>
            </Popover>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Log keluar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Buka menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition hover:bg-secondary md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-3/4 sm:max-w-sm">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <div className="mt-8 flex flex-col gap-2">
                {userName && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </span>
                    <span className="font-display text-base font-extrabold text-foreground">{userName}</span>
                  </div>
                )}
                {navLinks}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
