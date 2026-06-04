import { Star } from "lucide-react";

export function StarReward({ earned, total = 3 }: { earned: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          className={`h-6 w-6 transition ${
            i < earned
              ? "fill-gold text-gold animate-pop"
              : "fill-muted text-muted-foreground/40"
          }`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
