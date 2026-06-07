# Sistem Progress Murid — Kalifah.my

## Skop
Tambah sistem penjejakan progress lengkap: simpan setiap aktiviti murid ke Supabase, papar dashboard ringkasan dengan kad subjek, bab lemah, aktiviti terkini, dan statistik harian (streak, masa belajar, soalan dijawab).

## 1. Database (Lovable Cloud / Supabase)

Migration baru: `lovable/migrations/{timestamp}_user_progress.sql`

**Table `user_progress`** — satu baris setiap aktiviti selesai
- `id` uuid PK
- `user_id` uuid → auth.users (NOT NULL)
- `darjah` text
- `subjek` text
- `aktiviti` text (kuiz / latihan / game-race / game-cari / game-betul / game-padan / game-susun / latih-tubi / nota)
- `markah` int
- `jumlah_soalan` int
- `peratus` numeric (computed dari markah/jumlah)
- `masa_ambil` int (saat)
- `created_at` timestamptz default now()

RLS: user hanya boleh SELECT/INSERT row dengan `user_id = auth.uid()`.
GRANT SELECT, INSERT ON public.user_progress TO authenticated; GRANT ALL TO service_role.
Index: `(user_id, created_at desc)`, `(user_id, subjek)`.

**Table `user_stats`** — satu baris setiap user setiap hari (untuk streak & harian)
- `id` uuid PK
- `user_id` uuid (NOT NULL)
- `tarikh` date (default today)
- `soalan_dijawab` int default 0
- `masa_belajar` int default 0 (minit)
- `bab_selesai` int default 0
- UNIQUE(user_id, tarikh)

RLS sama (user_id = auth.uid()). GRANT sama.

## 2. Helper Progress

Fail baru: `src/lib/progress.ts`
- `simpanProgress({ darjah, subjek, aktiviti, markah, jumlahSoalan, masaAmbil })` — insert ke `user_progress`, upsert tambah ke `user_stats` untuk hari ini.
- `tambahSoalanDijawab(n, masaMinit)` — untuk kemas kini berkala (cth latih-tubi tanpa skor akhir).
- Skip senyap kalau tiada user (mod tetamu).

## 3. Integrasi ke Aktiviti

Panggil `simpanProgress` di end-of-activity:
- `src/routes/darjah.$darjahId_.$subjekId_.kuiz.tsx` (bila tamat)
- `src/routes/darjah.$darjahId_.$subjekId_.latihan.tsx`
- `src/routes/darjah.$darjahId_.$subjekId_.latih-tubi.tsx`
- `src/routes/darjah.$darjahId_.$subjekId_.nota-ringkas.tsx` (markah 1/1 bila habis baca)
- `src/components/games/BetulSalahGame.tsx`, `PadankanJawapanGame.tsx`, `SusunAyatGame.tsx`, `CariPerkataan.tsx`, dan Quiz Race di `darjah.$darjahId_.$subjekId_.game.tsx`

Mode game lulus prop `darjah` & `subjekId` ke komponen (sesetengah dah ada subjekId).

## 4. Dashboard `/dashboard/progress`

Route baru: `src/routes/dashboard.progress.tsx` (require auth — redirect ke /login kalau tiada user)

**Header statistik** (4 kad kecil, warna emas/hijau):
- Soalan hari ini
- Masa belajar hari ini (minit)
- Streak (kira hari berturut-turut dari `user_stats`)
- Lencana (derived: 1 lencana per subjek 100% siap + bonus streak ≥7)

**Kad Subjek** (grid 2-3 kolum):
- Untuk setiap 6 subjek: kira aktiviti unik selesai (max 5 jenis), bar progress %, purata peratus.
- Format: "Matematik — 80% siap | ⭐ 78%"

**Bab Lemah**:
- Group `user_progress` by subjek, ambil purata; senarai mana purata < 60%.
- Butang "Ulang Kaji" → link ke `/darjah/{darjah}/{subjek}` (guna darjah terkini user).

**Aktiviti Terkini**:
- 5 row terakhir dari `user_progress` (subjek, aktiviti, markah/jumlah, tarikh relatif).

Tambah link "Progress Saya" dalam header (`SiteHeader`) bila user log masuk.

## 5. Tema
Hijau `#1B8A5A`, emas `#F5A623`. Gunakan rounded-3xl, shadow-card, font-display, ikon Lucide (TrendingUp, Flame, Clock, Award, BookOpen).

## Technical notes
- Semua read/write guna `supabase` client browser (RLS lindungi). Tiada server fn perlu.
- `progres.ts` defensive — try/catch & log silent supaya tak rosak UX kalau Supabase fail.
- Pengiraan streak: ambil `tarikh` distinct desc, kira berturut bermula hari ini atau semalam.
- Routing TanStack — kena edit `routeTree.gen.ts` selepas tambah route.