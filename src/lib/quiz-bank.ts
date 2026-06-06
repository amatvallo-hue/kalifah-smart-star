export type QuizQuestion = {
  soalan: string;
  pilihan: string[];
  jawapan: number; // index 0-based
  nota?: string;
};

// Key format: `${darjahId}:${subjekId}`
export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  "1:matematik": [
    { soalan: "Nombor apakah selepas 7?", pilihan: ["6", "8", "9", "10"], jawapan: 1, nota: "Selepas 7 ialah 8." },
    { soalan: "Nombor manakah paling besar?", pilihan: ["5", "12", "8", "15"], jawapan: 3, nota: "15 paling besar." },
    { soalan: "Nombor apakah sebelum 10?", pilihan: ["11", "10", "9", "8"], jawapan: 2, nota: "Sebelum 10 ialah 9." },
    { soalan: "3 + 4 = ?", pilihan: ["6", "7", "8", "9"], jawapan: 1 },
    { soalan: "10 - 3 = ?", pilihan: ["6", "8", "7", "13"], jawapan: 2 },
    { soalan: "5 + 5 = ?", pilihan: ["9", "10", "11", "55"], jawapan: 1 },
    { soalan: "8 - 4 = ?", pilihan: ["2", "3", "4", "12"], jawapan: 2 },
    { soalan: "Bentuk dengan 3 sisi ialah?", pilihan: ["Bulatan", "Segiempat", "Segitiga", "Segilima"], jawapan: 2 },
    { soalan: "Berapa sisi segiempat?", pilihan: ["2", "3", "4", "5"], jawapan: 2 },
    { soalan: "Siti ada 4 guli + Abu ada 5 guli = ?", pilihan: ["7", "8", "9", "10"], jawapan: 2 },
    { soalan: "10 oren - 3 dimakan = ?", pilihan: ["5", "6", "7", "8"], jawapan: 2 },
    { soalan: "1, 2, 3, ___, 5 — isi tempat kosong:", pilihan: ["2", "4", "6", "3"], jawapan: 1 },
    { soalan: "10, ___, 12, 13 — isi tempat kosong:", pilihan: ["9", "11", "10", "14"], jawapan: 1 },
    { soalan: "5 + 6 = ?", pilihan: ["9", "10", "11", "12"], jawapan: 2 },
    { soalan: "Ali ada 6 epal + 3 lagi = ?", pilihan: ["3", "8", "9", "10"], jawapan: 2 },
  ],
  "2:bahasa-melayu": [
    { soalan: "Pilih ayat yang betul:", pilihan: ["Ibu memasak nasi di dapur", "Ibu di dapur memasak nasi", "Memasak ibu nasi di dapur", "Di dapur ibu nasi memasak"], jawapan: 0 },
    { soalan: "Apakah imbuhan dalam perkataan 'berlari'?", pilihan: ["ber", "lari", "ri", "berl"], jawapan: 0 },
    { soalan: "Pilih kata nama:", pilihan: ["berlari", "cantik", "dengan", "meja"], jawapan: 3 },
    { soalan: "Apakah antonim 'rajin'?", pilihan: ["pandai", "malas", "sihat", "kuat"], jawapan: 1 },
    { soalan: "Pilih kata adjektif:", pilihan: ["berlari", "meja", "cantik", "dengan"], jawapan: 2 },
    { soalan: "Ayat manakah menggunakan tanda baca yang betul?", pilihan: ["ibu memasak nasi", "Ibu memasak nasi.", "ibu Memasak nasi", "Ibu memasak Nasi"], jawapan: 1 },
    { soalan: "Apakah sinonim 'gembira'?", pilihan: ["sedih", "marah", "suka", "takut"], jawapan: 2 },
    { soalan: "Pilih kata kerja:", pilihan: ["meja", "cantik", "berlari", "dengan"], jawapan: 2 },
    { soalan: "Ayat manakah ayat tanya?", pilihan: ["Ibu memasak nasi", "Tolong tutup pintu", "Di manakah buku saya", "Ambil buku itu"], jawapan: 2 },
    { soalan: "Apakah maksud peribahasa 'seperti aur dengan tebing'?", pilihan: ["Saling bergaduh", "Saling membantu", "Saling berdiam", "Saling bersaing"], jawapan: 1 },
    { soalan: "Pilih kata hubung:", pilihan: ["meja", "cantik", "berlari", "dan"], jawapan: 3 },
    { soalan: "Apakah imbuhan dalam 'pemimpin'?", pilihan: ["pe", "pem", "mimpin", "in"], jawapan: 1 },
    { soalan: "Pilih ayat perintah:", pilihan: ["Ibu memasak nasi", "Di mana buku saya", "Tolong tutup pintu", "Saya suka membaca"], jawapan: 2 },
    { soalan: "Apakah antonim 'besar'?", pilihan: ["tinggi", "panjang", "kecil", "lebar"], jawapan: 2 },
    { soalan: "Pilih kata sendi nama:", pilihan: ["berlari", "di", "cantik", "meja"], jawapan: 1 },
  ],
};

export function getQuiz(darjahId: string, subjekId: string): QuizQuestion[] | undefined {
  return QUIZ_BANK[`${darjahId}:${subjekId}`];
}
