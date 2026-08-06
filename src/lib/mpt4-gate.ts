/**
 * Gate Percubaan MPT4 (Darjah 4 sahaja).
 *
 * Setiap laluan ke soalan MPT4 mesti singgah dahulu di skrin permulaan
 * (`/darjah/4/percubaan-mpt4`) — di mana gate "Sambung Telegram" dan skrin
 * pilihan 5/50 dipaparkan. Bila pengguna memilih "50 Soalan Penuh", kita
 * tandakan pilihan itu supaya route dalaman ($subjekId / $setId) benarkan
 * akses. Kalau tanda tiada, route dalaman akan hantar semula ke skrin
 * permulaan.
 */
const KEY = "kalifah_mpt4_mod_penuh";

/** Darjah yang tertakluk kepada gate ini. */
export function darjahBergate(darjahId: string | number): boolean {
  return Number(darjahId) === 4;
}

export function tandaModPenuh(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* abaikan */
  }
}

export function modPenuhDipilih(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function resetModPenuh(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}

/**
 * True bila route dalaman perlu redirect balik ke skrin permulaan MPT4.
 */
export function perluKembaliKeGate(darjahId: string | number): boolean {
  return darjahBergate(darjahId) && !modPenuhDipilih();
}
