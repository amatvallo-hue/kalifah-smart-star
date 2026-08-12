import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePoints } from "@/hooks/use-points";
import { switchBackToParent, CHILD_EMAIL_DOMAIN } from "@/lib/child-auth";

export const Route = createFileRoute("/kali-test/laporan-anak")({
  head: () => ({
    meta: [
      { title: "Laporan KALI Anak | Kalifah.my" },
      {
        name: "description",
        content:
          "Laporan diagnostic KALI untuk anak anda — kemahiran yang dikuasai dan yang memerlukan perhatian.",
      },
      { property: "og:title", content: "Laporan KALI Anak | Kalifah.my" },
      {
        property: "og:description",
        content:
          "Laporan diagnostic KALI untuk anak anda — kemahiran yang dikuasai dan yang memerlukan perhatian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const child = typeof search.child === "string" ? search.child : undefined;
    return child ? { child } : {};
  },
  component: LaporanAnakPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

interface Laporan {
  nama: string;
  darjah: number;
  completed_at: string | null;
  betul: number;
  jumlah_menguasai: number;
  jumlah_diperkukuh: number;
  bocor_nama: string | null;
  bocor_gejala: string | null;
  paid: boolean;
}

function LaporanAnakPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const mata = usePoints();

  const childId = search.child;
  const [fetching, setFetching] = useState(true);
  const [laporan, setLaporan] = useState<Laporan | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!childId || !user) return;
    let batal = false;

    (async () => {
      setFetching(true);
      const { data: sess } = await supabase.auth.getSession();
      const email = sess.session?.user?.email ?? "";
      if (email.includes(CHILD_EMAIL_DOMAIN)) {
        await switchBackToParent();
      }
      const { data } = await supabase.rpc("kali_get_laporan_anak" as never, {
        p_child_user_id: childId,
      } as never);
      if (batal) return;
      setLaporan((data as Laporan | null) ?? null);
      setFetching(false);
    })();

    return () => {
      batal = true;
    };
  }, [childId, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/login" });
  };

  const shell = (isi: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={mata} onLogout={handleLogout} />
      <main className="container mx-auto max-w-2xl px-4 py-10">{isi}</main>
    </div>
  );

  const pautanDashboard = (
    <Link
      to="/dashboard/ibu-bapa"
      search={{ tambahAnak: undefined }}
      className="mt-6 inline-flex rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
      style={{ backgroundColor: HIJAU }}
    >
      Ke Dashboard Ibu Bapa →
    </Link>
  );

  if (!childId) {
    return shell(
      <div className="rounded-3xl bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Pautan tidak sah</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pautan laporan ini tidak lengkap.
        </p>
        {pautanDashboard}
      </div>,
    );
  }

  if (loading || fetching) {
    return shell(
      <div className="rounded-3xl bg-card p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Memuatkan laporan…</p>
      </div>,
    );
  }

  if (!laporan) {
    return shell(
      <div className="rounded-3xl bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Laporan tidak dijumpai
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Laporan tidak dijumpai — pastikan anda log masuk sebagai ibu bapa akaun ini.
        </p>
        {pautanDashboard}
      </div>,
    );
  }

  if (!laporan.completed_at) {
    return shell(
      <div className="rounded-3xl bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Belum ada laporan lagi untuk {laporan.nama}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sesi diagnostic KALI belum selesai.
        </p>
        {pautanDashboard}
      </div>,
    );
  }

  return shell(
    <div className="rounded-3xl bg-card p-8 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-lg font-extrabold" style={{ color: HIJAU }}>
          🧠 Laporan KALI untuk {laporan.nama}
        </h1>
        <span
          className="whitespace-nowrap rounded-full px-3 py-1 font-display text-xs font-extrabold shadow-soft"
          style={{ backgroundColor: EMAS, color: "#1a1a1a" }}
        >
          Darjah {laporan.darjah}
        </span>
      </div>

      <h2
        className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl"
        style={{ color: HIJAU }}
      >
        🧠 KALI dah jumpa titik yang perlu diberi perhatian
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Daripada 10 jawapan pertama {laporan.nama}, KALI mengesan satu corak yang patut
        diperkuatkan sebelum pembelajaran diteruskan.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {laporan.betul} daripada 10 soalan dijawab betul
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: `${HIJAU}15`, border: `2px solid ${HIJAU}` }}
        >
          <p className="text-sm font-bold" style={{ color: HIJAU }}>
            🟢 {laporan.jumlah_menguasai} kemahiran dikuasai dengan baik
          </p>
        </div>
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-bold text-destructive">
            🔴 {laporan.jumlah_diperkukuh} kemahiran memerlukan perhatian
          </p>
        </div>
      </div>

      {laporan.bocor_nama && (
        <div className="mt-6">
          <p className="font-display text-sm font-extrabold text-foreground">
            🔴 KALI kesan kesukaran bermula di sini
          </p>
          <div
            className="mt-2 rounded-2xl border-2 p-4"
            style={{ borderColor: "#f59e0b", backgroundColor: "#fffbeb" }}
          >
            <p className="text-sm font-extrabold" style={{ color: "#92400e" }}>
              {laporan.bocor_nama}
            </p>
            <p className="mt-1 text-sm" style={{ color: "#92400e" }}>
              {laporan.nama} tersilap pada soalan berkaitan kemahiran ini.
            </p>
            <p className="mt-3 text-sm font-bold" style={{ color: "#92400e" }}>
              Kenapa ini penting?
            </p>
            <p className="mt-1 text-sm" style={{ color: "#92400e" }}>
              Kemahiran ini menjadi asas kepada pembelajaran seterusnya. Jika bahagian ini
              belum kukuh, latihan yang lebih sukar mungkin tidak menyelesaikan punca sebenar.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="font-display text-lg font-extrabold text-foreground">
          💡 Apa yang KALI akan buat untuk {laporan.nama}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          KALI tidak akan terus beri soalan yang lebih susah. KALI akan kembali mengukuhkan
          kemahiran yang dikesan lemah dahulu, kemudian melihat sama ada {laporan.nama} sudah
          bersedia bergerak ke kemahiran seterusnya.
        </p>
      </div>

      {laporan.paid ? (
        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-foreground">
            Belajar Bersama KALI sudah aktif untuk {laporan.nama}.
          </p>
          <Link
            to="/dashboard/ibu-bapa"
            search={{ tambahAnak: undefined }}
            className="mt-4 inline-flex rounded-full px-8 py-4 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
            style={{ backgroundColor: HIJAU }}
          >
            Teruskan ke Dashboard Ibu Bapa →
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            KALI baru mula mengenali {laporan.nama}. Daripada sesi pertama ini, KALI sudah
            menemui satu bahagian yang memerlukan perhatian. Tetapi satu sesi belum cukup untuk
            memahami keseluruhan corak pembelajaran {laporan.nama}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bila KALI terus belajar bersama {laporan.nama}, KALI akan mengetahui:
          </p>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>🔒 Di mana sebenarnya pemahaman {laporan.nama} mula terputus</p>
            <p>🔒 Sama ada kelemahan datang daripada kemahiran asas sebelumnya</p>
            <p>🔒 Apa yang {laporan.nama} patut belajar selepas ini</p>
            <p>🔒 Bila {laporan.nama} sudah benar-benar bersedia untuk bergerak ke tahap seterusnya</p>
          </div>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/harga",
                  search: {
                    pakej: "satu",
                    darjah: String(laporan.darjah),
                    nama: laporan.nama,
                  },
                })
              }
              className="rounded-full px-8 py-4 text-center font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
              style={{ backgroundColor: HIJAU }}
            >
              <span className="block text-base">Teruskan KALI bersama {laporan.nama} →</span>
              <span className="mt-1 block text-xs font-medium opacity-90">
                RM49 / 1 tahun · Darjah {laporan.darjah}
              </span>
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            KALI akan terus mengenali tahap {laporan.nama} dan memilih pembelajaran berdasarkan
            apa yang {laporan.nama} perlukan.
          </p>
        </div>
      )}
    </div>,
  );
}
