import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        const keys = Object.keys(process.env ?? {}).sort();
        return Response.json({ keys });
      },
    },
  },
});
