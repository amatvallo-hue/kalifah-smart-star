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
  { ayat: "Panjang segi empat ialah enam sentimeter", perkataan: ["Panjang", "segi", "empat", "ialah", "enam", "sentimeter"] },
  { ayat: "Luas segiempat sama dengan panjang darab lebar", perkataan: ["Luas", "segiempat", "sama", "dengan", "panjang", "darab", "lebar"] },
  { ayat: "Faktor bagi dua belas ialah satu dua tiga empat enam dua belas", perkataan: ["Faktor", "bagi", "dua", "belas", "ialah", "satu", "dua", "tiga", "empat", "enam", "dua", "belas"] },
  { ayat: "Sudut tegak mempunyai sembilan puluh darjah", perkataan: ["Sudut", "tegak", "mempunyai", "sembilan", "puluh", "darjah"] },
];
const SA_BI: SAItem[] = [
  { ayat: "She is reading a book in the library", perkataan: ["She", "is", "reading", "a", "book", "in", "the", "library"] },
  { ayat: "The children are playing football in the field", perkataan: ["The", "children", "are", "playing", "football", "in", "the", "field"] },
  { ayat: "He went to school yesterday morning", perkataan: ["He", "went", "to", "school", "yesterday", "morning"] },
  { ayat: "They will finish their homework tonight", perkataan: ["They", "will", "finish", "their", "homework", "tonight"] },
  { ayat: "The book was read by Ali carefully", perkataan: ["The", "book", "was", "read", "by", "Ali", "carefully"] },
];
const SA_JAWI: SAItem[] = [
  { ayat: "Tulisan Jawi dibaca dari kanan ke kiri", perkataan: ["Tulisan", "Jawi", "dibaca", "dari", "kanan", "ke", "kiri"] },
  { ayat: "Bahasa Melayu boleh ditulis dalam tulisan Jawi", perkataan: ["Bahasa", "Melayu", "boleh", "ditulis", "dalam", "tulisan", "Jawi"] },
  { ayat: "Terdapat enam huruf tambahan dalam tulisan Jawi", perkataan: ["Terdapat", "enam", "huruf", "tambahan", "dalam", "tulisan", "Jawi"] },
  { ayat: "Huruf Alif ialah huruf Jawi yang pertama", perkataan: ["Huruf", "Alif", "ialah", "huruf", "Jawi", "yang", "pertama"] },
  { ayat: "Kita mesti menjaga warisan tulisan Jawi", perkataan: ["Kita", "mesti", "menjaga", "warisan", "tulisan", "Jawi"] },
];
const SA_PI: SAItem[] = [
  { ayat: "Kita wajib menunaikan solat lima waktu sehari", perkataan: ["Kita", "wajib", "menunaikan", "solat", "lima", "waktu", "sehari"] },
  { ayat: "Bulan Ramadan adalah bulan untuk berpuasa", perkataan: ["Bulan", "Ramadan", "adalah", "bulan", "untuk", "berpuasa"] },
  { ayat: "Kita mesti berakhlak mulia dalam kehidupan", perkataan: ["Kita", "mesti", "berakhlak", "mulia", "dalam", "kehidupan"] },
  { ayat: "Nabi Muhammad SAW adalah rasul terakhir", perkataan: ["Nabi", "Muhammad", "SAW", "adalah", "rasul", "terakhir"] },
  { ayat: "Membaca Al-Quran adalah amalan yang mulia", perkataan: ["Membaca", "Al-Quran", "adalah", "amalan", "yang", "mulia"] },
];
const SA_SAINS: SAItem[] = [
  { ayat: "Tumbuhan memerlukan cahaya air dan udara untuk hidup", perkataan: ["Tumbuhan", "memerlukan", "cahaya", "air", "dan", "udara", "untuk", "hidup"] },
  { ayat: "Fotosintesis berlaku di dalam daun yang hijau", perkataan: ["Fotosintesis", "berlaku", "di", "dalam", "daun", "yang", "hijau"] },
  { ayat: "Tiga keadaan jirim ialah pepejal cecair dan gas", perkataan: ["Tiga", "keadaan", "jirim", "ialah", "pepejal", "cecair", "dan", "gas"] },
  { ayat: "Bumi mengelilingi matahari dalam tempoh satu tahun", perkataan: ["Bumi", "mengelilingi", "matahari", "dalam", "tempoh", "satu", "tahun"] },
  { ayat: "Kitar semula dapat mengurangkan pencemaran alam sekitar", perkataan: ["Kitar", "semula", "dapat", "mengurangkan", "pencemaran", "alam", "sekitar"] },
];

export const SUSUN_AYAT: Record<string, SAItem[]> = {
  "bahasa-melayu": SA_BM,
  matematik: SA_MATE,
  "bahasa-inggeris": SA_BI,
  jawi: SA_JAWI,
  "pendidikan-islam": SA_PI,
  sains: SA_SAINS,
};

// ─────────────── SET 2 (Darjah 1 alternates) ───────────────
const BS_MATE_2: BSItem[] = [
  { teks: "3 + 3 = 6.", betul: true },
  { teks: "10 - 4 = 5.", betul: false },
  { teks: "5 + 4 = 9.", betul: true },
  { teks: "7 - 2 = 4.", betul: false },
  { teks: "4 + 4 = 8.", betul: true },
  { teks: "6 + 3 = 10.", betul: false },
  { teks: "9 - 5 = 4.", betul: true },
  { teks: "3 × 3 = 8.", betul: false },
  { teks: "Segi empat ada 4 sisi.", betul: true },
  { teks: "10 + 10 = 30.", betul: false },
];
const BS_BM_2: BSItem[] = [
  { teks: "'Meja' ialah kata nama.", betul: true },
  { teks: "Huruf konsonan ialah a, e, i, o, u.", betul: false },
  { teks: "Lawan 'rajin' ialah 'malas'.", betul: true },
  { teks: "'Berlari' menggunakan imbuhan 'me-'.", betul: false },
  { teks: "Ayat perintah berakhir dengan tanda seru.", betul: true },
  { teks: "'Kami' ialah kata ganti diri ketiga.", betul: false },
  { teks: "Sinonim 'pandai' ialah 'bijak'.", betul: true },
  { teks: "'Bunga' mempunyai 3 suku kata.", betul: false },
  { teks: "Kata adjektif menerangkan kata nama.", betul: true },
  { teks: "'Di' dan 'ke' ialah kata kerja.", betul: false },
];
const BS_BI_2: BSItem[] = [
  { teks: "A dog says 'meow'.", betul: false },
  { teks: "Monday is the first day of the week.", betul: true },
  { teks: "'Ran' is past tense of 'run'.", betul: true },
  { teks: "We use 'are' with 'he'.", betul: false },
  { teks: "Red, blue and green are colours.", betul: true },
  { teks: "A triangle has 4 sides.", betul: false },
  { teks: "'He' is a pronoun.", betul: true },
  { teks: "The sun rises in the west.", betul: false },
  { teks: "January is the first month.", betul: true },
  { teks: "'Quickly' is an adjective.", betul: false },
];
const BS_SAINS_2: BSItem[] = [
  { teks: "Deria rasa menggunakan lidah.", betul: true },
  { teks: "Matahari adalah sebuah planet.", betul: false },
  { teks: "Kupu-kupu termasuk serangga.", betul: true },
  { teks: "Air mendidih pada 50°C.", betul: false },
  { teks: "Tumbuhan perlukan cahaya untuk hidup.", betul: true },
  { teks: "Semua haiwan memakan daging.", betul: false },
  { teks: "Udara diperlukan untuk bernafas.", betul: true },
  { teks: "Batu adalah benda hidup.", betul: false },
  { teks: "Ular adalah reptilia.", betul: true },
  { teks: "Bulan menghasilkan cahaya sendiri.", betul: false },
];
const BS_PI_2: BSItem[] = [
  { teks: "Solat Isyak 4 rakaat.", betul: true },
  { teks: "Rukun Iman ada 5 perkara.", betul: false },
  { teks: "Kita membaca Bismillah sebelum makan.", betul: true },
  { teks: "Nabi pertama ialah Nabi Isa AS.", betul: false },
  { teks: "Zakat ialah rukun Islam ketiga.", betul: true },
  { teks: "Al-Quran diturunkan kepada Nabi Musa AS.", betul: false },
  { teks: "Solat Jumaat wajib bagi lelaki.", betul: true },
  { teks: "Kaabah terletak di Madinah.", betul: false },
  { teks: "Syahadah ialah rukun Islam pertama.", betul: true },
  { teks: "Malaikat ada 10 yang wajib diketahui.", betul: false },
];
const BS_JAWI_2: BSItem[] = [
  { teks: "Huruf ن dibaca 'Nun'.", betul: true },
  { teks: "Jawi ditulis kiri ke kanan.", betul: false },
  { teks: "Huruf ڤ ialah huruf tambahan Jawi.", betul: true },
  { teks: "Huruf Jawi sama dengan huruf Arab.", betul: false },
  { teks: "ماء bermaksud 'air'.", betul: true },
  { teks: "Huruf و dibaca 'Ya'.", betul: false },
  { teks: "Jawi boleh digunakan menulis BM.", betul: true },
  { teks: "Huruf ج dibaca 'Dal'.", betul: false },
  { teks: "روما bermaksud 'rumah'.", betul: true },
  { teks: "Huruf Alif berbentuk bulat.", betul: false },
];

const PJ_MATE_2: PJPair[] = [
  { kiri: "2 + 3", kanan: "5" },
  { kiri: "10 - 4", kanan: "6" },
  { kiri: "8 ÷ 2", kanan: "4" },
  { kiri: "Segi empat", kanan: "4 sisi" },
  { kiri: "Lima", kanan: "5" },
  { kiri: "Dozen", kanan: "12" },
  { kiri: "9 - 3", kanan: "6" },
  { kiri: "2 × 5", kanan: "10" },
];
const PJ_BM_2: PJPair[] = [
  { kiri: "Antonim 'tinggi'", kanan: "Rendah" },
  { kiri: "Sinonim 'cepat'", kanan: "Pantas" },
  { kiri: "Kata kerja", kanan: "Berlari" },
  { kiri: "Kata nama", kanan: "Buku" },
  { kiri: "Kata sifat", kanan: "Cantik" },
  { kiri: "Imbuhan 'me-' + 'tulis'", kanan: "Menulis" },
  { kiri: "Kata ganti diri kedua", kanan: "Awak" },
  { kiri: "3 suku kata", kanan: "Sekolah" },
];
const PJ_BI_2: PJPair[] = [
  { kiri: "Opposite of 'cold'", kanan: "Hot" },
  { kiri: "Plural of 'book'", kanan: "Books" },
  { kiri: "Animal that barks", kanan: "Dog" },
  { kiri: "Colour of grass", kanan: "Green" },
  { kiri: "Day after Monday", kanan: "Tuesday" },
  { kiri: "Opposite of 'night'", kanan: "Day" },
  { kiri: "We use ___ with 'they'", kanan: "Are" },
  { kiri: "Number of days in a week", kanan: "Seven" },
];
const PJ_SAINS_2: PJPair[] = [
  { kiri: "Deria pendengaran", kanan: "Telinga" },
  { kiri: "Haiwan herbivor", kanan: "Arnab" },
  { kiri: "Cecair menjadi pepejal", kanan: "Membeku" },
  { kiri: "Bahagian tumbuhan", kanan: "Akar" },
  { kiri: "Planet kita", kanan: "Bumi" },
  { kiri: "Haiwan karnivor", kanan: "Harimau" },
  { kiri: "Gas untuk bernafas", kanan: "Oksigen" },
  { kiri: "Pepejal menjadi cecair", kanan: "Mencair" },
];
const PJ_PI_2: PJPair[] = [
  { kiri: "Rukun Islam pertama", kanan: "Syahadah" },
  { kiri: "Solat Isyak", kanan: "4 rakaat" },
  { kiri: "Bulan Ramadan", kanan: "Puasa" },
  { kiri: "Nabi Muhammad SAW", kanan: "Rasul terakhir" },
  { kiri: "Zakat", kanan: "Rukun Islam ketiga" },
  { kiri: "Malaikat Jibril", kanan: "Pembawa wahyu" },
  { kiri: "Hari Jumaat", kanan: "Solat Jumaat" },
  { kiri: "Syurga", kanan: "Balasan orang beriman" },
];
const PJ_JAWI_2: PJPair[] = [
  { kiri: "ن", kanan: "Nun" },
  { kiri: "و", kanan: "Wau" },
  { kiri: "ي", kanan: "Ya" },
  { kiri: "م", kanan: "Mim" },
  { kiri: "روما", kanan: "Rumah" },
  { kiri: "ايبو", kanan: "Ibu" },
  { kiri: "اير", kanan: "Air" },
  { kiri: "ڤن", kanan: "Pen" },
];

const SA_MATE_2: SAItem[] = [
  { ayat: "Tiga tambah empat sama dengan tujuh", perkataan: ["Tiga", "tambah", "empat", "sama", "dengan", "tujuh"] },
  { ayat: "Sepuluh tolak lima sama dengan lima", perkataan: ["Sepuluh", "tolak", "lima", "sama", "dengan", "lima"] },
  { ayat: "Dua darab tiga sama dengan enam", perkataan: ["Dua", "darab", "tiga", "sama", "dengan", "enam"] },
  { ayat: "Lapan bahagi dua sama dengan empat", perkataan: ["Lapan", "bahagi", "dua", "sama", "dengan", "empat"] },
  { ayat: "Segi tiga mempunyai tiga bucu dan tiga sisi", perkataan: ["Segi", "tiga", "mempunyai", "tiga", "bucu", "dan", "tiga", "sisi"] },
];
const SA_BM_2: SAItem[] = [
  { ayat: "Adik saya suka makan buah epal", perkataan: ["Adik", "saya", "suka", "makan", "buah", "epal"] },
  { ayat: "Kucing itu sedang tidur di atas sofa", perkataan: ["Kucing", "itu", "sedang", "tidur", "di", "atas", "sofa"] },
  { ayat: "Kami pergi ke taman pada hari Ahad", perkataan: ["Kami", "pergi", "ke", "taman", "pada", "hari", "Ahad"] },
  { ayat: "Guru mengajar murid di dalam kelas", perkataan: ["Guru", "mengajar", "murid", "di", "dalam", "kelas"] },
  { ayat: "Ibu membeli sayur di pasar pagi", perkataan: ["Ibu", "membeli", "sayur", "di", "pasar", "pagi"] },
];
const SA_BI_2: SAItem[] = [
  { ayat: "The cat is sleeping on the mat", perkataan: ["The", "cat", "is", "sleeping", "on", "the", "mat"] },
  { ayat: "I like to eat apples and oranges", perkataan: ["I", "like", "to", "eat", "apples", "and", "oranges"] },
  { ayat: "She goes to school every morning", perkataan: ["She", "goes", "to", "school", "every", "morning"] },
  { ayat: "We are playing in the garden today", perkataan: ["We", "are", "playing", "in", "the", "garden", "today"] },
  { ayat: "He drinks milk every morning", perkataan: ["He", "drinks", "milk", "every", "morning"] },
];
const SA_SAINS_2: SAItem[] = [
  { ayat: "Manusia mempunyai lima deria yang penting", perkataan: ["Manusia", "mempunyai", "lima", "deria", "yang", "penting"] },
  { ayat: "Ikan hidup di dalam air dan bernafas dengan insang", perkataan: ["Ikan", "hidup", "di", "dalam", "air", "dan", "bernafas", "dengan", "insang"] },
  { ayat: "Daun tumbuhan berwarna hijau kerana klorofil", perkataan: ["Daun", "tumbuhan", "berwarna", "hijau", "kerana", "klorofil"] },
  { ayat: "Air hujan turun dari awan di langit", perkataan: ["Air", "hujan", "turun", "dari", "awan", "di", "langit"] },
  { ayat: "Matahari memberikan cahaya dan haba kepada bumi", perkataan: ["Matahari", "memberikan", "cahaya", "dan", "haba", "kepada", "bumi"] },
];
const SA_PI_2: SAItem[] = [
  { ayat: "Solat adalah tiang agama Islam yang utama", perkataan: ["Solat", "adalah", "tiang", "agama", "Islam", "yang", "utama"] },
  { ayat: "Kita mesti berwuduk sebelum menunaikan solat", perkataan: ["Kita", "mesti", "berwuduk", "sebelum", "menunaikan", "solat"] },
  { ayat: "Al-Quran adalah panduan hidup umat Islam", perkataan: ["Al-Quran", "adalah", "panduan", "hidup", "umat", "Islam"] },
  { ayat: "Nabi Muhammad SAW adalah contoh terbaik kita", perkataan: ["Nabi", "Muhammad", "SAW", "adalah", "contoh", "terbaik", "kita"] },
  { ayat: "Berdoa kepada Allah selepas selesai solat", perkataan: ["Berdoa", "kepada", "Allah", "selepas", "selesai", "solat"] },
];
const SA_JAWI_2: SAItem[] = [
  { ayat: "Tulisan Jawi warisan budaya bangsa Melayu", perkataan: ["Tulisan", "Jawi", "warisan", "budaya", "bangsa", "Melayu"] },
  { ayat: "Kita mesti belajar menulis huruf Jawi", perkataan: ["Kita", "mesti", "belajar", "menulis", "huruf", "Jawi"] },
  { ayat: "Huruf Alif ialah huruf pertama dalam Jawi", perkataan: ["Huruf", "Alif", "ialah", "huruf", "pertama", "dalam", "Jawi"] },
  { ayat: "Bahasa Melayu boleh ditulis dalam tulisan Jawi", perkataan: ["Bahasa", "Melayu", "boleh", "ditulis", "dalam", "tulisan", "Jawi"] },
  { ayat: "Terdapat tiga puluh tujuh huruf dalam tulisan Jawi", perkataan: ["Terdapat", "tiga", "puluh", "tujuh", "huruf", "dalam", "tulisan", "Jawi"] },
];

const BS_SET2: Record<string, BSItem[]> = {
  matematik: BS_MATE_2,
  "bahasa-melayu": BS_BM_2,
  "bahasa-inggeris": BS_BI_2,
  sains: BS_SAINS_2,
  "pendidikan-islam": BS_PI_2,
  jawi: BS_JAWI_2,
};
const PJ_SET2: Record<string, PJPair[]> = {
  matematik: PJ_MATE_2,
  "bahasa-melayu": PJ_BM_2,
  "bahasa-inggeris": PJ_BI_2,
  sains: PJ_SAINS_2,
  "pendidikan-islam": PJ_PI_2,
  jawi: PJ_JAWI_2,
};
const SA_SET2: Record<string, SAItem[]> = {
  matematik: SA_MATE_2,
  "bahasa-melayu": SA_BM_2,
  "bahasa-inggeris": SA_BI_2,
  sains: SA_SAINS_2,
  "pendidikan-islam": SA_PI_2,
  jawi: SA_JAWI_2,
};

function pickSet<T>(a: T[], b: T[] | undefined): T[] {
  if (!b) return a;
  return Math.random() < 0.5 ? a : b;
}

export function getBetulSalah(subjekId: string): BSItem[] {
  return pickSet(BETUL_SALAH[subjekId] ?? BS_BM, BS_SET2[subjekId]);
}
export function getPadankan(subjekId: string): PJPair[] {
  return pickSet(PADANKAN[subjekId] ?? PJ_BM, PJ_SET2[subjekId]);
}
export function getSusunAyat(subjekId: string): SAItem[] {
  return pickSet(SUSUN_AYAT[subjekId] ?? SA_BM, SA_SET2[subjekId]);
}

