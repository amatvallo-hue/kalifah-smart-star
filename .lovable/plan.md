# Laporan Siasatan — Dashboard Ibu Bapa

Data DB + RLS confirmed OK. Punca sebenar hampir pasti di **frontend selector**, bukan fetch/filter/timezone.

## 1. Punca paling mungkin: default child = anak pertama dicipta (BUKAN Aisyah)

**Fail: `src/routes/dashboard.ibu-bapa.tsx`**

- Baris 573: `const [aktifId, setAktifId] = useState<string | null>(null);` — state lokal, **tidak dipersist** (tak simpan ke localStorage/URL).
- Baris 592–599: bila mount, `senaraikanAnak()` dipanggil dan default:
  ```
  if (!aktifId && list.length > 0) setAktifId(list[0].id);
  ```
- Baris 601–602: `anakUserId` diambil dari `anakAktif = list.find(id === aktifId)`.

**Fail: `src/lib/parent.ts` baris 28–32** — `senaraikanAnak()` order by `created_at ASC`, jadi `list[0]` = **anak PERTAMA yang Amat cipta**.

Kalau Adam Safwan dicipta dahulu, dashboard sentiasa default ke Adam. Chip switcher wujud (baris 938–942) — Amat kena klik "Aisyah Sufiya" secara manual. Setiap kali refresh/masuk semula dashboard, pilihan reset balik ke Adam.

**Ujian pantas untuk sahkan:** minta Amat buka dashboard, klik chip "Aisyah Sufiya" di seksyen senarai anak (sekitar baris 938), pastikan aktiviti "bergambar-rajah" 10/10 muncul di "Aktiviti Terkini".

## 2. Fetch/caching — TIDAK jadi punca

- Baris 683–722: `useEffect` bergantung pada `[anakUserId]`. Tukar anak → refetch. Realtime channel juga di-subscribe untuk `user_progress`/`user_stats` filter `user_id=eq.${anakUserId}` — sepatutnya auto-refresh bila Aisyah siap aktiviti baru (kalau chip Aisyah aktif).
- Query fetch (baris 614–618) `select(...)` tak ada filter aktiviti/tarikh — semua rekod Aisyah diambil.

## 3. Filter aktiviti — TIDAK exclude "bergambar-rajah"

- Baris 1258 "Aktiviti Terkini": `progress.slice(0, 10)` — tiada whitelist. Rekod "bergambar-rajah" DIPAPAR.
- Baris 1271: `AKTIVITI_LABEL[row.aktiviti] ?? row.aktiviti` — `AKTIVITI_LABEL` (baris 169–179) **tiada key "bergambar-rajah"** (juga tiada "isi-kosong", "game-neon", "game-drag"). Fallback ke string mentah, jadi label akan papar "bergambar-rajah" (buruk tapi masih papar). Kosmetik, bukan bug hilang data.
- `bulanTopikLemah` (baris 778–785) filter `aktiviti !== "nota"` + wajib ada `topik`. "bergambar-rajah" tiada topik → dikecualikan dari seksyen "Topik Lemah" sahaja (betul, bukan bug).
- `kemajuanSubjek` (baris 823–832) kira unique `aktiviti`/5 tanpa whitelist — "bergambar-rajah" tetap dikira.
- `minggu`/`bulan` agregat (baris 736–773) guna `stats.soalan_dijawab` dan `progress.jumlah_soalan` — takde pengecualian.

## 4. Timezone — TIDAK exclude rekod 04:01 UTC

- 2026-07-16 04:01 UTC = 2026-07-16 12:01 KL. `toKLDate(created_at)` (baris 132–134) pulangkan `"2026-07-16"`, iaitu `daysAgoKL(0)` = hari ini KL. Dalam `tarikhMingguIni`/`tarikhBulanIni` (baris 725–734). OK.

## 5. Nota kecil (tak berkaitan bug ini)

- Baris 596 & 669: kalau `list` berubah (contoh anak baru ditambah/dipadam) dan `aktifId` sudah wujud tapi merujuk anak yang telah dibuang, `anakAktif` jadi `null`, `anakUserId` `null`, dashboard clear data (baris 683–689). Bukan kes Amat.

## Cadangan (untuk kelulusan berasingan)

Kalau nak fix root cause selain klik manual:
1. Persist `aktifId` ke `localStorage` supaya pilihan Amat kekal antara reload.
2. Kalau tiada `aktifId` tersimpan, default ke anak yang **paling baru ada aktiviti** (query `user_progress` ringkas per child) daripada anak pertama dicipta.
3. Tambah "bergambar-rajah", "isi-kosong", "game-neon", "game-drag" ke `AKTIVITI_LABEL` (baris 169) supaya label tak papar string kod mentah.

Tiada perubahan kod dibuat dalam siasatan ini.
