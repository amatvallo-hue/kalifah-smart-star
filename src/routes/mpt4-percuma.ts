import { createFileRoute } from "@tanstack/react-router";

const DESTINATION = "https://kalifah.my/daftar-mpt4";

export const Route = createFileRoute("/mpt4-percuma")({
  server: {
    handlers: {
      GET: async () => Response.redirect(DESTINATION, 301),
    },
  },
});
