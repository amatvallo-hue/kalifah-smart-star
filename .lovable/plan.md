## Penemuan (Investigation Report)

### 1. `game-matik-drag` — timer TIDAK di-wire (BUG dikonfirmasi)

**Fail:** `src/components/games/MatikDragGame.tsx`, baris **88–100**

```tsx
useEffect(() => {
  if (habis) {
    simpanProgress({
      ...
      masaAmbil: 0,   // ← hardcoded 0
    });
  }
}, [habis]);
```

Tiada `useState(() => Date.now())`, tiada `mulaMasa`, tiada pengiraan tempoh. Nilai `0` di-hantar terus setiap kali. Ini menjelaskan 100% rekod `masa_ambil = 0` untuk aktiviti ini.

**Fix cadangan (selamat, terhad):** tambah `const [mulaMasa] = useState(() => Date.now())` dan tukar `masaAmbil: 0` → `masaAmbil: Math.round((Date.now() - mulaMasa) / 1000)`. Sama corak dengan `MatikNeonGame.tsx` (baris 264) dan `kuiz.tsx` (baris 283/297).

**Semak sekali:** `MatikNeonGame.tsx:264` sudah hantar masaAmbil sebenar — jadi memang cuma Drag Game yang tertinggal.

---

### 2. Timer tiada logik pause / idle / tab-blur (DIKONFIRMASI — kira masa tab terbuka, bukan masa aktif)

Semua timer guna corak sama:

| Fail | Baris | Corak |
|---|---|---|
| `latih-tubi.tsx` | 148, 160 | `useState(() => Date.now())` → `Math.round((Date.now() - mulaMasa)/1000)` |
| `kuiz.tsx` | 283, 297 | Sama |
| `bergambar-rajah.tsx` | 149, 234 | Sama |
| `game.tsx` (race) | 605 | `totalTime - masa` (countdown — SELAMAT, ada had atas) |
| `MatikNeonGame.tsx` | 264 | Sama corak wall-clock |

**Konsekuensi:** Wall-clock diff dari mount hingga submit. Kalau murid buka tab, tinggal 60 minit, balik jawab satu soalan, submit → direkod 60+ minit. Tiada:
- `visibilitychange` listener (pause bila tab tidak aktif)
- Idle detection (tiada input X saat)
- Cap maksimum per aktiviti

Ini menjelaskan outlier: latih-tubi 4531s (~75 min), kuiz 1206s (~20 min), bergambar-rajah 1469s (~24 min). Bukan bug logik — memang begini reka bentuknya.

**Fix cadangan (pilih satu, ikut selera Amat):**
- **Ringkas:** cap `masaAmbil` di `simpanProgress()` (`src/lib/progress.ts:146`) — cth `Math.min(masa, 1800)` (max 30 min/rekod). Satu tempat, semua aktiviti terlindung, tiada risiko regresi.
- **Sederhana:** tambah `document.visibilitychange` pause di setiap komponen. Lebih tepat, tapi kena sentuh 5+ fail.
- **Lengkap:** hook `useActiveTime()` yang pause bila tab blur + idle >30s. Terbaik, tapi kerja besar.

Untuk parent dashboard, cadangan **Ringkas** (cap 30 min/rekod) menutup 90% masalah persepsi tanpa risiko.

---

### 3. Agregat harian guna `Math.round`, BUKAN `Math.floor` (SEPARA dikonfirmasi)

**Fail:** `src/lib/progress.ts`, baris **210**

```ts
const minit = Math.max(0, Math.round(masa / 60));
```

**Analisis:**
- 30–89 saat → 1 minit (dikira ✅)
- 0–29 saat → **0 minit** (HILANG dari `user_stats.masa_belajar` ❌)
- 90–149 saat → 2 minit, dll.

Jadi aktiviti sangat pendek (<30s) memang hilang dari jumlah minit harian. Tapi bukan sama teruk macam `floor` (yang akan buang sehingga 59s).

**Nota penting:** `user_progress.masa_ambil` disimpan dalam **SAAT PENUH** (baris 178 & 202) — tepat, tiada kehilangan di sini. Masalah pembundaran hanya berlaku semasa agregat ke `user_stats.masa_belajar` (minit). Jadi dashboard yang tunjuk masa per-aktiviti (kalau ada) tetap tepat; hanya jumlah minit harian yang boleh under-count.

**Fix cadangan (kalau nak semua saat dikira):**
- Tukar `user_stats.masa_belajar` simpan **saat** dan format ke minit di UI (kerja migrasi + backfill — besar).
- Atau tambah kolum `masa_belajar_saat` selari (kecil, tak break).
- Atau terima trade-off semasa dan biarkan (kerugian purata: ~15s × bilangan aktiviti pendek/hari).

---

### Ringkasan untuk Amat

| # | Isu | Status | Impak | Fix mudah? |
|---|---|---|---|---|
| 1 | Drag Game masa selalu 0 | **Bug jelas** | Sedang | Ya — 2 baris di `MatikDragGame.tsx` |
| 2 | Timer kira masa tab terbuka | **By design**, tiada pause | Tinggi (outlier ~75 min) | Ya — cap `Math.min(masa, 1800)` di `progress.ts:146` |
| 3 | Aktiviti <30s hilang dari minit harian | **Round, bukan floor** | Rendah (per-rekod saat masih tepat) | Tidak (perlu ubah skema) |

**Tiada perubahan dibuat.** Tunggu arahan Amat sebelum implement fix mana-mana.