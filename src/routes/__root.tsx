import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAuth } from "@/hooks/use-auth";
import { CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";
import { supabase } from "@/integrations/supabase/client";
import { KalifahHatiCheckIn } from "@/components/KalifahHatiCheckIn";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kalifah.my — Portal Pembelajaran Kanak-kanak" },
      { name: "description", content: "Portal pembelajaran Islamik dan moden untuk kanak-kanak Malaysia umur 7-12 tahun. Kuiz interaktif, latihan bertulis, dan ganjaran bintang." },
      { name: "author", content: "Kalifah.my" },
      { property: "og:title", content: "Kalifah.my — Portal Pembelajaran Kanak-kanak" },
      { property: "og:description", content: "Portal pembelajaran Islamik dan moden untuk kanak-kanak Malaysia umur 7-12 tahun. Kuiz interaktif, latihan bertulis, dan ganjaran bintang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Kalifah.my — Portal Pembelajaran Kanak-kanak" },
      { name: "twitter:description", content: "Portal pembelajaran Islamik dan moden untuk kanak-kanak Malaysia umur 7-12 tahun. Kuiz interaktif, latihan bertulis, dan ganjaran bintang." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d856500-3c9b-4006-8fff-c62bfb3d4ed5/id-preview-97eb0baa--859d48b0-ffb7-42b7-b503-b9258e9c04b2.lovable.app-1780570250465.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7d856500-3c9b-4006-8fff-c62bfb3d4ed5/id-preview-97eb0baa--859d48b0-ffb7-42b7-b503-b9258e9c04b2.lovable.app-1780570250465.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <meta name="facebook-domain-verification" content="gr7bl1xpq04xbdo6qsm8e188il63c9" />
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','664592267901017');fbq('track','PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=664592267901017&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && ref.trim().length > 0) {
      const code = ref.trim().toUpperCase().slice(0, 64);
      const existing = window.localStorage.getItem("kalifah_ref");
      window.localStorage.setItem("kalifah_ref", code);
      if (existing !== code) {
        // Increment klik untuk ref baru
        fetch("https://pgpkqbdyxoejwvubluqq.supabase.co/rest/v1/rpc/affiliate_increment_klik", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncGtxYmR5eG9land2dWJsdXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjcyMjAsImV4cCI6MjA5NjE0MzIyMH0.dWoxARe5MfuHuCtMn53z50Kxh_-UjnqGnh8XREzPUUo",
          },
          body: JSON.stringify({ _ref: code }),
        }).catch((e) => console.warn("[ref] klik gagal", e));
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
