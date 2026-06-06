// Content banks for the 3 new mini-games. Keyed by subject so every
// darjah (1-6) gets a working set. Customise per darjah by adding a
// `${darjah}:${subjek}` key that overrides the subject default.

export type BSItem = { teks: string; betul: boolean; nota?: string };
export type PJPair = { kiri: string; kanan: string };
export type SAItem = { perkataan: string[]; ayat: string };

// ─────────────────────── BETUL / SALAH ───────────────────────
const BS_BM: BSItem[] = [
  { teks: "Huruf vokal ialah a, e, i, o, u.", betul: true },
  { teks: "'Buku' ialah kata kerja.", betul: false, nota: "Ia kata nama." },
  { teks: "Lawan bagi 'panas' ialah 'sejuk'.", betul: true },
  { teks: "Ayat tanya berakhir dengan tanda noktah.", betul: false, nota: "Tanda soal (?)." },
  { teks: "'Saya makan nasi' ialah ayat lengkap.", betul: true },
  { teks: "'Kucing' mempunyai 3 suku kata.", betul: false, nota: "2 suku kata: ku-cing." },
  { teks: "Kata sendi nama 'di' digunakan untuk tempat.", betul: true },
  { teks: "Imbuhan 'ber-' boleh ditambah pada kata nama.", betul: true },
  { teks: "'Mereka' ialah kata ganti diri pertama.", betul: false, nota: "Ia kata ganti diri ketiga." },
  { teks: "Sinonim 'gembira' ialah 'suka'.", betul: true },
];
const BS_MATE: BSItem[] = [
  { teks: "5 + 5 = 10.", betul: true },
  { teks: "Segitiga ada 4 sisi.", betul: false, nota: "3 sisi." },
  { teks: "Nombor genap berakhir dengan 0, 2, 4, 6, 8.", betul: true },
  { teks: "100 sen = RM1.", betul: true },
  { teks: "12 ÷ 4 = 4.", betul: false, nota: "Jawapannya 3." },
  { teks: "1 jam = 60 minit.", betul: true },
  { teks: "Bulatan ada bucu.", betul: false, nota: "Bulatan tiada bucu." },
  { teks: "Pecahan 1/2 lebih besar daripada 1/4.", betul: true },
  { teks: "Sudut tepat ialah 90°.", betul: true },
  { teks: "Hasil darab dua nombor genap sentiasa ganjil.", betul: false, nota: "Sentiasa genap." },
];
const BS_BI: BSItem[] = [
  { teks: "'Apple' is a fruit.", betul: true },
  { teks: "The opposite of 'hot' is 'big'.", betul: false, nota: "It is 'cold'." },
  { teks: "We use 'am' with 'I'.", betul: true },
  { teks: "A week has 8 days.", betul: false, nota: "7 days." },
  { teks: "'Cat' is a noun.", betul: true },
  { teks: "'Run' is an adjective.", betul: false, nota: "It is a verb." },
  { teks: "'They' is a pronoun.", betul: true },
  { teks: "We add '-s' to make most nouns plural.", betul: true },
  { teks: "A sentence ends with a comma.", betul: false, nota: "Period/full stop." },
  { teks: "'Beautiful' is an adjective.", betul: true },
];
const BS_JAWI: BSItem[] = [
  { teks: "Huruf ا dibaca sebagai 'Alif'.", betul: true },
  { teks: "Huruf ب dibaca sebagai 'Ta'.", betul: false, nota: "Ia 'Ba'." },
  { teks: "Huruf jawi ditulis dari kanan ke kiri.", betul: true },
  { teks: "Jumlah huruf jawi ialah 26.", betul: false, nota: "37 huruf." },
  { teks: "Huruf س dibaca sebagai 'Sin' (S).", betul: true },
  { teks: "كوچيڠ bermaksud kucing.", betul: true },
  { teks: "Huruf ر dibaca sebagai 'Lam'.", betul: false, nota: "Ia 'Ra'." },
  { teks: "Huruf ک dibaca sebagai 'Kaf' (K).", betul: true },
  { teks: "بوكو bermaksud meja.", betul: false, nota: "Ia bermaksud buku." },
  { teks: "Tulisan jawi berasal daripada tulisan Arab.", betul: true },
];
const BS_PI: BSItem[] = [
  { teks: "Rukun Islam ada 5.", betul: true },
  { teks: "Solat fardu sehari 6 waktu.", betul: false, nota: "5 waktu." },
  { teks: "Solat Subuh 2 rakaat.", betul: true },
  { teks: "Kita baca Bismillah sebelum makan.", betul: true },
  { teks: "Salam dijawab dengan 'Waalaikumussalam'.", betul: true },
  { teks: "Nabi terakhir ialah Nabi Isa AS.", betul: false, nota: "Nabi Muhammad SAW." },
  { teks: "Al-Quran kitab suci umat Islam.", betul: true },
  { teks: "Puasa Ramadan rukun Islam keempat.", betul: true },
  { teks: "Wuduk batal jika tidur nyenyak.", betul: true },
  { teks: "Kiblat umat Islam ialah Masjidil Aqsa.", betul: false, nota: "Kaabah di Mekah." },
];
const BS_SAINS: BSItem[] = [
  { teks: "Manusia ada 5 deria.", betul: true },
  { teks: "Tumbuhan membuat makanan melalui fotosintesis.", betul: true },
  { teks: "Matahari beredar mengelilingi bumi.", betul: false, nota: "Bumi mengelilingi matahari." },
  { teks: "Air membeku pada 0°C.", betul: true },
  { teks: "Ikan bernafas dengan paru-paru.", betul: false, nota: "Insang." },
  { teks: "Bumi adalah planet ketiga dari matahari.", betul: true },
  { teks: "Bulan memancarkan cahaya sendiri.", betul: false, nota: "Pantulan cahaya matahari." },
  { teks: "Tiga keadaan jirim: pepejal, cecair, gas.", betul: true },
  { teks: "Akar tumbuhan menyerap air.", betul: true },
  { teks: "Graviti menarik objek ke atas.", betul: false, nota: "Ke bawah, ke arah bumi." },
];

export const BETUL_SALAH: Record<string, BSItem[]> = {
  "bahasa-melayu": BS_BM,
  matematik: BS_MATE,
  "bahasa-inggeris": BS_BI,
  jawi: BS_JAWI,
  "pendidikan-islam": BS_PI,
  sains: BS_SAINS,
};

// ─────────────────────── PADANKAN JAWAPAN ───────────────────────
const PJ_BM: PJPair[] = [
  { kiri: "Gembira", kanan: "Suka hati" },
  { kiri: "Pantas", kanan: "Laju" },
  { kiri: "Cantik", kanan: "Indah" },
  { kiri: "Pandai", kanan: "Bijak" },
  { kiri: "Rajin", kanan: "Tekun" },
  { kiri: "Besar", kanan: "Luas" },
  { kiri: "Sejuk", kanan: "Dingin" },
  { kiri: "Berani", kanan: "Tidak takut" },
];
const PJ_MATE: PJPair[] = [
  { kiri: "Segitiga", kanan: "3 sisi" },
  { kiri: "Segiempat", kanan: "4 sisi" },
  { kiri: "Pentagon", kanan: "5 sisi" },
  { kiri: "Heksagon", kanan: "6 sisi" },
  { kiri: "1 jam", kanan: "60 minit" },
  { kiri: "1 minit", kanan: "60 saat" },
  { kiri: "1 kg", kanan: "1000 g" },
  { kiri: "1 m", kanan: "100 cm" },
];
const PJ_BI: PJPair[] = [
  { kiri: "Happy", kanan: "Gembira" },
  { kiri: "Fast", kanan: "Pantas" },
  { kiri: "Big", kanan: "Besar" },
  { kiri: "Small", kanan: "Kecil" },
  { kiri: "Hot", kanan: "Panas" },
  { kiri: "Cold", kanan: "Sejuk" },
  { kiri: "Beautiful", kanan: "Cantik" },
  { kiri: "Smart", kanan: "Pandai" },
];
const PJ_JAWI: PJPair[] = [
  { kiri: "ا", kanan: "Alif" },
  { kiri: "ب", kanan: "Ba" },
  { kiri: "ت", kanan: "Ta" },
  { kiri: "س", kanan: "Sin" },
  { kiri: "ر", kanan: "Ra" },
  { kiri: "ک", kanan: "Kaf" },
  { kiri: "كوچيڠ", kanan: "Kucing" },
  { kiri: "بوكو", kanan: "Buku" },
];
const PJ_PI: PJPair[] = [
  { kiri: "Subuh", kanan: "2 rakaat" },
  { kiri: "Zohor", kanan: "4 rakaat" },
  { kiri: "Asar", kanan: "4 rakaat" },
  { kiri: "Maghrib", kanan: "3 rakaat" },
  { kiri: "Isyak", kanan: "4 rakaat" },
  { kiri: "Rukun Islam", kanan: "5 perkara" },
  { kiri: "Rukun Iman", kanan: "6 perkara" },
  { kiri: "Kitab Islam", kanan: "Al-Quran" },
];
const PJ_SAINS: PJPair[] = [
  { kiri: "Mata", kanan: "Melihat" },
  { kiri: "Telinga", kanan: "Mendengar" },
  { kiri: "Hidung", kanan: "Menghidu" },
  { kiri: "Lidah", kanan: "Merasa" },
  { kiri: "Kulit", kanan: "Menyentuh" },
  { kiri: "Akar", kanan: "Menyerap air" },
  { kiri: "Daun", kanan: "Fotosintesis" },
  { kiri: "Insang", kanan: "Bernafas ikan" },
];

export const PADANKAN: Record<string, PJPair[]> = {
  "bahasa-melayu": PJ_BM,
  matematik: PJ_MATE,
  "bahasa-inggeris": PJ_BI,
  jawi: PJ_JAWI,
  "pendidikan-islam": PJ_PI,
  sains: PJ_SAINS,
};

// ─────────────────────── SUSUN AYAT ───────────────────────
const SA_BM: SAItem[] = [
  { ayat: "Ibu memasak nasi di dapur", perkataan: ["Ibu", "memasak", "nasi", "di", "dapur"] },
  { ayat: "Ali pergi ke sekolah setiap hari", perkataan: ["Ali", "pergi", "ke", "sekolah", "setiap", "hari"] },
  { ayat: "Rajin belajar supaya berjaya dalam peperiksaan", perkataan: ["Rajin", "belajar", "supaya", "berjaya", "dalam", "peperiksaan"] },
  { ayat: "Buku adalah jendela ilmu pengetahuan", perkataan: ["Buku", "adalah", "jendela", "ilmu", "pengetahuan"] },
  { ayat: "Kita mesti menghormati ibu bapa kita", perkataan: ["Kita", "mesti", "menghormati", "ibu", "bapa", "kita"] },
];
const SA_MATE: SAItem[] = [
  { ayat: "Dua tambah tiga sama dengan lima", perkataan: ["Dua", "tambah", "tiga", "sama", "dengan", "lima"] },
  { ayat: "Sepuluh tolak empat sama dengan enam", perkataan: ["Sepuluh", "tolak", "empat", "sama", "dengan", "enam"] },
  { ayat: "Segitiga mempunyai tiga sisi", perkataan: ["Segitiga", "mempunyai", "tiga", "sisi"] },
  { ayat: "Satu jam ada enam puluh minit", perkataan: ["Satu", "jam", "ada", "enam", "puluh", "minit"] },
  { ayat: "Satu kilogram bersamaan seribu gram", perkataan: ["Satu", "kilogram", "bersamaan", "seribu", "gram"] },
];
const SA_BI: SAItem[] = [
  { ayat: "I go to school every day", perkataan: ["I", "go", "to", "school", "every", "day"] },
  { ayat: "She is reading a book", perkataan: ["She", "is", "reading", "a", "book"] },
  { ayat: "The cat is on the mat", perkataan: ["The", "cat", "is", "on", "the", "mat"] },
  { ayat: "We play football in the field", perkataan: ["We", "play", "football", "in", "the", "field"] },
  { ayat: "My mother cooks delicious food", perkataan: ["My", "mother", "cooks", "delicious", "food"] },
];
const SA_JAWI: SAItem[] = [
  { ayat: "Saya pergi ke sekolah", perkataan: ["Saya", "pergi", "ke", "sekolah"] },
  { ayat: "Ibu memasak di dapur", perkataan: ["Ibu", "memasak", "di", "dapur"] },
  { ayat: "Ayah membaca surat khabar", perkataan: ["Ayah", "membaca", "surat", "khabar"] },
  { ayat: "Adik bermain di taman", perkataan: ["Adik", "bermain", "di", "taman"] },
  { ayat: "Kami solat di masjid", perkataan: ["Kami", "solat", "di", "masjid"] },
];
const SA_PI: SAItem[] = [
  { ayat: "Solat itu tiang agama", perkataan: ["Solat", "itu", "tiang", "agama"] },
  { ayat: "Kita wajib menghormati ibu bapa", perkataan: ["Kita", "wajib", "menghormati", "ibu", "bapa"] },
  { ayat: "Membaca Al-Quran adalah ibadah", perkataan: ["Membaca", "Al-Quran", "adalah", "ibadah"] },
  { ayat: "Puasa mengajar kita bersabar", perkataan: ["Puasa", "mengajar", "kita", "bersabar"] },
  { ayat: "Berbuat baik kepada semua orang", perkataan: ["Berbuat", "baik", "kepada", "semua", "orang"] },
];
const SA_SAINS: SAItem[] = [
  { ayat: "Tumbuhan memerlukan cahaya matahari untuk hidup", perkataan: ["Tumbuhan", "memerlukan", "cahaya", "matahari", "untuk", "hidup"] },
  { ayat: "Bumi mengelilingi matahari setiap tahun", perkataan: ["Bumi", "mengelilingi", "matahari", "setiap", "tahun"] },
  { ayat: "Air membeku pada suhu sifar darjah", perkataan: ["Air", "membeku", "pada", "suhu", "sifar", "darjah"] },
  { ayat: "Ikan bernafas menggunakan insang di air", perkataan: ["Ikan", "bernafas", "menggunakan", "insang", "di", "air"] },
  { ayat: "Manusia mempunyai lima deria utama", perkataan: ["Manusia", "mempunyai", "lima", "deria", "utama"] },
];

export const SUSUN_AYAT: Record<string, SAItem[]> = {
  "bahasa-melayu": SA_BM,
  matematik: SA_MATE,
  "bahasa-inggeris": SA_BI,
  jawi: SA_JAWI,
  "pendidikan-islam": SA_PI,
  sains: SA_SAINS,
};

export function getBetulSalah(subjekId: string): BSItem[] {
  return BETUL_SALAH[subjekId] ?? BS_BM;
}
export function getPadankan(subjekId: string): PJPair[] {
  return PADANKAN[subjekId] ?? PJ_BM;
}
export function getSusunAyat(subjekId: string): SAItem[] {
  return SUSUN_AYAT[subjekId] ?? SA_BM;
}
