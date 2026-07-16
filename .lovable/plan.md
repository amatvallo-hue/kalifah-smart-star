# Laporan Siasatan: Topik-Level Tracking di `user_progress`

Ini laporan sahaja — tiada perubahan kod dicadangkan lagi. Selepas awak baca, kita bincang strategi baru buat pelan sebenar.

## 1. Bilangan tempat insert ke `user_progress`

Semua insert/update ke `user_progress` melalui **satu fungsi kongsi**: `simpanProgress()` dalam `src/lib/progress.ts`. Tiada tempat lain query terus ke jadual itu untuk tulis.

Tetapi fungsi kongsi itu dipanggil dari **14 tempat berbeza** merentasi 13 fail:

| # | Fail | Aktiviti | Hantar `topik`? |
|---|---|---|---|
| 1 | `routes/darjah.$darjahId_.$subjekId_.kuiz.tsx` | `kuiz` (kuiz umum/rawak) | ❌ Tidak |
| 2 | `components/KuizBMTopik.tsx` | `kuiz` (kuiz ikut topik — BM/Mat/Sains) | ❌ Tidak (walaupun ada state `topik`!) |
| 3 | `routes/darjah.$darjahId_.$subjekId_.latihan.tsx` | `latihan` | ❌ Tidak |
| 4 | `routes/darjah.$darjahId_.$subjekId_.latih-tubi.tsx` (loop per-topik) | `latih-tubi` | ✅ Ya |
| 5 | `routes/darjah.$darjahId_.$subjekId_.latih-tubi.tsx` (fallback tanpa breakdown) | `latih-tubi` | ❌ Tidak |
| 6 | `routes/darjah.$darjahId_.$subjekId_.isi-kosong.tsx` | `isi-kosong` | ✅ Ya |
| 7 | `routes/darjah.$darjahId_.$subjekId_.bergambar-rajah.tsx` | `bergambar-rajah` | ✅ Ya |
| 8 | `routes/darjah.$darjahId_.$subjekId_.nota-ringkas.tsx` | `nota` | ❌ Tidak (walaupun `selectedTopik` wujud!) |
| 9 | `routes/darjah.$darjahId_.$subjekId_.game.tsx` | `game-race` | ❌ Tidak |
| 10 | `components/games/BetulSalahGame.tsx` | `game-betul` | ❌ Tidak |
| 11 | `components/games/PadankanJawapanGame.tsx` | `game-padan` | ❌ Tidak |
| 12 | `components/games/SusunAyatGame.tsx` | `game-susun` | ❌ Tidak |
| 13 | `components/games/MatikDragGame.tsx` | `game-matik-drag` | ❌ Tidak |
| 14 | `components/games/MatikNeonGame.tsx` | `game-matik-neon` | ❌ Tidak |

**Kesimpulan:** hanya 3 call-site (isi-kosong, bergambar-rajah, latih-tubi per-topik) yang sudah hantar `topik`. 11 lagi tak hantar — inilah sebab lajur `topik` NULL untuk hampir semua rekod.

## 2. Adakah setiap aktiviti tahu topik soalan?

Klasifikasi ikut sumber data & aliran sesi:

### A. Sesi terkunci kepada SATU topik (senang — tinggal pass sahaja)
- **`KuizBMTopik`** — user pilih topik dulu, semua 10 soalan `.eq("topik", pilihTopik)`. State `topik` sudah wujud (line 128), tetapi tidak dihantar ke `simpanProgress`. **Trivial fix.**
- **`nota-ringkas`** — `selectedTopik` sedia ada; user baca satu topik pada satu masa. **Trivial fix.**
- **`isi-kosong`** ✅ sudah betul.
- **`bergambar-rajah`** ✅ sudah betul.
- **`latih-tubi` (dengan `?topik=` param)** ✅ sudah betul.

### B. Sesi CAMPUR beberapa topik dalam satu sesi
- **`kuiz.tsx` (kuiz umum darjah/subjek)** — soalan random dari `quiz-bank` merentasi topik. Satu sesi = pelbagai topik.
- **`latihan.tsx`** — sama, campur pelbagai topik (guna quiz-bank).
- **`latih-tubi.tsx` tanpa `?topik=`** — sudah ada `topikStats` per topik dalam sesi (line 138), dan loop per-topik sudah wujud (line 152–165) — tetapi ada fallback (line 167) yang insert satu row tanpa topik bila `topikStats` kosong. Struktur sudah betul; hanya perlu pastikan setiap soalan yang dijawab dikira ke bucket topik masing-masing.
- **`game-race` (game.tsx)** — soalan campur dari quiz-bank; satu sesi = pelbagai topik.

### C. Games komponen (BetulSalah, Padan, Susun, MatikDrag, MatikNeon)
- Sumber data adalah **soalan game statik dari `games-bank.ts`** — perlu semak sama ada setiap item ada field `topik`. Kalau tak, aktiviti-aktiviti ini takkan pernah dapat topik tepat tanpa migration data. Perlu siasat lanjut.

## 3. Cara handle sesi campur-topik

Dua pilihan seni bina — awak kena pilih:

**Pilihan (i): Satu row per topik dalam sesi**
- Untuk kuiz/latihan/game-race yang campur, kumpul soalan ikut topik, kemudian panggil `simpanProgress` sekali per topik (macam `latih-tubi` sudah buat).
- Implikasi: satu sesi kuiz 10 soalan boleh jadi 3-4 rows dalam `user_progress`. Ini memberi tracking tepat per topik.
- Kesan pada logic sedia ada:
  - **Markah**: kekal — setiap row masih ada `markah`/`jumlah_soalan` sendiri.
  - **Streak/`user_stats`**: `simpanProgress` sudah tambah `soalan_dijawab` per panggilan; kalau panggil 3 kali untuk 1 sesi, jumlah soalan_dijawab akan tepat tetapi `bab_selesai` akan naik 3 (bukan 1). Perlu ubah kiraan `bab_selesai` — mungkin count sesi, bukan row.
  - **Lencana**: `semakDanBeriLencana` akan panggil 3 kali per sesi (extra query, tapi idempotent) — perlu debounce atau panggil sekali sahaja di penghujung sesi.
  - **Unique constraint `(user_id, darjah, subjek, aktiviti)`** dari migration `20260607130000_badges_dedup.sql` — akan pecah! Perlu tambah `topik` ke constraint: `UNIQUE (user_id, darjah, subjek, aktiviti, topik)`. Migration baru diperlukan.
  - **Dedup vs accumulate**: `progress.ts` sekarang dedup (simpan skor terbaik) kecuali `latih-tubi` dengan topik (accumulate). Perlu putuskan tingkah laku bila `topik` ada untuk kuiz/latihan juga.

**Pilihan (ii): Satu row per sesi, simpan array topik dalam JSONB**
- Tambah lajur `topik_stats jsonb` (contoh `[{topik, betul, jumlah}, ...]`).
- Kurang row, tapi susah query "X/Y topik selesai".
- Tidak sepadan dengan struktur sedia ada (`peratus`, `markah` single-value).

**Cadangan (kena awak sahkan):** Pilihan (i) — sepadan dengan corak `latih-tubi` yang sudah wujud, tetapi memerlukan migration constraint baru + adjust dedup logic + adjust `bab_selesai`.

## 4. Anggaran skop

**Fail yang PASTI perlu disentuh:**

1. **`src/lib/progress.ts`** — teras logic:
   - Kendali dedup/accumulate bila `topik` diberi untuk semua aktiviti (bukan hanya latih-tubi).
   - Kira `bab_selesai` betul untuk multi-row-per-sesi.
2. **Migration SQL baru** — tukar unique constraint `user_progress_user_aktiviti_unik` untuk sertakan `topik` (dengan handling NULL — Postgres NULL tidak equal pada NULL, jadi mungkin perlu partial index).
3. **11 call-site** yang perlu hantar `topik`:
   - Trivial (state sudah ada): `KuizBMTopik.tsx`, `nota-ringkas.tsx` — 2 fail.
   - Perlu bucket per-topik: `kuiz.tsx`, `latihan.tsx`, `game.tsx` (game-race), `latih-tubi.tsx` fallback path — 4 fail.
   - Games statik (perlu semak `games-bank.ts` dulu ada topik atau tidak): `BetulSalahGame`, `PadankanJawapanGame`, `SusunAyatGame`, `MatikDragGame`, `MatikNeonGame` — 5 fail + `games-bank.ts`.
4. **`src/lib/games-bank.ts`** — mungkin perlu tambah field `topik` per soalan (kalau belum ada). Perlu siasat.
5. **`semakDanBeriLencana`** logic dalam `progress.ts` — sudah bergantung pada `topik` untuk "Pakar Subjek" (line via `nota_topik`), tetapi kuiz/latih-tubi pukul rata semua rows. Kekal berfungsi, tapi patut disemak semula selepas data topik lebih kaya.

**Fail yang perlu diUJI (tidak disentuh, tapi baca `user_progress`):**
- `dashboard.progress.tsx`, `pilih-darjah.tsx`, `dashboard.ibu-bapa.tsx`, sijil rekod — semua ini bergantung pada shape rekod. Perlu regression test manual selepas perubahan.

**Anggaran total fail disentuh:** **~10–12 fail kod + 1 migration**.

**Risiko utama:**
- Unique constraint change boleh gagal kalau ada data lama duplicate — perlu cleanup dulu.
- Multi-row per sesi boleh double-count `bab_selesai` dan `soalan_dijawab` di `user_stats` — perlu adjust dengan teliti.
- Perubahan dedup→accumulate untuk sesetengah aktiviti boleh ubah paparan "skor tertinggi" pada dashboard.

## Cadangan langkah seterusnya (belum implement)

Sebelum edit sebarang kod, tolong sahkan:
1. Guna Pilihan (i) — satu row per topik per sesi?
2. Untuk games statik (BetulSalah, Padan, Susun, MatikDrag, MatikNeon), boleh saya siasat dulu `games-bank.ts` untuk lihat sama ada topik boleh diextract? (Kalau tidak, aktiviti ini kekal `topik=NULL` sampai data diperkaya — bukan bug.)
3. Approach fasa: mula dengan trivial fixes (KuizBMTopik, nota-ringkas) untuk validate pattern sebelum bergerak ke fail yang lebih kompleks?
