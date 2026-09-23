# Parent Dashboard V2 — Ringkasan Pembelajaran Anak Berbayar

## Matlamat
Susun semula dashboard supaya ibu bapa yang mempunyai akses berbayar terus nampak keadaan pembelajaran anak, kekuatan, bahagian yang perlu dibantu, perubahan 30 hari, dan langkah seterusnya. Pengalaman anak tanpa data dan parent tanpa akses berbayar kekal jelas serta tidak rosak.

## Pelaksanaan
- Tukar penentuan `anakPaid` kepada status darjah anak aktif daripada `aksesStatus`; hanya `lifetime`, `active`, dan `expiring_soon` dianggap berbayar. Paparan status akses sedia ada dikekalkan.
- Tambah satu pemuat data KALI khusus anak aktif yang menggabungkan penguasaan semasa, nama kemahiran/subjek, snapshot 30 hari, dan cadangan `kali_next_best_question` melalui akses parent sedia ada.
- Jangan tambah polisi longgar, bypass RLS, `SECURITY DEFINER`, atau migration baharu. Jika bacaan KALI tidak tersedia kepada sesi parent, paparkan empty state selamat dan laporkan keperluan pengesahan live DB.
- Bina paparan berbayar mengikut urutan:
  1. `Ringkasan Anak` dengan status deskriptif, ayat natural, kekuatan utama, perhatian utama, dan fokus seterusnya.
  2. `Fokus KALI Sekarang` menggunakan cadangan enjin sedia ada dalam bentuk lebih padat.
  3. `Kekuatan & Perlu Diperkukuhkan`, maksimum tiga kemahiran setiap sisi dengan subjek, peratus, dan label mesra parent.
  4. `Apa Yang KALI Perasan`, maksimum tiga insight dengan prioriti STUCK → NEW GAP → IMPROVING → MASTERED.
  5. `Perubahan 30 Hari`, termasuk ringkasan bilangan dan maksimum tiga contoh perubahan yang sah.
  6. `Ringkasan Minggu Ini` yang padat.
  7. `3 Aktiviti Terkini`.
  8. Semua metrik dan fungsi sekunder sedia ada di bawah `Lihat butiran penuh`.
- Kekalkan aliran percuma sedia ada untuk parent unpaid, termasuk `KaliUpdateCard`, tanpa memaparkan V2 berbayar.
- Kekalkan MPT4, hadiah, Kalifah Hati, sijil, rekod topik, trend, badges, tetapan akaun, dan fungsi pemadaman/reset; hanya pindahkan kedudukan ke bahagian butiran penuh bila perlu.

## Logik Data
- Status keseluruhan ikut ambang yang diberi, dengan keadaan data sedikit dinilai dahulu supaya tiada kesimpulan berlebihan.
- Senarai kuat/lemah mengutamakan kemahiran dengan sekurang-kurangnya lima percubaan; tiada nilai palsu `0%` untuk data kosong.
- Pattern detection:
  - STUCK: `total_attempts >= 20` dan `mastery_score < 40`
  - NEW GAP: `5–19` percubaan dan `mastery_score < 40`
  - IMPROVING: snapshot terawal ke terkini naik sekurang-kurangnya 10 mata dan mempunyai sekurang-kurangnya dua masa rekod berbeza
  - MASTERED: `mastery_score >= 80` dan `total_attempts >= 10`
- Perubahan 30 hari hanya menggunakan pasangan snapshot yang sah untuk kemahiran sama.

## Reka Bentuk
- Mobile satu kolum dahulu; desktop dua kolum hanya untuk perbandingan yang sesuai.
- Hijau Kalifah sebagai warna utama, amber untuk perhatian, dan merah hanya apabila penguasaan benar-benar bawah 40.
- Permukaan utama menggunakan bahasa BM mudah tanpa jargon teknikal; detail teknikal sedia ada kekal di bahagian butiran penuh.

## Skop
- Ubah hanya `src/routes/dashboard.ibu-bapa.tsx` kecuali pengesahan akses data membuktikan fungsi parent sedia ada perlu dipanjangkan dengan selamat.
- Jangan ubah login, child linking, checkout, ToyyibPay, MPT4, sijil, hadiah, Kalifah Hati, tracking, atau struktur akses lain.
- Preview sahaja; tiada publish/deploy production.

## Pengesahan
- Jalankan typecheck dan semak build automatik.
- Uji keadaan paid, unpaid, dan anak tanpa data sejauh sesi preview membenarkan; tandakan pengujian authenticated sebagai belum disahkan jika tiada sesi parent.
- Semak desktop 1280px dan iPhone 390px: susunan, overflow, empty state, dan console errors.
- Sahkan semula bahawa semua fungsi lama masih berada dalam `Lihat butiran penuh` dan tiada seksyen luar skop berubah.
