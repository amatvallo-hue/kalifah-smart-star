export type QuizQuestion = {
  soalan: string;
  pilihan: string[];
  jawapan: number; // index 0-based
  nota?: string;
};

const SAINS_D2: QuizQuestion[] = [
  { soalan: "Apakah proses tumbuhan membuat makanan?", pilihan: ["Respirasi", "Fotosintesis", "Evaporasi", "Kondensasi"], jawapan: 1 },
  { soalan: "Apakah gas yang dihasilkan semasa fotosintesis?", pilihan: ["Karbon dioksida", "Nitrogen", "Oksigen", "Hidrogen"], jawapan: 2 },
  { soalan: "Apakah gas yang diserap tumbuhan semasa fotosintesis?", pilihan: ["Oksigen", "Nitrogen", "Karbon dioksida", "Hidrogen"], jawapan: 2 },
  { soalan: "Tiga keadaan jirim ialah?", pilihan: ["pepejal cecair wap", "pepejal cecair gas", "pepejal gas wap", "cecair gas wap"], jawapan: 1 },
  { soalan: "Contoh pepejal ialah?", pilihan: ["air", "udara", "batu", "wap"], jawapan: 2 },
  { soalan: "Contoh cecair ialah?", pilihan: ["batu", "kayu", "air", "besi"], jawapan: 2 },
  { soalan: "Contoh gas ialah?", pilihan: ["batu", "kayu", "air", "udara"], jawapan: 3 },
  { soalan: "Apakah yang berlaku kepada pepejal apabila dipanaskan?", pilihan: ["membeku", "melebur", "menyejat", "memampat"], jawapan: 1 },
  { soalan: "Apakah yang berlaku kepada cecair apabila dipanaskan?", pilihan: ["membeku", "melebur", "menyejat", "memampat"], jawapan: 2 },
  { soalan: "Kitaran air bermula dengan?", pilihan: ["hujan", "awan", "penyejatan", "kondensasi"], jawapan: 2 },
  { soalan: "Haiwan yang bertelur dipanggil?", pilihan: ["mamalia", "reptilia", "ovipar", "vivipar"], jawapan: 2 },
  { soalan: "Haiwan yang melahirkan anak dipanggil?", pilihan: ["mamalia", "reptilia", "ovipar", "vivipar"], jawapan: 3 },
  { soalan: "Magnet menarik benda yang diperbuat daripada?", pilihan: ["kayu", "plastik", "besi", "kaca"], jawapan: 2 },
  { soalan: "Cahaya bergerak dalam garis?", pilihan: ["bengkok", "lurus", "melengkung", "zigzag"], jawapan: 1 },
  { soalan: "Kita tidak boleh mendengar bunyi di?", pilihan: ["dalam air", "dalam tanah", "angkasa lepas", "dalam bilik"], jawapan: 2 },
];

const BAHASA_MELAYU_D3: QuizQuestion[] = [
  { soalan: "Apakah maksud peribahasa 'bagai menatang minyak yang penuh'?", pilihan: ["Menjaga dengan teliti", "Membuang masa", "Berlaku cuai", "Tidak peduli"], jawapan: 0 },
  { soalan: "Pilih ayat pasif yang betul:", pilihan: ["Ali membaca buku", "Buku dibaca oleh Ali", "Buku membaca Ali", "Ali buku membaca"], jawapan: 1 },
  { soalan: "Apakah imbuhan dalam perkataan 'pelajaran'?", pilihan: ["pe...an", "pe", "an", "jar"], jawapan: 0 },
  { soalan: "Pilih kata adjektif:", pilihan: ["berlari", "dengan", "indah", "meja"], jawapan: 2 },
  { soalan: "Apakah kata ganti nama diri ketiga?", pilihan: ["saya", "kamu", "dia", "kami"], jawapan: 2 },
  { soalan: "Pilih ayat yang menggunakan kata hubung dengan betul:", pilihan: ["Ali dan Abu pergi ke sekolah", "Ali pergi dan sekolah", "Ali Abu dan pergi", "Pergi Ali dan Abu"], jawapan: 0 },
  { soalan: "Apakah maksud peribahasa 'bersatu teguh bercerai roboh'?", pilihan: ["Perpecahan itu kuat", "Perpaduan itu kuat", "Bergaduh itu baik", "Bersatu itu susah"], jawapan: 1 },
  { soalan: "Pilih perkataan majmuk yang betul:", pilihan: ["jalanraya", "jalan raya", "jalan-raya", "jalan_raya"], jawapan: 1 },
  { soalan: "Apakah kata ulang bagi 'budak'?", pilihan: ["budak budak", "budak-budak", "budakbudak", "budaks"], jawapan: 1 },
  { soalan: "Pilih kata kerja transitif:", pilihan: ["tidur", "berlari", "memukul", "duduk"], jawapan: 2 },
  { soalan: "Apakah imbuhan dalam perkataan 'kebersihan'?", pilihan: ["ke...an", "ke", "an", "bersih"], jawapan: 0 },
  { soalan: "Pilih ayat tanya yang betul:", pilihan: ["Ke mana kamu pergi", "Ke mana kamu pergi?", "ke mana kamu pergi?", "Ke mana Kamu pergi?"], jawapan: 1 },
  { soalan: "Apakah maksud kata 'dedikasi'?", pilihan: ["Malas", "Bersungguh-sungguh", "Cuai", "Tidak serius"], jawapan: 1 },
  { soalan: "Pilih kata nama abstrak:", pilihan: ["meja", "kucing", "kasih sayang", "buku"], jawapan: 2 },
  { soalan: "Apakah sinonim 'indah'?", pilihan: ["hodoh", "buruk", "cantik", "kotor"], jawapan: 2 },
];

const MATE_D3: QuizQuestion[] = [
  { soalan: "234 + 567 = ?", pilihan: ["791", "801", "811", "821"], jawapan: 1 },
  { soalan: "856 - 378 = ?", pilihan: ["468", "478", "488", "498"], jawapan: 1 },
  { soalan: "7 × 8 = ?", pilihan: ["54", "56", "58", "60"], jawapan: 1 },
  { soalan: "9 × 6 = ?", pilihan: ["48", "54", "56", "60"], jawapan: 1 },
  { soalan: "72 ÷ 8 = ?", pilihan: ["7", "8", "9", "10"], jawapan: 2 },
  { soalan: "63 ÷ 7 = ?", pilihan: ["7", "8", "9", "10"], jawapan: 2 },
  { soalan: "Nilai digit 4 dalam 3456?", pilihan: ["4", "40", "400", "4000"], jawapan: 2 },
  { soalan: "Bundarkan 456 ke ratus terdekat?", pilihan: ["400", "450", "500", "460"], jawapan: 2 },
  { soalan: "1/2 + 1/4 = ?", pilihan: ["1/6", "2/6", "3/4", "2/4"], jawapan: 2 },
  { soalan: "3/4 - 1/4 = ?", pilihan: ["1/4", "2/4", "3/8", "4/8"], jawapan: 1 },
  { soalan: "0.5 + 0.3 = ?", pilihan: ["0.7", "0.8", "0.9", "1.0"], jawapan: 1 },
  { soalan: "2345 + 1234 = ?", pilihan: ["3479", "3579", "3679", "3779"], jawapan: 1 },
  { soalan: "5000 - 2345 = ?", pilihan: ["2555", "2655", "2755", "2855"], jawapan: 1 },
  { soalan: "Luas segiempat 6cm × 4cm = ?", pilihan: ["20cm²", "24cm²", "28cm²", "32cm²"], jawapan: 1 },
  { soalan: "Perimeter segitiga 3cm, 4cm, 5cm = ?", pilihan: ["10cm", "12cm", "14cm", "16cm"], jawapan: 1 },
];

const BI_D3: QuizQuestion[] = [
  { soalan: "Choose the correct sentence:", pilihan: ["She go to market", "She goes to market", "She going to market", "She gone to market"], jawapan: 1 },
  { soalan: "Past tense of 'write'?", pilihan: ["writed", "writes", "written", "wrote"], jawapan: 3 },
  { soalan: "Plural of 'leaf'?", pilihan: ["leafs", "leafes", "leaves", "leafies"], jawapan: 2 },
  { soalan: "Choose the adjective:", pilihan: ["run", "book", "beautiful", "and"], jawapan: 2 },
  { soalan: "Choose the adverb:", pilihan: ["beautiful", "quickly", "swim", "table"], jawapan: 1 },
  { soalan: "I ___ reading a book now.", pilihan: ["am", "is", "are", "be"], jawapan: 0 },
  { soalan: "She ___ to school yesterday.", pilihan: ["go", "goes", "went", "going"], jawapan: 2 },
  { soalan: "They ___ playing football tomorrow.", pilihan: ["was", "were", "will be", "are"], jawapan: 2 },
  { soalan: "Choose correct use of article:", pilihan: ["I saw a elephant", "I saw an elephant", "I saw the elephant yesterday", "Both B and C"], jawapan: 3 },
  { soalan: "Synonym of 'happy'?", pilihan: ["sad", "angry", "joyful", "tired"], jawapan: 2 },
  { soalan: "Antonym of 'brave'?", pilihan: ["bold", "fearless", "cowardly", "strong"], jawapan: 2 },
  { soalan: "What is a simile?", pilihan: ["comparing using like or as", "action word", "naming word", "describing word"], jawapan: 0 },
  { soalan: "Example of simile?", pilihan: ["The cat runs", "She is as fast as a cheetah", "He runs quickly", "The flower is beautiful"], jawapan: 1 },
  { soalan: "Choose conjunction:", pilihan: ["beautiful", "run", "but", "quickly"], jawapan: 2 },
  { soalan: "Choose preposition:", pilihan: ["run", "beautiful", "and", "under"], jawapan: 3 },
];

const JAWI_D3: QuizQuestion[] = [
  { soalan: "Ejaan Jawi bagi 'perpustakaan'?", pilihan: ["ڤرڤوستاکان", "ڤرڤستاکان", "ڤرڤوسطاکان", "ڤرڤستکان"], jawapan: 0 },
  { soalan: "Ejaan Jawi bagi 'kemerdekaan'?", pilihan: ["کمرديکان", "کمردیکاءن", "کمرديکاءن", "کيمرديکان"], jawapan: 2 },
  { soalan: "Ejaan Jawi bagi 'pembelajaran'?", pilihan: ["ڤمبلاجرن", "ڤمبلاجاران", "ڤيمبلاجاران", "ڤمبلجران"], jawapan: 1 },
  { soalan: "Ejaan Jawi bagi 'kecemerlangan'?", pilihan: ["کچمرلڠن", "کيچمرلاڠن", "کچمرلاڠن", "کيچمرلڠن"], jawapan: 2 },
  { soalan: "Huruf Jawi ڬ berbunyi?", pilihan: ["ka", "ga", "ha", "na"], jawapan: 1 },
  { soalan: "Huruf Jawi ۏ berbunyi?", pilihan: ["wa", "va", "fa", "ba"], jawapan: 1 },
  { soalan: "Jawi مدرسة bermaksud?", pilihan: ["rumah", "masjid", "sekolah", "kedai"], jawapan: 2 },
  { soalan: "Jawi معلم bermaksud?", pilihan: ["pelajar", "guru", "doktor", "polis"], jawapan: 1 },
  { soalan: "Jawi كتاب bermaksud?", pilihan: ["pen", "meja", "buku", "kerusi"], jawapan: 2 },
  { soalan: "Jawi مدينة bermaksud?", pilihan: ["kampung", "bandar", "negara", "dunia"], jawapan: 1 },
  { soalan: "Berapa huruf Jawi asas?", pilihan: ["26", "28", "30", "32"], jawapan: 2 },
  { soalan: "Berapa huruf tambahan Jawi Melayu?", pilihan: ["4", "5", "6", "7"], jawapan: 2 },
  { soalan: "Jawi نيڬارا bermaksud?", pilihan: ["bandar", "kampung", "negara", "dunia"], jawapan: 2 },
  { soalan: "Jawi بهاسا bermaksud?", pilihan: ["tulisan", "bahasa", "budaya", "bangsa"], jawapan: 1 },
  { soalan: "Jawi مردياک bermaksud?", pilihan: ["merdeka", "berduka", "bersuka", "berdekat"], jawapan: 0 },
];

const PI_D3: QuizQuestion[] = [
  { soalan: "Berapa jumlah nabi dan rasul wajib diketahui?", pilihan: ["20", "25", "30", "35"], jawapan: 1 },
  { soalan: "Nabi yang diutus kepada kaum Ad?", pilihan: ["Nabi Nuh", "Nabi Hud", "Nabi Soleh", "Nabi Lut"], jawapan: 1 },
  { soalan: "Nabi yang diutus kepada kaum Thamud?", pilihan: ["Nabi Nuh", "Nabi Hud", "Nabi Soleh", "Nabi Lut"], jawapan: 2 },
  { soalan: "Kitab Zabur diturunkan kepada?", pilihan: ["Nabi Musa", "Nabi Isa", "Nabi Daud", "Nabi Muhammad"], jawapan: 2 },
  { soalan: "Malaikat Jibril bertugas?", pilihan: ["menurunkan hujan", "menyampaikan wahyu", "mencabut nyawa", "meniup sangkakala"], jawapan: 1 },
  { soalan: "Sifat wajib Allah 'Wujud' bermaksud?", pilihan: ["Kekal", "Ada", "Maha Esa", "Sedia Ada"], jawapan: 1 },
  { soalan: "Surah Al-Fatihah ada berapa ayat?", pilihan: ["5", "6", "7", "8"], jawapan: 2 },
  { soalan: "Hukum solat 5 waktu?", pilihan: ["sunat", "harus", "wajib", "makruh"], jawapan: 2 },
  { soalan: "Solat Jumaat wajib bagi?", pilihan: ["semua orang", "lelaki Islam baligh", "perempuan Islam", "kanak-kanak"], jawapan: 1 },
  { soalan: "Bulan puasa ialah?", pilihan: ["Syawal", "Zulhijjah", "Ramadan", "Muharram"], jawapan: 2 },
  { soalan: "Zakat fitrah dibayar pada bulan?", pilihan: ["Syawal", "Ramadan", "Zulhijjah", "Muharram"], jawapan: 1 },
  { soalan: "Sifat mahmudah contohnya?", pilihan: ["dengki", "sombong", "jujur", "bakhil"], jawapan: 2 },
  { soalan: "Sifat mazmumah contohnya?", pilihan: ["jujur", "amanah", "sabar", "dengki"], jawapan: 3 },
  { soalan: "Islam bermaksud?", pilihan: ["tunduk patuh kepada Allah", "bebas", "berani", "kuat"], jawapan: 0 },
  { soalan: "Kaabah terletak di?", pilihan: ["Madinah", "Palestin", "Makkah", "Taif"], jawapan: 2 },
];

const SAINS_D3: QuizQuestion[] = [
  { soalan: "Proses tumbuhan buat makanan?", pilihan: ["Respirasi", "Fotosintesis", "Evaporasi", "Kondensasi"], jawapan: 1 },
  { soalan: "Tiga keadaan jirim?", pilihan: ["pepejal cecair wap", "pepejal cecair gas", "pepejal gas wap", "cecair gas wap"], jawapan: 1 },
  { soalan: "Haiwan bertelur dipanggil?", pilihan: ["mamalia", "reptilia", "ovipar", "vivipar"], jawapan: 2 },
  { soalan: "Haiwan melahirkan anak dipanggil?", pilihan: ["mamalia", "reptilia", "ovipar", "vivipar"], jawapan: 3 },
  { soalan: "Magnet menarik benda dari?", pilihan: ["kayu", "plastik", "besi", "kaca"], jawapan: 2 },
  { soalan: "Cahaya bergerak dalam garis?", pilihan: ["bengkok", "lurus", "melengkung", "zigzag"], jawapan: 1 },
  { soalan: "Bumi mengelilingi matahari dalam?", pilihan: ["sehari", "sebulan", "setahun", "seminggu"], jawapan: 2 },
  { soalan: "Berapa planet dalam sistem suria?", pilihan: ["7", "8", "9", "10"], jawapan: 1 },
  { soalan: "Gas yang diserap tumbuhan semasa fotosintesis?", pilihan: ["Oksigen", "Nitrogen", "Karbon dioksida", "Hidrogen"], jawapan: 2 },
  { soalan: "Rantaian makanan bermula dengan?", pilihan: ["haiwan", "tumbuhan", "manusia", "bakteria"], jawapan: 1 },
  { soalan: "Haiwan herbivor makan?", pilihan: ["daging", "tumbuhan", "daging dan tumbuhan", "ikan"], jawapan: 1 },
  { soalan: "Haiwan karnivor makan?", pilihan: ["tumbuhan", "daging", "buah", "bijirin"], jawapan: 1 },
  { soalan: "Gerhana matahari berlaku apabila?", pilihan: ["bumi masuk bayang bulan", "bulan masuk bayang bumi", "matahari hilang", "bumi berhenti berputar"], jawapan: 0 },
  { soalan: "Graviti menarik benda ke arah?", pilihan: ["atas", "tepi", "bawah", "depan"], jawapan: 2 },
  { soalan: "Pemanasan global disebabkan oleh?", pilihan: ["lebih banyak pokok", "lebih banyak hujan", "peningkatan gas rumah hijau", "lebih banyak angin"], jawapan: 2 },
];

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
  "2:sains": SAINS_D2,
  "3:bahasa-melayu": BAHASA_MELAYU_D3,
  "3:matematik": MATE_D3,
  "3:bahasa-inggeris": BI_D3,
  "3:jawi": JAWI_D3,
  "3:pendidikan-islam": PI_D3,
  "3:sains": SAINS_D3,
};

export function getQuiz(darjahId: string, subjekId: string): QuizQuestion[] | undefined {
  return QUIZ_BANK[`${darjahId}:${subjekId}`];
}
