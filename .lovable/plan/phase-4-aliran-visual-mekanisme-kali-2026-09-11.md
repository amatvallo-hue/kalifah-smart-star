# Phase 4 — Aliran Visual Mekanisme KALI

## Skop
- Ubah hanya `Mekanisme()` dan pembantu kecil yang digunakan eksklusif olehnya dalam `src/routes/index.tsx`.
- Kekalkan semua bahagian, salinan, pautan, dan logik lain tanpa perubahan.

## Reka Bentuk Dipilih
- Gunakan arah **Sequential Learning Pipeline** dengan latar krim hangat, hijau Kalifah, amber terkawal, dan KALI Blue hanya untuk analisis.
- Jadikan keseluruhan komposisi satu aliran bersambung, bukan tiga kad setara.
- Desktop: aliran kiri ke kanan dengan laluan 1 → 2 → 3; pentas tengah lebih besar dan paling menonjol.
- Telefon: aliran menegak khusus dengan penyambung arah ke bawah.

## Kandungan Visual
1. **Anak Jawab** — soalan `8 ÷ 2 = ?`, empat pilihan jawapan, jawapan `4` ditanda, dan pola `✓ ✗ ✓ ✓ ✗`.
2. **KALI Nampak Corak** — `KALI Insight`, `Tambah / Sudah Dikuasai`, serta `Bahagi / Perlu Diperkukuhkan`.
3. **Latihan Seterusnya** — `Seterusnya: Bahagi` dan paparan bukan interaktif `Mulakan Latihan →`.

## Gerakan dan Aksesibiliti
- Laluan dilukis sekali, pola jawapan muncul berurutan, isyarat insight berdenyut sekali, dan langkah akhir muncul terakhir.
- Semua makna kekal jelas tanpa gerakan dan `prefers-reduced-motion` dihormati.
- Status menggunakan teks dan simbol selain warna.

## Validasi
- Jalankan pemeriksaan jenis/binaan yang tersedia.
- Semak paparan 1280px, 390px, dan 360px untuk limpahan mendatar, ralat konsol, keterbacaan, serta ritma menuju bahagian Ciri.
- Tidak menerbitkan ke production.
