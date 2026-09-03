import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE = "https://kalifah.my";

const STATIC_PATHS = ["/", "/harga", "/blog", "/cuba-kali-web"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let artikel: { slug: string; updated_at: string | null }[] = [];
        const { data, error } = await supabase
          .from("blog_artikel")
          .select("slug, updated_at")
          .eq("status", "published")
          .order("updated_at", { ascending: false });
        if (error) {
          console.error("[sitemap] gagal query blog_artikel", error);
        } else if (data) {
          artikel = data as { slug: string; updated_at: string | null }[];
        }

        const urls = [
          ...STATIC_PATHS.map((p) => `  <url>\n    <loc>${BASE}${p}</loc>\n  </url>`),
          ...artikel.map(
            (a) =>
              `  <url>\n    <loc>${BASE}/blog/${encodeURIComponent(a.slug)}</loc>` +
              (a.updated_at ? `\n    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>` : "") +
              `\n  </url>`,
          ),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
