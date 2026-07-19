## Investigation Only — No Code Changes

Laporan siasatan gap "Parent Onboarding" (post-payment → tambah anak → anak log masuk pertama kali). Semua rujukan fail+baris disahkan dari kod semasa. **Tiada perubahan kod dicadangkan di sini** — plan ini semata-mata jawapan siasatan.

---

### 1) Selepas bayar berjaya — apa yang berlaku sekarang?

**Alir masa (verified):**
- ToyyibPay POST callback → `src/routes/api.public.toyyibpay.callback.ts:76-121` insert baris ke `public.payments`. Trigger DB `apply_payment_unlock` (rujukan: `lovable/migrations/20260608170000_payments_trigger.sql`, `20260608180000_fix_apply_payment_unlock.sql`) update `pesanan.status='paid'` + `profiles.darjah_akses`.
- Parent di-redirect ke `/bayaran/selesai` — `src/routes/bayaran.selesai.tsx:22-101`. Muka polling status pesanan (max 6 cuba × 2s), kemudian papar satu skrin "Pembayaran berjaya!" dengan **satu butang tunggal: "Ke Pilihan Darjah"** → `/pilih-darjah` (baris 120-125).

**Gap:**
- **Tiada email konfirmasi bayaran** — tiada `resend`/edge function dipanggil dalam callback (`api.public.toyyibpay.callback.ts` tak sentuh Resend).
- **Tiada onboarding CTA langsung** — parent didorong ke `/pilih-darjah`, bukan ke `/dashboard/ibu-bapa` untuk cipta akaun anak. Parent tak tahu langkah seterusnya untuk anak.
- **Tiada tracking pixel/analytics selain FB/GA `Purchase`** (`bayaran.selesai.tsx:55-64`) — tiada penanda "onboarding_step_completed".

---

### 2) "Tambah Anak" — di mana dalam UI parent?

**Verified:** Butang `<PlusCircle /> Tambah Anak` wujud di header `dashboard/ibu-bapa` — `src/routes/dashboard.ibu-bapa.tsx:920-926`. Bila klik → toggle `<FormTambahAnak />` (baris 931-941, definisi baris 1552-1588).

**Access path parent kena ambil dari post-bayar:**
1. `/bayaran/selesai` → klik "Ke Pilihan Darjah" → landing `/pilih-darjah` (bukan dashboard ibu bapa).
2. Parent kena navigate manual ke `/dashboard/ibu-bapa` (tiada link auto).
3. Baru nampak butang "Tambah Anak" di header.

**Empty-state ada tapi hanya di dalam dashboard:** `dashboard.ibu-bapa.tsx:953-959` — teks "Belum ada profil anak. Klik **Tambah Anak** untuk mula." Bermakna parent yang tak pernah masuk dashboard **langsung tak nampak empty-state ini**.

**Verdict:** Fungsi wujud tapi **tersorok dari flow post-payment**. Tiada CTA/redirect terus dari `bayaran/selesai` → dashboard ibu bapa.

---

### 3) Anak log masuk kali pertama — bagaimana?

**Verified flow (`src/lib/child-auth.ts` + `src/routes/login.tsx`):**
- Parent isi borang: **Nama, Darjah, Username, Password** (dashboard `ibu-bapa.tsx:1596-1646`).
- `ciptaAkaunAnak()` cipta akaun auth Supabase dengan email sintetik `{username}@anak.kalifah.local` (`child-auth.ts:57`), simpan `child_profiles` row dengan `kod_jemputan` 6-aksara (`child-auth.ts:69-79`).
- Selepas cipta: **hanya toast/mesej "Akaun {nama} berjaya dicipta! Anak boleh log masuk dengan username: {uname}"** (`dashboard.ibu-bapa.tsx:1583`). **Password TIDAK dipaparkan semula** (parent sendiri tetapkan, jadi asumsinya parent ingat).
- Anak log masuk di `/login` dengan **username + password** (`login.tsx:32-34`) — sistem convert username → sintetik email di belakang tabir.
- `kod_jemputan` disebut dalam UI (`ibu-bapa.tsx:957`) tapi **tiada flow yang benar-benar guna kod ini untuk pairing/login anak** — hanya field DB (belum wired). Anak login guna username/password, bukan kod.

**Gap:**
- Tiada **"kad kredential" print/share** (username + password + link login) — parent yang lupa password anak tiada cara reset melainkan guna admin function `reset-child-password` edge function.
- Tiada QR code / magic link / device-pairing untuk anak (walaupun `kod_jemputan` ada di DB).
- Tiada CTA "buka /login dalam tab baru" atau "hantar kepada anak" selepas cipta.

---

### 4) Parent bayar tapi TAK PERNAH tambah anak — ada reminder?

**Verified — `supabase/functions/remind-inactive-students/index.ts`:**
- Baris 66-70: query **hanya baris dari `child_profiles`** yang `child_user_id IS NOT NULL`.
- Untuk setiap anak yang wujud, semak `user_progress` dalam 3 hari terakhir; jika tiada, hantar email peringatan pada parent.

**Verdict:** Function ini **hanya cover kes "anak dah wujud tapi tak aktif"**. **Parent yang tak pernah tambah anak langsung TIDAK akan dapat sebarang email/nudge** — mereka jatuh keluar sepenuhnya dari radar reminder sistem semasa.

Tiada job/edge function lain yang query `pesanan.status='paid'` cross-check dengan `child_profiles` kosong. Tiada welcome email post-payment yang boleh berfungsi sebagai reminder pasif.

---

### 5) Query anggaran parent-bayar-tanpa-anak

Anda kata akan query sendiri. Rujukan skema untuk memudahkan:
- Table `pesanan` (`lovable/migrations/20260608140000_pesanan_toyyibpay.sql`) — column `status`, `user_id`.
- Table `child_profiles` — column `parent_id`.
- Rough query:
  ```sql
  select count(distinct p.user_id)
  from pesanan p
  left join child_profiles c on c.parent_id = p.user_id
  where p.status = 'paid' and c.id is null;
  ```

---

### Ringkasan Gap (untuk sesi reka bentuk seterusnya)

| Gap | Impak | Fail berkaitan |
|---|---|---|
| Tiada email/receipt selepas bayar | Parent tak tahu apa nak buat next | `api.public.toyyibpay.callback.ts` |
| Post-payment CTA hantar ke `/pilih-darjah` bukan dashboard | Parent tak jumpa "Tambah Anak" | `bayaran.selesai.tsx:120` |
| Tiada wizard/checklist onboarding | Discovery cacat | `dashboard.ibu-bapa.tsx` |
| Kredential anak tak dipaparkan/dishare | Parent lupa password | `child-auth.ts`, `dashboard.ibu-bapa.tsx:1583` |
| `kod_jemputan` wujud tapi tak wired | Peluang UX pairing terlepas | `child-auth.ts:78` |
| Reminder cron abai parent tanpa anak | Kohort "onboarding gagal" tak dinudge | `remind-inactive-students/index.ts:66-70` |

Siasatan selesai. Approve untuk teruskan ke fasa reka bentuk (masih plan mode), atau minta siasatan tambahan.
