import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Star, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { HARGA_ASAL, PAKEJ_LIST, DARJAH_LIST } from "@/lib/curriculum";
import { supabase } from "@/integrations/supabase/client";
import { KalifahLogo } from "@/components/KalifahLogo";
import { SambungTelegram } from "@/components/SambungTelegram";

export const Route = createFileRoute("/harga")({
  head: () => ({
    meta: [
      { title: "Harga Pakej — Kalifah.my" },
      { name: "description", content: "Pakej langganan Kalifah.my untuk Darjah 1–6. Bermula dari RM29/tahun." },
    ],
  }),
  ssr: true,
  component: HargaPage,
});

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";

type PakejId = "satu" | "perDarjah" | "bundle";

interface AksesStatusRow {
  darjah: number;
  status: "lifetime" | "active" | "expiring_soon" | "expired_shadow" | "missing";
  expires_at: string | null;
  hari_baki: number | null;
}


function HargaPage() {
  const navigate = useNavigate();
  const [pickerFor, setPickerFor] = useState<PakejId | null>(null);
  const [pickerInitial, setPickerInitial] = useState<number[]>([]);
  const [loading, setLoading] = useState<PakejId | null>(null);
  const [fastpath, setFastpath] = useState<{ nama: string; darjah: number } | null>(null);
  const [aksesStatus, setAksesStatus] = useState<AksesStatusRow[]>([]);
  const [showFamilyPakej, setShowFamilyPakej] = useState(false);
  const [kodTajaan, setKodTajaan] = useState("");
  const [kodChecking, setKodChecking] = useState(false);
  const [tajaanBerjaya, setTajaanBerjaya] = useState<{
    slot_number: number;
    darjah: number;
    affiliate_nama?: string;
    parentId: string;
  } | null>(null);

  const autoRan = useRef(false);
  const [emailGate, setEmailGate] = useState<{ pakej: PakejId; darjah: number[] } | null>(null);

  async function mulaBayar(pakej: PakejId, darjah: number[]) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session || sess.session.user.is_anonymous) {
      setEmailGate({ pakej, darjah });
      return;
    }
    await lakukanCheckout(pakej, darjah);
  }

  async function lakukanCheckout(pakej: PakejId, darjah: number[], customerEmail?: string) {
    console.log("[harga] lakukanCheckout dipanggil", { pakej, darjah, adaEmel: !!customerEmail });
    setLoading(pakej);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      console.log("[harga] sesi checkout", { adaSesi: !!sess.session, adaToken: !!token });

      const { data: userData } = await supabase.auth.getUser();
      const refFromMeta = userData?.user?.user_metadata?.ref_code as string | undefined;
      const refCode =
        typeof window !== "undefined"
          ? (window.localStorage.getItem("kalifah_ref") ?? refFromMeta ?? undefined)
          : refFromMeta;
      console.log("[harga] hantar request /api/checkout", { pakej, darjah, refCode });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pakej, darjah, ref_code: refCode, customer_email: customerEmail }),
      });
      const data = (await res.json()) as {
        url?: string;
        payment_url?: string;
        trace_id?: string;
        error?: string;
        detail?: unknown;
      };
      console.log("[harga] respons /api/checkout", { status: res.status, data });
      const paymentUrl = data.url ?? data.payment_url;
      if (res.status === 401) {
        toast.info("Sila log masuk dahulu");
        navigate({ to: "/login" });
        return;
      }
      if (!res.ok || !paymentUrl) {
        console.error("[harga] checkout tidak boleh redirect", {
          status: res.status,
          ok: res.ok,
          traceId: data.trace_id,
          error: data.error,
          detail: data.detail,
          paymentUrl,
        });
        toast.error(data.error ?? "Gagal mula pembayaran");
        return;
      }
      console.log("[harga] redirect ToyyibPay bermula", {
        traceId: data.trace_id,
        paymentUrl,
      });
      window.location.assign(paymentUrl);
    } catch (e) {
      console.error("[harga] checkout gagal", e);
      toast.error(e instanceof Error ? e.message : "Ralat tidak diketahui");
    } finally {
      setLoading(null);
    }
  }

  function handleKlik(pakej: PakejId) {
    console.log("[harga] Bayar Sekarang diklik", { pakej });
    if (pakej === "bundle") return mulaBayar("bundle", [1, 2, 3, 4, 5, 6]);
    console.log("[harga] buka pemilih darjah", { pakej });
    setPickerInitial(fastpath ? [fastpath.darjah] : []);
    setKodTajaan("");
    setPickerFor(pakej);
  }


  useEffect(() => {
    if (autoRan.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pakej = params.get("pakej");
    if (pakej !== "satu" && pakej !== "perDarjah" && pakej !== "bundle") return;
    autoRan.current = true;

    const validIds = new Set(DARJAH_LIST.map((d) => Number(d.id)));
    const darjahRaw = params.get("darjah") ?? "";
    const darjah = darjahRaw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && validIds.has(n));

    const nama = (params.get("nama") ?? "").trim().slice(0, 60);

    if (pakej === "bundle") {
      void mulaBayar("bundle", [1, 2, 3, 4, 5, 6]);
      return;
    }
    if (pakej === "satu" && nama && darjah.length === 1) {
      setFastpath({ nama, darjah: darjah[0] });
      return;
    }
    setPickerInitial(darjah);
    setPickerFor(pakej);
  }, []);

  useEffect(() => {
    if (!fastpath) return;
    supabase.rpc("get_my_akses_status").then(({ data, error }) => {
      if (error) {
        console.warn("[harga] get_my_akses_status error:", error);
        return;
      }
      setAksesStatus((data ?? []) as AksesStatusRow[]);
    });
  }, [fastpath]);

  function renderPakejCard(p: (typeof PAKEJ_LIST)[number]) {

    const popular = !!p.popular;
    const isLoading = loading === p.id;
    return (
      <div
        key={p.id}
        className={`relative rounded-[2rem] bg-card p-7 shadow-card ${popular ? "md:scale-105" : ""}`}
        style={{ border: popular ? `3px solid ${EMAS}` : `2px solid ${HIJAU}22` }}
      >
        {popular && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-display text-[10px] font-extrabold uppercase tracking-wider text-white shadow-soft"
            style={{ backgroundColor: EMAS }}
          >
            ⭐ Paling Popular
          </div>
        )}
        <h3 className="font-display text-xl font-extrabold text-foreground">{p.nama}</h3>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground line-through">
            RM{p.id === "bundle" ? HARGA_ASAL * 6 : HARGA_ASAL}{p.id === "perDarjah" ? "/darjah" : ""}
          </p>
          <p className="mt-1 font-display text-5xl font-extrabold" style={{ color: popular ? "#7a5300" : HIJAU }}>
            RM{p.jumlahBayar}
            <span className="text-base font-bold text-muted-foreground">
              {p.id === "perDarjah" ? "/darjah" : ""}/tahun
            </span>
          </p>
          {p.jimat && (
            <p className="mt-1 text-sm font-extrabold" style={{ color: EMAS }}>
              Jimat RM{p.jimat}!
            </p>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{p.deskripsi}</p>
        <ul className="mt-5 space-y-2 text-sm text-foreground">
          <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses penuh nota, latih tubi, kuiz, game</li>
          <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Dashboard ibu bapa</li>
          <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Sijil automatik PDF</li>
          <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Streak & lencana</li>
          {p.id === "bundle" && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Untuk semua anak (D1–D6)</li>}
        </ul>
        <button
          type="button"
          onClick={() => handleKlik(p.id as PakejId)}
          disabled={isLoading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
          style={{ backgroundColor: popular ? EMAS : HIJAU }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Memproses…" : "Bayar Sekarang"}
        </button>
      </div>
    );
  }

  function formatTarikhAkses(iso: string): string {
    return new Date(iso).toLocaleDateString("ms-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function kiraTarikhTamatBaharu(expiresAt: string): string {
    const current = new Date(expiresAt);
    const base = current.getTime() > Date.now() ? current : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + 12);
    return formatTarikhAkses(next.toISOString());
  }

  async function klikAktifkanFastpath(darjah: number) {
    const kod = kodTajaan.trim();
    if (!kod) {
      await mulaBayar("satu", [darjah]);
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session || sess.session.user.is_anonymous) {
      toast.error("Kod Tajaan perlukan akaun berdaftar. Sila daftar/log masuk dahulu.");
      return;
    }
    setKodChecking(true);
    try {
      const { data, error } = await supabase.rpc("redeem_kod_tajaan", {
        p_kod_affiliate: kod,
        p_darjah: darjah,
      });
      if (error) {
        toast.error("Gagal menyemak kod. Sila cuba lagi.");
        return;
      }
      const res = data as {
        ok: boolean;
        reason?: string;
        bypass?: boolean;
        slot_number?: number;
        darjah?: number;
        affiliate_nama?: string;
      } | null;
      if (!res || res.ok === false) {
        const mesej =
          res?.reason === "kod_kosong"
            ? "Sila masukkan kod affiliate/tajaan."
            : res?.reason === "darjah_tidak_sah"
              ? "Darjah tidak sah."
              : res?.reason === "not_authenticated"
                ? "Sila log masuk dahulu."
                : "Kod affiliate/tajaan tidak sah.";
        toast.error(mesej);
        return;
      }
      if (!res.bypass) {
        if (res.reason === "sudah_ada_slot_aktif") {
          toast.info("Anda sudah mempunyai slot tajaan aktif. Teruskan pembayaran seperti biasa.");
        } else if (res.reason === "slot_habis") {
          toast.info("Slot tajaan sudah penuh. Teruskan pembayaran seperti biasa.");
        }
        await mulaBayar("satu", [darjah]);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        toast.error("Sesi tidak sah. Sila log masuk semula.");
        return;
      }
      toast.success(
        `🎉 Slot Tajaan #${res.slot_number} berjaya! Akses 30 hari Darjah ${res.darjah ?? darjah} diaktifkan.`,
      );
      setTajaanBerjaya({
        slot_number: res.slot_number ?? 0,
        darjah: res.darjah ?? darjah,
        affiliate_nama: res.affiliate_nama,
        parentId: uid,
      });
    } catch (e) {
      console.error("[harga] redeem_kod_tajaan gagal", e);
      toast.error("Ralat semasa menyemak kod. Sila cuba lagi.");
    } finally {
      setKodChecking(false);
    }
  }

  const renewalRow = fastpath
    ? aksesStatus.find(
        (s) =>
          s.darjah === fastpath.darjah &&
          (s.status === "active" || s.status === "expiring_soon" || s.status === "expired_shadow") &&
          s.expires_at,
      )
    : undefined;

  if (tajaanBerjaya) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Link to="/" className="flex items-center gap-2">
              <KalifahLogo className="h-8 md:h-9" />
            </Link>
          </div>
        </header>
        <div className="container mx-auto max-w-xl px-4 pt-8">
          <div
            className="rounded-[2rem] bg-card p-6 text-center shadow-card"
            style={{ border: `2px solid ${HIJAU}33` }}
          >
            <p className="font-display text-lg font-extrabold" style={{ color: HIJAU }}>
              🎉 Slot Tajaan #{tajaanBerjaya.slot_number} berjaya!
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Akses 30 hari Darjah {tajaanBerjaya.darjah} diaktifkan
              {tajaanBerjaya.affiliate_nama ? ` (tajaan ${tajaanBerjaya.affiliate_nama})` : ""}.
              Sambungkan Telegram untuk terima peringatan &amp; laporan kemajuan.
            </p>
          </div>
        </div>
        <SambungTelegram
          parentId={tajaanBerjaya.parentId}
          onLinked={() => navigate({ to: "/dashboard/ibu-bapa", search: { tambahAnak: undefined } })}
        />
      </div>
    );
  }

  return (


    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
          <KalifahLogo className="h-8 md:h-9" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {fastpath ? (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 font-display text-xs font-extrabold text-white shadow-soft"
                style={{ backgroundColor: HIJAU }}
              >
                🎉 KALI Dah Bersedia
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-foreground md:text-4xl">
                {renewalRow
                  ? `Sambung Akses Darjah ${fastpath.darjah}`
                  : `Aktifkan KALI untuk ${fastpath.nama}`}
              </h1>
              <span
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-card px-4 py-1.5 font-display text-xs font-extrabold shadow-soft"
                style={{ color: EMAS }}
              >
                Darjah {fastpath.darjah}
              </span>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                KALI akan mula mengenali tahap sebenar {fastpath.nama} dan menyesuaikan pembelajaran
                berdasarkan kemahiran yang perlu diperkukuhkan.
              </p>
            </div>

            {renewalRow && (
              <div className="mx-auto mt-6 w-full max-w-[420px] rounded-2xl bg-green-50 p-5 text-left md:p-6">

                <p className="font-display text-sm font-extrabold" style={{ color: HIJAU }}>
                  Ringkasan Pembaharuan
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                  <li>
                    <span className="font-bold text-muted-foreground">Tempoh:</span>{" "}
                    <span className="font-extrabold">12 bulan</span>
                  </li>
                  <li>
                    <span className="font-bold text-muted-foreground">Tarikh tamat semasa:</span>{" "}
                    <span className="font-extrabold">{formatTarikhAkses(renewalRow.expires_at!)}</span>
                  </li>
                  <li>
                    <span className="font-bold text-muted-foreground">Tarikh tamat baharu:</span>{" "}
                    <span className="font-extrabold">{kiraTarikhTamatBaharu(renewalRow.expires_at!)}</span>
                  </li>
                </ul>
                <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                  Anggaran — tarikh sebenar dikira selepas bayaran berjaya.
                </p>
              </div>
            )}


            {(() => {
              const satu = PAKEJ_LIST.find((p) => p.id === "satu")!;
              const isLoading = loading === "satu";
              return (
                <div
                  className="mx-auto mt-10 w-full max-w-[420px] rounded-[2rem] bg-card p-8 shadow-card md:p-9"
                  style={{ border: `2px solid ${HIJAU}22` }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Akses 1 Tahun · Darjah {fastpath.darjah}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">
                    Akses Penuh Darjah {fastpath.darjah}
                  </h2>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground line-through">RM{HARGA_ASAL}</p>
                    <p className="mt-1 font-display text-5xl font-extrabold" style={{ color: HIJAU }}>
                      RM{satu.jumlahBayar}
                      <span className="text-base font-bold text-muted-foreground">/tahun</span>
                    </p>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-foreground">
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Belajar Bersama KALI</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Analisis kemahiran {fastpath.nama}</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Latihan mengikut tahap</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0" style={{ color: HIJAU }} /> Akses semua aktiviti Darjah {fastpath.darjah}</li>
                  </ul>
                  <div className="mt-6 text-left">
                    <label
                      htmlFor="kod-tajaan"
                      className="font-display text-xs font-extrabold uppercase tracking-wider"
                      style={{ color: HIJAU }}
                    >
                      Kod Affiliate / Kod Tajaan
                    </label>
                    <input
                      id="kod-tajaan"
                      type="text"
                      value={kodTajaan}
                      onChange={(e) => setKodTajaan(e.target.value)}
                      placeholder="cth. CIKGU01"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      className="mt-2 w-full rounded-2xl border-2 bg-background px-4 py-3 font-display text-sm font-bold uppercase text-foreground outline-none focus:border-[#1B8A5A]"
                      style={{ borderColor: `${EMAS}66` }}
                    />
                    <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                      Ada kod daripada guru/affiliate? Masukkan di sini (pilihan).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void klikAktifkanFastpath(fastpath.darjah)}
                    disabled={isLoading || kodChecking}
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-60"
                    style={{ backgroundColor: HIJAU }}
                  >
                    {(isLoading || kodChecking) && <Loader2 className="h-4 w-4 animate-spin" />}
                    {kodChecking
                      ? "Menyemak kod…"
                      : isLoading
                      ? "Memproses…"
                      : `Aktifkan KALI untuk ${fastpath.nama} — RM${satu.jumlahBayar}`}
                  </button>
                </div>
              );
            })()}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowFamilyPakej((v) => !v)}
                className="text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Ada lebih daripada seorang anak? Lihat pakej keluarga →
              </button>
            </div>

            {showFamilyPakej && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {PAKEJ_LIST.filter((p) => p.id !== "satu").map((p) => renderPakejCard(p))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold shadow-soft"
                style={{ color: HIJAU }}
              >
                <Star className="h-3.5 w-3.5" /> Harga 1 Tahun Penuh
              </span>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
                🚀 Harga Beta
              </span>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground md:text-5xl">
                Pilih Pakej Anda
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Harga asal: <span className="line-through">RM{HARGA_ASAL}/darjah</span> — kini jauh lebih murah!
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PAKEJ_LIST.map((p) => renderPakejCard(p))}
            </div>
          </>
        )}


        <div className="mt-12 rounded-3xl bg-muted/40 p-6 text-center">
          <p className="font-display text-sm font-extrabold text-foreground">
            Pembayaran selamat melalui ToyyibPay — FPX (online banking) & kad kredit/debit.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Untuk pertanyaan langganan, hubungi support@kalifah.my
          </p>
        </div>
      </main>

      {pickerFor && (
        <DarjahPicker
          pakej={pickerFor}
          loading={loading === pickerFor}
          initial={pickerInitial}
          kodTajaan={kodTajaan}
          setKodTajaan={setKodTajaan}
          kodChecking={kodChecking}
          onClose={() => {
            setKodTajaan("");
            setPickerFor(null);
          }}
          onConfirm={(darjah) => mulaBayar(pickerFor, darjah)}
          onConfirmSatu={(darjah) => void klikAktifkanFastpath(darjah)}
        />

      )}

      {emailGate && (
        <EmailGateModal
          pending={emailGate}
          onClose={() => setEmailGate(null)}
          onProceed={async (email) => {
            const { data: semasa } = await supabase.auth.getSession();
            if (!semasa.session) {
              const { error } = await supabase.auth.signInAnonymously();
              if (error) {
                toast.error("Gagal mula sesi. Sila cuba lagi.");
                return;
              }
            }
            const p = emailGate;
            setEmailGate(null);
            if (p) await lakukanCheckout(p.pakej, p.darjah, email);
          }}
        />
      )}
    </div>
  );
}

function DarjahPicker({
  pakej,
  loading,
  initial,
  kodTajaan,
  setKodTajaan,
  kodChecking,
  onClose,
  onConfirm,
  onConfirmSatu,
}: {
  pakej: PakejId;
  loading: boolean;
  initial?: number[];
  kodTajaan: string;
  setKodTajaan: (v: string) => void;
  kodChecking: boolean;
  onClose: () => void;
  onConfirm: (darjah: number[]) => void;
  onConfirmSatu: (darjah: number) => void;
}) {

  const max = pakej === "satu" ? 1 : 5;
  const [selected, setSelected] = useState<number[]>(() =>
    (initial ?? []).slice(0, max).sort((a, b) => a - b),
  );
  const min = pakej === "satu" ? 1 : 2;
  const perDarjah = pakej === "satu" ? 49 : 39;
  const total = perDarjah * selected.length;

  function toggle(n: number) {
    setSelected((s) => {
      if (s.includes(n)) return s.filter((x) => x !== n);
      if (s.length >= max) {
        if (max === 1) return [n]; // ganti
        return s;
      }
      return [...s, n].sort((a, b) => a - b);
    });
  }

  const valid = selected.length >= min && selected.length <= max;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-card p-7 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-display text-2xl font-extrabold text-foreground">
          Pilih Darjah ({min === max ? min : `${min}–${max}`})
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {pakej === "satu" ? "Pilih 1 darjah untuk dilanggan." : "Pilih antara 2 hingga 5 darjah, RM39/darjah."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {DARJAH_LIST.map((d) => {
            const n = Number(d.id);
            const on = selected.includes(n);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(n)}
                className={`rounded-2xl border-2 px-3 py-3 font-display text-sm font-extrabold transition ${
                  on ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border bg-card text-foreground hover:border-muted-foreground/40"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <span className="font-display text-sm font-bold text-muted-foreground">Jumlah bayaran</span>
          <span className="font-display text-2xl font-extrabold" style={{ color: HIJAU }}>RM{total}</span>
        </div>

        <button
          type="button"
          disabled={!valid || loading}
          onClick={() => {
            console.log("[harga] Teruskan ke ToyyibPay diklik", { pakej, selected });
            onConfirm(selected);
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-extrabold text-white shadow-soft disabled:opacity-50"
          style={{ backgroundColor: HIJAU }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses…" : "Teruskan ke ToyyibPay"}
        </button>
      </div>
    </div>
  );
}

function EmailGateModal({
  pending,
  onClose,
  onProceed,
}: {
  pending: { pakej: PakejId; darjah: number[] };
  onClose: () => void;
  onProceed: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [existing, setExisting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setErr("Sila masukkan emel yang sah.");
      return;
    }
    setErr(null);
    setChecking(true);
    const { data, error } = await supabase.rpc("checkout_semak_emel_wujud", { p_email: trimmed });
    setChecking(false);
    if (error) {
      setErr("Ralat menyemak emel. Sila cuba lagi.");
      return;
    }
    if (data === true) {
      setExisting(true);
      return;
    }
    onProceed(trimmed);
  }

  const redirectBack = `/harga?pakej=${pending.pakej}&darjah=${pending.darjah.join(",")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl bg-card p-7 shadow-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        {existing ? (
          <>
            <h3 className="font-display text-xl font-extrabold text-foreground">Emel ini dah pernah digunakan</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Emel ini sudah pernah digunakan di Kalifah.my. Log masuk untuk teruskan pembelian dan pastikan akses masuk ke akaun yang betul.
            </p>
            <a
              href="/login"
              onClick={() => {
                window.sessionStorage.setItem("kalifah_redirect_selepas_login", redirectBack);
              }}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft"
            >
              Log Masuk &amp; Teruskan →
            </a>
          </>
        ) : (
          <>
            <h3 className="font-display text-xl font-extrabold text-foreground">Emel untuk resit &amp; akses anda</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tak perlu daftar sekarang. Kami guna emel ini untuk resit dan simpan akses anda.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
              />
              {err ? <p className="text-sm font-semibold text-destructive">{err}</p> : null}
              <button
                type="submit"
                disabled={checking}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {checking && <Loader2 className="h-4 w-4 animate-spin" />}
                {checking ? "Menyemak…" : "Teruskan ke Bayaran →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
