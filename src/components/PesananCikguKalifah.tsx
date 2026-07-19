import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "cikgu-kalifah";
const HIJAU_BORDER = "#DCFCE7";
const HIJAU_BUTANG = "#16A34A";

interface Pesanan {
  id: string;
  teks: string;
}

function GambarCikgu() {
  const [broken, setBroken] = useState(false);
  const url = useMemo(
    () => supabase.storage.from(BUCKET).getPublicUrl("cikgu-kalifah.png").data.publicUrl,
    [],
  );
  if (broken) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
        👨‍🏫
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="Cikgu Kalifah"
      onError={() => setBroken(true)}
      className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-soft"
    />
  );
}

interface Props {
  nama: string;
  kategori: "murid" | "ibu_bapa";
  onDone: () => void;
}

export function PesananCikguKalifah({ nama, kategori, onDone }: Props) {
  const [pesanan, setPesanan] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("pesanan_cikgu_kalifah")
        .select("id, teks")
        .in("kategori", ["motivasi", kategori]);
      if (cancelled) return;
      const list = (data ?? []) as Pesanan[];
      if (list.length === 0) {
        setLoading(false);
        onDone();
        return;
      }
      const pilih = list[Math.floor(Math.random() * list.length)];
      setPesanan(pilih);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [kategori]);

  useEffect(() => {
    if (!pesanan) return;
    const t = setTimeout(() => onDone(), 5000);
    return () => clearTimeout(t);
  }, [pesanan, onDone]);

  if (loading || !pesanan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
        style={{ border: `3px solid ${HIJAU_BORDER}` }}
      >
        <div className="flex justify-center">
          <GambarCikgu />
        </div>
        <h2 className="mt-3 font-display text-lg font-extrabold text-foreground">
          Assalamualaikum, {nama}! 👋
        </h2>
        <p className="mt-3 text-sm italic leading-relaxed text-slate-600">
          "{pesanan.teks}"
        </p>
        <p className="mt-1 text-xs font-bold text-slate-400">— Cikgu Kalifah</p>
        <button
          onClick={onDone}
          className="mt-5 w-full rounded-full px-6 py-3 font-display font-extrabold text-white shadow-soft transition hover:opacity-90"
          style={{ backgroundColor: HIJAU_BUTANG }}
        >
          🟢 Jom Belajar
        </button>
      </div>
    </div>
  );
}
