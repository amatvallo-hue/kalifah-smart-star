import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { CubaKaliCTA } from "@/components/blog/CubaKaliCTA";
import { MarkdownArtikel } from "@/components/blog/MarkdownArtikel";
import { PromoPopupKali } from "@/components/blog/PromoPopupKali";
import logoUrl from "@/assets/kalifah-logo.png";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const BASE = "https://kalifah.my";

interface Artikel {
  slug: string;
  tajuk: string;
  ringkasan: string | null;
  kandungan_markdown: string | null;
  gambar_utama_url: string | null;
  gambar_utama_alt: string | null;
  kategori: string | null;
  tarikh_terbit: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  penulis: string | null;
}

export const Route = createFileRoute("/blog_/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("blog_artikel")
      .select(
        "slug, tajuk, ringkasan, kandungan_markdown, gambar_utama_url, gambar_utama_alt, kategori, tarikh_terbit, updated_at, meta_title, meta_description, penulis",
      )
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) console.error("[blog/$slug] ralat query", error);
    if (!data) throw notFound();
    return data as Artikel;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const a = loaderData as Artikel;
    const title = `${a.meta_title || a.tajuk} — Kalifah.my`;
    const desc = a.meta_description || a.ringkasan || "";
    const url = `${BASE}/blog/${a.slug}`;
    const published = a.tarikh_terbit ? new Date(a.tarikh_terbit).toISOString() : undefined;
    const modified = a.updated_at ? new Date(a.updated_at).toISOString() : published;

    const meta: Record<string, string>[] = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (a.gambar_utama_url) {
      meta.push({ property: "og:image", content: a.gambar_utama_url });
      meta.push({ name: "twitter:image", content: a.gambar_utama_url });
    }
    if (published) meta.push({ property: "article:published_time", content: published });
    if (modified) meta.push({ property: "article:modified_time", content: modified });

    const articleSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.tajuk,
      description: a.ringkasan ?? desc,
      datePublished: published,
      dateModified: modified,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: a.penulis || "Kalifah.my" },
      publisher: {
        "@type": "Organization",
        name: "Kalifah.my",
        logo: { "@type": "ImageObject", url: `${BASE}${logoUrl}` },
      },
    };
    if (a.gambar_utama_url) articleSchema.image = [a.gambar_utama_url];

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Beranda", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: a.tajuk, item: url },
      ],
    };

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleSchema) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) },
      ],
    };
  },
  component: ArtikelPage,
});

function formatTarikh(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArtikelPage() {
  const a = Route.useLoaderData();
  const kandunganRef = useRef<HTMLDivElement>(null);



  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Beranda</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">{a.tajuk}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="mt-6">
          <header>
            {a.kategori && (
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: "#F5A623" }}
              >
                {a.kategori}
              </span>
            )}
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              {a.tajuk}
            </h1>
            <p className="mt-3 text-xs text-muted-foreground">
              {a.penulis || "Kalifah.my"} · {formatTarikh(a.tarikh_terbit)}
            </p>
            {a.ringkasan && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{a.ringkasan}</p>
            )}
          </header>

          {a.gambar_utama_url && (
            <img
              src={a.gambar_utama_url}
              alt={a.gambar_utama_alt ?? a.tajuk}
              className="mt-6 w-full rounded-2xl object-cover"
            />
          )}

          <CubaKaliCTA className="my-8" />

          <div ref={kandunganRef}>
            <MarkdownArtikel kandungan={a.kandungan_markdown ?? ""} />
          </div>

          <CubaKaliCTA className="my-10" />
        </article>

        <PromoPopupKali kandunganRef={kandunganRef} />


        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke Blog
        </Link>
      </main>
    </div>
  );
}
