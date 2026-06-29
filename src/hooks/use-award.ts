import { useAuth } from "./use-auth";
import { tambahMata } from "@/lib/tambah-mata";

/**
 * Returns a function to award 1 mata (default) for a correct answer/action.
 * Silently no-ops if user is not signed in.
 */
export function useAward() {
  const { user } = useAuth();
  return (opts: { sumber: string; darjah: string; subjek: string; mata?: number }) => {
    if (!user) return;
    tambahMata({
      userId: user.id,
      mata: opts.mata ?? 1,
      sumber: opts.sumber,
      darjah: opts.darjah || "0",
      subjek: opts.subjek || "umum",
    });
  };
}
