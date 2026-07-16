# Laporan Siasatan: Navigasi & Role (read-only)

## Ringkasan
Tiada pembezaan role di lapisan routing/landing. **Semua akaun** (murid, ibu bapa biasa, admin, affiliate) mendarat di `/pilih-darjah` selepas login. Tab nav dan kad darjah yang boleh dibuka ditentukan sepenuhnya oleh **`profiles.darjah_akses`** (+ beberapa flag tambahan untuk tab admin/affiliate). Tiada logic "kalau role=user, redirect ke /dashboard/ibu-bapa".

---

## 1) Landing selepas login & tab "Pilih Darjah"

**Landing lalai selepas login — sama untuk semua akaun:**
- `src/routes/login.tsx:40` — selepas `signInWithPassword` berjaya, redirect keras: `navigate({ to: "/pilih-darjah" })`. Tiada cabang ikut role/darjah_akses.

**Tab "Pilih Darjah" dalam nav bar — sentiasa dipapar untuk sesiapa yang login:**
- `src/components/SiteHeader.tsx:41-50` — link `/pilih-darjah` di-render tanpa syarat (di dalam `navLinks`, luar mana-mana kondisi role). Tab lain baru bersyarat:
  - "Progress Saya" — `userName && isChild` (`isChild` = email berakhir `@anak.kalifah.local`, baris 32).
  - "Ibu Bapa" — `userName && !isChild`.
  - "Dashboard Affiliate" — `isAffiliate` (baris 38-46, query `affiliates` table).
  - "Admin Dashboard" — `profile?.role === "admin"`.

**Kandungan skrin `/pilih-darjah`:**
- `src/routes/pilih-darjah.tsx:337-351` — loop `DARJAH_LIST` (D1-D6) dan tandakan setiap kad `hasAccess = darjahAkses.includes(Number(d.id))`. Kad yang `hasAccess=false` dipapar dengan overlay 🔒 "Naik Taraf" (baris 415-420) dan klik dia panggil `handleLockedClick` → `/preview/nama` (baris 181-186), BUKAN aktiviti sebenar.
- `src/routes/pilih-darjah.tsx:68-90` — kesan "darjah semasa murid": kalau ada row `child_profiles` untuk `user.id`, guna `child_profiles.darjah`; kalau tak (iaitu akaun parent/admin), fallback ke `darjahAkses[0]`. CTA "Sambung Belajar" (baris 234-243) render bila `darjahMurid` ada — jadi untuk parent yang ada `darjah_akses` tak kosong, butang ini juga muncul dan pergi terus ke `/darjah/$darjahId`.

**Kesimpulan #1:** Tab "Pilih Darjah" dan landing `/pilih-darjah` **sama untuk semua akaun profile** (role='user' biasa, admin, affiliate). Tiada gate ikut role. Beza cuma: kad darjah yang tak wujud dalam `darjah_akses` dikunci. Untuk akaun yang `darjah_akses` kosong (contoh: parent baru daftar, belum bayar), semua 6 kad kunci — tapi skrin `/pilih-darjah` sendiri masih dibuka dan hero + "Progress Minggu Ini" masih dipapar.

---

## 2) Parent biasa (role='user') — boleh jawab kuiz bawah akaun sendiri?

**Ya, boleh — tiada apa-apa yang halang.** Route pembelajaran (`/darjah/$darjahId`, `.../kuiz`, `.../latih-tubi`, dll) hanya perlukan session valid; tiada semakan "adakah user ni murid vs parent". Contoh:
- `src/routes/pilih-darjah.tsx:62-64` — satu-satunya gate: `if (!loading && !user) navigate({ to: "/login" })`.
- CTA "Sambung Belajar" (baris 234-243) dan kad darjah yang `hasAccess` (baris 341-351 + `<Link to="/darjah/$darjahId">` dalam `DarjahCard`) aktif untuk sesiapa sahaja yang `darjahAkses` merangkumi darjah tu — termasuk parent.
- `SiteHeader` tidak sorok "Pilih Darjah" untuk `!isChild`. Sebaliknya ia **menambah** "Ibu Bapa" untuk `!isChild` — kedua-dua muncul serentak.

**Kesimpulan #2:** Parent biasa yang login guna email/password sendiri **memang nampak "Pilih Darjah"** sebagai tab DAN sebagai landing lalai selepas login, dan **memang boleh** terus jawab kuiz/latih-tubi/game di bawah akaun parent sendiri, asalkan `profiles.darjah_akses` mereka merangkumi darjah tersebut. Tiada redirect otomatik ke `/dashboard/ibu-bapa`.

---

## 3) Adakah ini sengaja atau kesan sampingan?

Bukti menunjukkan **kesan sampingan seni bina**, bukan reka bentuk produk eksplisit "parent boleh preview":

- **`darjah_akses` dipopulate atas profile pembeli** (bukan atas akaun anak) apabila bayaran diluluskan:
  - `lovable/migrations/20260608170000_payments_trigger.sql:80-92` — trigger `apply_payment_unlock` merge tier yang dibeli ke `profiles.darjah_akses` **milik `pesanan.user_id`** (iaitu akaun yang buat pembelian = parent).
  - `lovable/migrations/20260608180000_fix_apply_payment_unlock.sql:94-121` dan `20260615100000_admin_approve_pesanan.sql:49-57` — sama; kira semula `darjah_akses` untuk `pesanan.user_id` (parent), bukan untuk child_profiles.
  - `lovable/migrations/20260611120000_backfill_child_darjah_akses.sql:7-12` — migration berasingan yang isi `darjah_akses` untuk akaun anak berdasarkan `child_profiles.darjah`. Fakta bahawa child perlu di-backfill secara berasingan mengesahkan model asal: `darjah_akses` diletak atas profile parent semasa pembelian, dan akaun anak sintetik diberi `darjah_akses` sendiri secara berasingan supaya login anak boleh buka darjah dia.

- **Satu-satunya "role gate" yang wujud** dalam kod adalah:
  - `role='admin'` → dedah tab "Admin Dashboard" (`SiteHeader.tsx:82`, `use-profile.ts` pulangkan `role`).
  - `isChild` (dikesan via email domain `@anak.kalifah.local`, `src/lib/child-auth.ts` via `CHILD_EMAIL_DOMAIN`) → tukar "Ibu Bapa" ↔ "Progress Saya" dalam nav.
  - `affiliates` row wujud → dedah tab "Dashboard Affiliate".
  - Tiada `role='parent'` distinct — parent = "bukan admin, bukan email `@anak.kalifah.local`". Sebab tu bahagian "belajar" tak pernah membezakan parent vs murid.

**Kesimpulan #3:** Ini **kesan sampingan**. `darjah_akses` diletak atas profile pembeli (parent) sebagai tempat semulajadi untuk trigger pembayaran menulis, dan tiada lapisan "audience" (parent vs child) di atas `darjah_akses` untuk sorok skrin belajar daripada pembeli. Akibatnya, apa sahaja akaun yang `darjah_akses` populated akan nampak `/pilih-darjah` lengkap dengan kad terbuka dan boleh terus jawab kuiz — termasuk parent yang beli untuk anak, dan admin (kes anda: `darjah_akses=[1..6]`).

---

## Fail rujukan utama
- `src/routes/login.tsx:40` — redirect keras selepas login.
- `src/components/SiteHeader.tsx:41-90` — semua logic paparan tab.
- `src/routes/pilih-darjah.tsx:62-64, 68-90, 181-186, 337-351, 415-420` — gate akses, deteksi darjah semasa, kad kunci.
- `src/hooks/use-profile.ts` — sumber `darjah_akses` + `role` untuk komponen.
- `lovable/migrations/20260608170000_payments_trigger.sql`, `20260608180000_fix_apply_payment_unlock.sql`, `20260615100000_admin_approve_pesanan.sql` — semua tulis `darjah_akses` ke profile `pesanan.user_id` (parent).
- `lovable/migrations/20260611120000_backfill_child_darjah_akses.sql` — bukti akaun anak perlu backfill berasingan.

---

## Cadangan (kalau nak dibincang lain kali, bukan sekarang)
Kalau kita nak parent **tidak** nampak `/pilih-darjah` sebagai landing/tab, pilihan yang biasa:
1. Redirect selepas login ikut isyarat: jika ada row `child_profiles` di mana `parent_id = user.id` → `/dashboard/ibu-bapa`; kalau `child_profiles` di mana `child_user_id = user.id` → `/pilih-darjah`; admin → `/admin` atau kekal.
2. Sorok tab "Pilih Darjah" bila `!isChild && !isAdmin && parentHasChildren` dalam `SiteHeader`.
3. Perkenalkan `profiles.audience` eksplisit ('parent' | 'murid' | 'admin') dan gate skrin belajar ikut itu — beza dengan `darjah_akses` yang kekal sebagai "hak akses tier dibeli".

Tiada perubahan kod dibuat.
