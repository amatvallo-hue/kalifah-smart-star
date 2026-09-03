import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ArtikelSenarai {
  slug: string;
  tajuk: string;
  ringkasan: string | null;
  gambar_utama_url: string | null;
  gambar_utama_alt: string | null;
  kategori: string | null;
  tarikh_terbit: string | null;
}

const DESC =
  "Tips, panduan dan idea praktikal untuk ibu bapa bantu anak sekolah rendah kuasai kemahiran KSSR — daripada pasukan Kalifah.my.";

export const Route = createFileRoute("/blog")({
  ssr: true,
  loader: async () => {
    const { data, error } = await supabase
      .from("blog_artikel")
      .select("slug, tajuk, ringkasan, gambar_utama_url, gambar_utama_alt, kategori, tarikh_terbit")
      .eq("status", "published")
      .order("tarikh_terbit", { ascending: false });
    if (error) console.error("[blog] ralat query senarai", error);
    return { artikel: (data ?? []) as ArtikelSenarai[] };
  },
  head: () => ({
    meta: [
      { title: "Blog — Kalifah.my" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Blog — Kalifah.my" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://kalifah.my/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kalifah.my/blog" }],
  }),
  component: BlogIndex,
});

function formatTarikh(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogIndex() {
  const { artikel } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Beranda</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Blog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mt-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Blog Kalifah.my
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{DESC}</p>
        </header>

        {artikel.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
            <p className="font-display text-lg font-extrabold text-foreground">
              Artikel akan datang tak lama lagi
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami sedang siapkan panduan pertama untuk ibu bapa. Nantikan ya!
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artikel.map((a) => (
              <Link
                key={a.slug}
                to="/blog/$slug"
                params={{ slug: a.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5"
              >
                {a.gambar_utama_url ? (
                  <img
                    src={a.gambar_utama_url}
                    alt={a.gambar_utama_alt ?? a.tajuk}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-40 w-full items-center justify-center text-4xl"
                    style={{ backgroundColor: "#1B8A5A15" }}
                    aria-hidden
                  >
                    📚
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  {a.kategori && (
                    <span
                      className="mb-2 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: "#F5A623" }}
                    >
                      {a.kategori}
                    </span>
                  )}
                  <h2 className="font-display text-lg font-extrabold leading-snug text-foreground group-hover:text-primary">
                    {a.tajuk}
                  </h2>
                  {a.ringkasan && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.ringkasan}</p>
                  )}
                  <p className="mt-4 text-xs text-muted-foreground">{formatTarikh(a.tarikh_terbit)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
