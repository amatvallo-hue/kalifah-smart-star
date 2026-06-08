import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        const keys = [
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "SUPABASE_ANON_KEY",
          "TOYYIBPAY_SECRET_KEY",
        ];
        const result: Record<string, { present: boolean; length: number }> = {};
        for (const k of keys) {
          const v = process.env[k];
          result[k] = { present: !!v, length: v?.length ?? 0 };
        }
        return Response.json(result);
      },
    },
  },
});
