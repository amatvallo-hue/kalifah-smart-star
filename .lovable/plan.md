# Flow ujian web-native "Cuba KALI" (tanpa Telegram)

## Jaminan utama
- `src/routes/cuba-kali.tsx` — TIDAK disentuh.
- `src/routes/cuba-kali_.aktifkan.tsx` — TIDAK disentuh (guna sedia ada dengan `?child=&token=&darjah=`).
- Tiada RPC atau edge function diubah/dicipta.
- Flow Telegram/WhatsApp sedia ada kekal 100%: bila param `ct` tiada, laluan lama (`switchBackToParent()` → `/kali-test/laporan-anak`) berjalan tanpa sebarang perbezaan.

## Fail yang akan disentuh
1. **Baharu:** `src/routes/kali-test.mula-percubaan.tsx`
2. **Kecil & bersyarat:** `src/routes/kali-test.belajar-untuk-saya.tsx`

## 1. Laman baharu `/kali-test/mula-percubaan`
- `ssr: false`, ada `head()` sendiri (title + description unik), tidak dipautkan dari mana-mana laman.
- UI: kad `rounded-3xl`, HIJAU `#1B8A5A` / EMAS `#F5A623`, font display — konsisten dengan laman `/kali-test/`.
- Butang Darjah 1–6. Bila diklik:
  1. Dapat/janakan `creation_request_id` (`crypto.randomUUID()`) yang disimpan dalam `sessionStorage` (kunci per-darjah) supaya reload tidak cipta akaun berganda.
  2. `supabase.functions.invoke("kali-cipta-sesi-tetamu-web", { body: { darjah, nama_anak: "Anak", creation_request_id } })`.
  3. `supabase.auth.verifyOtp({ token_hash: hashed_token, type: "recovery" })`.
  4. `markSkipChildGuard()` dari `@/lib/child-auth`.
  5. `navigate` ke `/kali-test/belajar-untuk-saya?src=same_device&ct=<claim_token>&d=<darjah>`.
- State: `loading` per-butang (semua butang disable semasa proses), papar spinner.
- Ralat: status/mesej 429 → "Terlalu banyak percubaan, sila cuba lagi sebentar."; lain-lain → mesej generik + boleh cuba semula.

## 2. Perubahan bersyarat pada `kali-test.belajar-untuk-saya.tsx`
Dua suntingan sahaja, tiada refactor:

- `validateSearch` (kini hanya baca `src`): tambah baca `ct` dan `d` sebagai string pilihan; kekalkan bentuk objek sedia ada bila tiada.
- `handleTunjukIbuBapa`:
  ```
  if (search.ct) {
    navigate ke /cuba-kali/aktifkan?child=<user.id>&token=<search.ct>&darjah=<search.d ?? childDarjah>
    // tiada switchBackToParent()
    return;
  }
  // kes sedia ada, tak berubah:
  await switchBackToParent(); navigate → /kali-test/laporan-anak?child=<user.id>
  ```

## Nota teknikal
- `/cuba-kali/aktifkan` guna `URLSearchParams` sedia ada, jadi navigasi boleh guna URL string penuh — tiada perubahan pada route itu.
- Route baharu perlu regenerasi `routeTree.gen.ts` secara automatik oleh dev server; tiada edit manual.
- Selepas siap: `bunx tsgo --noEmit`.
