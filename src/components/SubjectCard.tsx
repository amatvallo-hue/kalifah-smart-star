import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface Props {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  progress: number;
  tone: "emerald" | "gold" | "sky" | "rose";
}

const tones = {
  emerald: "from-primary to-primary-glow text-primary-foreground",
  gold: "from-gold to-gold/80 text-gold-foreground",
  sky: "from-sky-400 to-sky-300 text-sky-900",
  rose: "from-rose-400 to-rose-300 text-rose-900",
};

export function SubjectCard({ to, title, description, icon: Icon, progress, tone }: Props) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} shadow-soft transition group-hover:scale-110`}
      >
        <Icon className="h-7 w-7" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-display text-xl font-extrabold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Kemajuan</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
