// Shared pricing helper (client + server safe).
import { PAKEJ_LIST } from "@/lib/curriculum";

export type PakejId = "satu" | "perDarjah" | "bundle";

export function kiraHarga(pakej: PakejId, darjah: number[]): number {
  const p = PAKEJ_LIST.find((x) => x.id === pakej);
  if (!p) throw new Error("Pakej tidak sah");
  if (pakej === "bundle") return p.jumlahBayar;
  if (pakej === "satu") {
    if (darjah.length !== 1) throw new Error("Pilih 1 darjah");
    return p.jumlahBayar;
  }
  // perDarjah: 2-5
  if (darjah.length < 2 || darjah.length > 5) {
    throw new Error("Pilih 2-5 darjah");
  }
  return p.hargaPerDarjah * darjah.length;
}

export function darjahDibuka(pakej: PakejId, darjah: number[]): number[] {
  if (pakej === "bundle") return [1, 2, 3, 4, 5, 6];
  return darjah;
}
