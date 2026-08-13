// Kalifah Shop — helper kongsi (client-safe).
export type ShopKategori = "sekolah" | "pembelajaran" | "aktiviti_anak" | "reward_anak";

export const KATEGORI_LABEL: Record<ShopKategori, string> = {
  sekolah: "Sekolah",
  pembelajaran: "Pembelajaran",
  aktiviti_anak: "Aktiviti Anak",
  reward_anak: "Reward Anak",
};

export const KATEGORI_LIST = Object.keys(KATEGORI_LABEL) as ShopKategori[];

export interface ShopProduk {
  id: string;
  slug: string;
  nama: string;
  penerangan: string | null;
  kategori: ShopKategori;
  harga_sen: number;
  kos_penghantaran_sen: number;
  imej_url: string | null;
  stok: number;
  bonus_star: number;
  status: string;
  created_at?: string;
}

export interface ShopPesanan {
  id: string;
  kod_pesanan: string;
  nama_pembeli: string;
  telefon: string;
  email: string | null;
  alamat_penghantaran: string;
  consent_pemasaran: boolean;
  user_id: string | null;
  jumlah_rm_sen: number;
  bonus_star_total: number;
  star_dituntut: boolean;
  status_bayaran: "pending" | "dibayar" | "gagal";
  status_pesanan: "menunggu" | "diluluskan" | "dihantar" | "selesai" | "dibatalkan";
  no_tracking: string | null;
  toyyibpay_bill_code: string | null;
  ref_code: string | null;
  created_at: string;
}

export function rm(sen: number): string {
  return `RM${(sen / 100).toFixed(2)}`;
}

export interface ShopAttribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  ref_code: string | null;
}

const KEY = "kalifah_shop_attribution";

function bersih(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim().slice(0, 120);
  return t.length > 0 ? t : null;
}

/** Baca attribution dari query string, gabung dengan yang tersimpan, simpan semula. */
export function tangkapAttribution(): ShopAttribution {
  const kosong: ShopAttribution = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    ref_code: null,
  };
  if (typeof window === "undefined") return kosong;

  let simpan: ShopAttribution = kosong;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) simpan = { ...kosong, ...(JSON.parse(raw) as Partial<ShopAttribution>) };
  } catch {
    /* abaikan */
  }

  const q = new URLSearchParams(window.location.search);
  const baru: ShopAttribution = {
    utm_source: bersih(q.get("utm_source")) ?? simpan.utm_source,
    utm_medium: bersih(q.get("utm_medium")) ?? simpan.utm_medium,
    utm_campaign: bersih(q.get("utm_campaign")) ?? simpan.utm_campaign,
    utm_content: bersih(q.get("utm_content")) ?? simpan.utm_content,
    ref_code: (bersih(q.get("ref")) ?? simpan.ref_code)?.toUpperCase() ?? null,
  };

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(baru));
  } catch {
    /* abaikan */
  }
  return baru;
}

export const STATUS_BAYARAN_LABEL: Record<string, string> = {
  pending: "Menunggu pembayaran",
  dibayar: "Pembayaran diterima",
  gagal: "Pembayaran tidak berjaya",
};

export const STATUS_PESANAN_LABEL: Record<string, string> = {
  menunggu: "Sedang diproses",
  diluluskan: "Sedang disiapkan",
  dihantar: "Sedang dihantar",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};
