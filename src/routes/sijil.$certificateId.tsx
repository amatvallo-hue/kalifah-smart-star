import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { KalifahLogo } from "@/components/KalifahLogo";
import { supabase } from "@/integrations/supabase/client";
import { cosmeticCertId, bersihkanTopik } from "@/lib/sijil";

export const Route = createFileRoute("/sijil/$certificateId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sahkan Sijil — Kalifah.my" },
      { name: "description", content: "Semak keaslian Sijil Cemerlang Kalifah.my dengan mengimbas kod QR." },
      { property: "og:title", content: "Sahkan Sijil — Kalifah.my" },
      { property: "og:description", content: "Semak keaslian Sijil Cemerlang Kalifah.my." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SijilVerifikasi,
});

const DEEP = "#013E37";

interface Rekod {
  nama_pelajar: string;
  subjek: string;
  topik: string;
  darjah: string;
  tarikh: string;
  kod_sijil: string;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function SijilVerifikasi() {
  const { certificateId } = useParams({ from: "/sijil/$certificateId" });
  const [loading, setLoading] = useState(true);
  const [rekod, setRekod] = useState<Rekod | null>(null);

  useEffect(() => {
    let batal = false;
    async function muat() {
      if (!UUID_RE.test(certificateId)) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc("get_sijil_verification", { p_id: certificateId });
      if (batal) return;
      if (!error && Array.isArray(data) && data.length > 0) setRekod(data[0] as Rekod);
      setLoading(false);
    }
    muat();
    return () => {
      batal = true;
    };
  }, [certificateId]);

  const tarikhTeks = rekod?.tarikh
    ? new Date(rekod.tarikh + "T00:00:00").toLocaleDateString("ms-MY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const certId = rekod
    ? cosmeticCertId(`Darjah ${rekod.darjah}`, rekod.subjek, rekod.tarikh, certificateId)
    : "";

  return (
    <main className="min-h-screen bg-[#FFFBF0] px-4 py-10">
      <div className="mx-auto flex max-w-lg flex-col items-center">
        <KalifahLogo className="h-8 w-auto" />

        <div
          className="mt-8 w-full rounded-3xl border-2 bg-card p-6 text-center shadow-soft sm:p-8"
          style={{ borderColor: DEEP }}
        >
          {loading ? (
            <p className="py-10 text-muted-foreground">Menyemak sijil…</p>
          ) : !rekod ? (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground">
                Sijil tidak dijumpai
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Kod sijil ini tidak sah atau tidak wujud dalam rekod Kalifah.my.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14" style={{ color: "#1B8A5A" }} />
              <h1 className="mt-3 font-display text-2xl font-extrabold" style={{ color: DEEP }}>
                Sijil Sah
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sijil ini dikeluarkan secara rasmi oleh Kalifah.my
              </p>

              <div className="mt-6 rounded-2xl bg-[#FFF6D6] p-5">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Nama Pelajar
                </p>
                <p className="font-display text-2xl font-extrabold" style={{ color: DEEP }}>
                  {rekod.nama_pelajar}
                </p>

                <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Pencapaian
                </p>
                <p className="text-sm font-bold text-foreground">
                  {rekod.subjek} — {bersihkanTopik(rekod.topik)} — Darjah {rekod.darjah}
                </p>

                <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Tarikh
                </p>
                <p className="text-sm text-foreground">{tarikhTeks}</p>
              </div>

              <p className="mt-5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Certificate ID
              </p>
              <p className="font-mono text-sm font-bold" style={{ color: DEEP }}>
                {certId}
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Kalifah.my — Portal Pembelajaran Sekolah Rendah</p>
      </div>
    </main>
  );
}
