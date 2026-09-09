# Phase 2 — Bukti Produk Visual untuk Ciri

## Matlamat
Ubah hanya bahagian `Ciri()` menjadi tiga blok bukti produk yang lebih bergambar, menggunakan paparan sebenar pengalaman anak dalam Kalifah. Tajuk bahagian, subtajuk, dan semua bahagian lain kekal.

## Visual yang akan digunakan
1. **01 — Faham Dulu**
   - Paparan sebenar `Nota Ringkas` Matematik dengan pilihan topik serta bahagian formula/poin penting.
   - Crop membuang navigasi dan ruang kosong supaya isi pembelajaran jelas.

2. **02 — Berlatih Dengan Cara Berbeza**
   - Paparan sebenar `MatikStar` ketika soalan aktif, termasuk kemajuan, soalan, ruang jawapan, dan pilihan jawapan.
   - Satu paparan kuat digunakan supaya tidak kelihatan seperti kolaj padat.

3. **03 — Kekal Bermotivasi**
   - Composite ringan daripada UI sebenar: jumlah star, pilihan hadiah di `Kedai Hadiah`, dan potongan `Sijil Cemerlang`.
   - Setiap elemen kekal berdasarkan rupa produk sebenar; composite hanya menyusun bukti supaya ketiga-tiga hasil mudah difahami dalam satu visual.

## Pelaksanaan
- Sediakan tiga aset screenshot bersih daripada UI produk semasa, tanpa dashboard ibu bapa.
- Muat naik aset melalui aliran aset projek dan gunakan pointer imej dalam landing page.
- Ganti senarai teks lama dengan tiga baris produk berselang kiri/kanan pada desktop.
- Pada telefon, setiap gambar berada di atas teks, menggunakan crop yang stabil dan ruang yang lebih padat.
- Gunakan copy tepat:
  - `Nota ringkas ikut topik bantu anak faham semula sebelum terus berlatih.`
  - `Latihan, kuiz dan game bantu anak belajar dengan lebih aktif dan tidak membosankan.`
  - `Setiap jawapan betul beri star. Anak boleh tebus hadiah dan raikan pencapaian dengan sijil.`

## Had skop
- Perubahan akhir hanya pada `src/routes/index.tsx` dan aset screenshot baharu.
- Tiada perubahan pada Hero, PainAmplifier, Twist, Mekanisme, bahagian lain, laluan, logik aplikasi, data, atau penerbitan.

## Pengesahan
- Jalankan `bunx tsc --noEmit`.
- Semak paparan desktop 1280px dan telefon 390px.
- Pastikan tiada limpahan mendatar atau ralat console, visual jelas, dan `Ciri()` sahaja berubah.
