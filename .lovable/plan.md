# Phase 3 — Parent Evidence Section

## Matlamat
Tambah satu seksyen visual baharu selepas `Ciri()` dan sebelum `LiputanKurikulum()` yang menunjukkan tiga bukti kepada ibu bapa: perkara yang perlu diberi perhatian, perkembangan penguasaan, dan rekod aktiviti pembelajaran.

## Visual yang dipilih
Gunakan satu composite ringan berasaskan UI sebenar `dashboard.ibu-bapa.tsx`, bukan paparan analitik generik:
- Fokus utama: ringkasan kemahiran dengan status `Perlu Diperkukuhkan`, `Sedang Berkembang`, dan `Sudah Dikuasai`.
- Bukti sokongan: potongan `3 Aktiviti Terkini` untuk menunjukkan pembelajaran benar-benar direkodkan.
- Rupa, label, dan struktur kekal setia kepada produk; data paparan akan neutral tanpa nama, markah, peratus, atau hasil rekaan.

## Pelaksanaan
- Sediakan satu aset visual parent-evidence yang bersih dan muat naik melalui aliran aset projek.
- Tambah helper `ParentEvidence()` dalam `src/routes/index.tsx`.
- Gunakan copy tepat:
  - Eyebrow: `UNTUK IBU BAPA`
  - Tajuk: `Anak Belajar. Ibu Bapa Nampak Apa Yang Berubah.`
  - Sokongan: `Bukan sekadar tahu anak sudah buat latihan. Kalifah bantu ibu bapa nampak bahagian yang perlu diberi perhatian dan perkembangan yang sedang berlaku.`
  - Tiga poin ringkas seperti yang diberikan, dengan pelarasan tatabahasa kecil hanya jika perlu.
- Desktop: visual dominan sekitar dua pertiga lebar, teks ringkas di sisi.
- Telefon: visual dahulu dengan crop yang memastikan insight dan aktiviti masih jelas, diikuti tiga poin padat.
- Masukkan `<ParentEvidence />` hanya di antara `<Ciri />` dan `<LiputanKurikulum />`.

## Had skop
- Ubah hanya `src/routes/index.tsx` dan aset visual baharu yang diperlukan.
- Jangan ubah Hero, PainAmplifier, Twist, Mekanisme, Ciri sedia ada, kurikulum, harga, FAQ, footer, header, atau sebarang logik produk.
- Preview sahaja; tiada penerbitan production.

## Pengesahan
- Jalankan `bunx tsc --noEmit`.
- Semak desktop 1280px dan telefon 390px.
- Pastikan tiada limpahan mendatar atau ralat console, visual boleh dibaca, dan rentak `Ciri → Parent Evidence → Curriculum` kekal baik.
