export interface NoteSection {
  title: string;
  icon: string;
  items: string[];
}

export interface SubjectNotes {
  subject: string;
  sections: NoteSection[];
}

export const NOTES_BANK: Record<string, SubjectNotes> = {
  "1:matematik": {
    subject: "Matematik",
    sections: [
      {
        title: "Nombor 1–20",
        icon: "🔢",
        items: [
          "Satu, Dua, Tiga, Empat, Lima",
          "Enam, Tujuh, Lapan, Sembilan, Sepuluh",
          "Sebelas, Dua Belas, Tiga Belas, Empat Belas, Lima Belas",
          "Enam Belas, Tujuh Belas, Lapan Belas, Sembilan Belas, Dua Puluh",
        ],
      },
      {
        title: "Tambah & Tolak",
        icon: "➕",
        items: [
          "Tambah = jumlahkan dua nombor",
          "Tolak = kurangkan satu nombor dari nombor lain",
          "Contoh: 3 + 4 = 7",
          "Contoh: 10 – 3 = 7",
        ],
      },
      {
        title: "Bentuk",
        icon: "🔺",
        items: [
          "Segitiga = 3 sisi",
          "Segiempat = 4 sisi",
          "Bulatan = tiada sisi",
        ],
      },
      {
        title: "Tips Mudah",
        icon: "💡",
        items: [
          "Nombor genap: 2, 4, 6, 8, 10",
          "Nombor ganjil: 1, 3, 5, 7, 9",
        ],
      },
    ],
  },
  "1:bahasa-melayu": {
    subject: "Bahasa Melayu",
    sections: [
      {
        title: "Huruf Vokal",
        icon: "🔤",
        items: [
          "Vokal ialah huruf yang boleh disebut sendiri.",
          "Huruf vokal: a, e, i, o, u",
          "Huruf lain dipanggil konsonan.",
        ],
      },
      {
        title: "Suku Kata",
        icon: "🗣️",
        items: [
          "Suku kata = bunyi perkataan yang dipecahkan.",
          "Contoh: bo-la = 2 suku kata",
          "Contoh: ma-ma = 2 suku kata",
        ],
      },
      {
        title: "Lawan Kata",
        icon: "⚖️",
        items: [
          "Lawan 'besar' = kecil",
          "Lawan 'panas' = sejuk",
          "Lawan 'tinggi' = rendah",
          "Lawan 'cepat' = perlahan",
        ],
      },
      {
        title: "Tips Menulis Ayat",
        icon: "✍️",
        items: [
          "Ayat bermula dengan huruf besar.",
          "Letakkan tanda noktah di akhir ayat.",
          "Contoh: Saya makan nasi.",
        ],
      },
    ],
  },
  "1:bahasa-inggeris": {
    subject: "Bahasa Inggeris",
    sections: [
      {
        title: "Vowels & Alphabet",
        icon: "🔤",
        items: [
          "Vowels: a, e, i, o, u",
          "There are 26 letters in the alphabet.",
          "A, B, C, D, E, F, G, H, I, J...",
        ],
      },
      {
        title: "Greetings",
        icon: "👋",
        items: [
          "Good morning! — Selamat pagi!",
          "Good afternoon! — Selamat petang!",
          "Good night! — Selamat malam!",
          "Thank you! — Terima kasih!",
        ],
      },
      {
        title: "Opposites",
        icon: "⚖️",
        items: [
          "big → small",
          "hot → cold",
          "tall → short",
          "fast → slow",
        ],
      },
      {
        title: "Simple Sentences",
        icon: "✍️",
        items: [
          "My name is Ali.",
          "I am a student.",
          "The cat is sleeping.",
          "I like to eat apples.",
        ],
      },
    ],
  },
  "1:sains": {
    subject: "Sains",
    sections: [
      {
        title: "5 Deria",
        icon: "👁️",
        items: [
          "Mata — untuk melihat",
          "Hidung — untuk menghidu",
          "Telinga — untuk mendengar",
          "Lidah — untuk merasa",
          "Kulit — untuk merasa sentuhan",
        ],
      },
      {
        title: "Haiwan & Tumbuhan",
        icon: "🌿",
        items: [
          "Haiwan boleh bergerak sendiri.",
          "Tumbuhan tidak boleh bergerak.",
          "Tumbuhan perlukan air, cahaya & udara.",
          "Akar tumbuhan serap air dari tanah.",
        ],
      },
      {
        title: "Cuaca & Air",
        icon: "☀️",
        items: [
          "Matahari ialah sumber cahaya semula jadi.",
          "Langit berawan gelap bermakna akan hujan.",
          "Air cair apabila dipanaskan.",
          "Ais membeku apabila didinginkan.",
        ],
      },
      {
        title: "Tips Mudah",
        icon: "💡",
        items: [
          "Kita bernafas menggunakan oksigen.",
          "Burung boleh terbang, ikan boleh berenang.",
          "Arnab makan sayur dan wortel.",
        ],
      },
    ],
  },
  "1:jawi": {
    subject: "Jawi",
    sections: [
      {
        title: "Huruf Jawi Asas",
        icon: "📖",
        items: [
          "ا = Alif (bunyi a)",
          "ب = Ba (bunyi b)",
          "ت = Ta (bunyi t)",
          "ث = Tha (bunyi th)",
          "ج = Jim (bunyi j)",
        ],
      },
      {
        title: "Huruf Lain",
        icon: "✍️",
        items: [
          "س = Sin (bunyi s)",
          "ش = Syin (bunyi sy)",
          "ک = Kaf (bunyi k)",
          "ل = Lam (bunyi l)",
          "م = Mim (bunyi m)",
          "ن = Nun (bunyi n)",
          "و = Wau (bunyi w / u)",
          "ي = Ya (bunyi y / i)",
        ],
      },
      {
        title: "Perkataan Jawi",
        icon: "📝",
        items: [
          "اِبُو = ibu",
          "اَيَه = ayah",
          "كُوچيڠ = kucing",
          "بُکُو = buku",
          "رومه = rumah",
        ],
      },
      {
        title: "Tips Mudah",
        icon: "💡",
        items: [
          "Huruf Jawi ditulis dari kanan ke kiri.",
          "Ada huruf yang sama bunyi tapi tulisan berbeza!",
        ],
      },
    ],
  },
  "1:pendidikan-islam": {
    subject: "Pendidikan Islam",
    sections: [
      {
        title: "Rukun Islam",
        icon: "🕌",
        items: [
          "1. Mengucap syahadah",
          "2. Solat 5 waktu sehari",
          "3. Berpuasa di bulan Ramadan",
          "4. Mengeluarkan zakat",
          "5. Mengerjakan haji (jika mampu)",
        ],
      },
      {
        title: "Rukun Iman",
        icon: "📿",
        items: [
          "1. Beriman kepada Allah",
          "2. Beriman kepada Malaikat",
          "3. Beriman kepada Kitab",
          "4. Beriman kepada Rasul",
          "5. Beriman kepada Hari Akhirat",
          "6. Beriman kepada Qada & Qadar",
        ],
      },
      {
        title: "Doa & Adab",
        icon: "🤲",
        items: [
          "Baca bismillah sebelum makan.",
          "Ucap Alhamdulillah selepas makan / bersin.",
          "Ucap Assalamualaikum bila berjumpa.",
          "Solat Subuh = 2 rakaat",
          "Solat Maghrib = 3 rakaat",
        ],
      },
      {
        title: "Nabi & Kitab",
        icon: "📖",
        items: [
          "Nabi kita: Nabi Muhammad SAW",
          "Kitab suci umat Islam: Al-Quran",
          "Kita mesti hormati ibu bapa dan guru.",
        ],
      },
    ],
  },
  "2:bahasa-melayu": {
    subject: "Bahasa Melayu",
    sections: [
      {
        title: "Jenis-Jenis Ayat",
        icon: "📝",
        items: [
          "Ayat penyata — menyatakan sesuatu. Contoh: Ibu memasak nasi.",
          "Ayat tanya — bertanya sesuatu. Contoh: Di mana buku saya?",
          "Ayat perintah — menyuruh. Contoh: Tolong tutup pintu.",
          "Ayat seru — meluahkan perasaan. Contoh: Alangkah cantiknya!",
        ],
      },
      {
        title: "Jenis-Jenis Kata",
        icon: "🔤",
        items: [
          "Kata nama — nama orang, haiwan, benda. Contoh: Ali, kucing, meja",
          "Kata kerja — perbuatan. Contoh: berlari, makan, tidur",
          "Kata adjektif — sifat. Contoh: cantik, besar, rajin",
          "Kata hubung — menghubung ayat. Contoh: dan, atau, tetapi",
          "Kata sendi nama — menunjukkan tempat. Contoh: di, ke, dari",
        ],
      },
      {
        title: "Imbuhan Awalan",
        icon: "➕",
        items: [
          "ber + lari = berlari",
          "me + masak = memasak",
          "pe + mimpin = pemimpin",
        ],
      },
      {
        title: "Antonim & Sinonim",
        icon: "⚖️",
        items: [
          "Antonim = lawan kata. Rajin ↔ Malas",
          "Sinonim = sama maksud. Gembira = Suka",
        ],
      },
    ],
  },
  "2:matematik": {
    subject: "Matematik",
    sections: [
      {
        title: "Tambah & Tolak",
        icon: "➕",
        items: [
          "Tambah nombor dua digit: 25 + 37 = 62",
          "Tolak nombor dua digit: 84 - 46 = 38",
          "Kumpulkan puluhan dulu, kemudian sa",
        ],
      },
      {
        title: "Darab (×)",
        icon: "✖️",
        items: [
          "6 × 3 = 18 (sifir 6)",
          "8 × 4 = 32 (sifir 8)",
          "9 × 9 = 81 (sifir 9)",
          "Sifir 2 hingga 9 perlu dihafal",
        ],
      },
      {
        title: "Bahagi (÷)",
        icon: "➗",
        items: [
          "20 ÷ 4 = 5",
          "56 ÷ 7 = 8",
          "Bahagi = pisahkan kepada kumpulan sama banyak",
        ],
      },
      {
        title: "Nilai Tempat",
        icon: "🔢",
        items: [
          "357 → 3 ratus, 5 puluh, 7 sa",
          "Digit 3 bernilai 300",
          "Digit 5 bernilai 50",
          "Digit 7 bernilai 7",
        ],
      },
      {
        title: "Pembundaran",
        icon: "📐",
        items: [
          "47 → bundar ke 50 (lebih dekat ke 50)",
          "83 → bundar ke 80 (lebih dekat ke 80)",
          "1–4 ke bawah, 5–9 ke atas",
        ],
      },
    ],
  },
  "2:bahasa-inggeris": {
    subject: "Bahasa Inggeris",
    sections: [
      {
        title: "Plural (Kata Nama Jamak)",
        icon: "🔢",
        items: [
          "Tambah s: cat → cats, dog → dogs",
          "Tambah es: box → boxes, bus → buses",
          "Irregular: child → children, fish → fish, tooth → teeth, foot → feet",
        ],
      },
      {
        title: "Past Tense (Masa Lampau)",
        icon: "⏪",
        items: [
          "Regular: tambah ed — play → played, walk → walked",
          "Irregular: go → went, eat → ate, run → ran, see → saw",
        ],
      },
      {
        title: "Jenis Kata (Parts of Speech)",
        icon: "🔤",
        items: [
          "Noun = nama orang/benda. Contoh: book, Ali",
          "Verb = perbuatan. Contoh: run, swim, eat",
          "Adjective = sifat. Contoh: beautiful, big, happy",
          "Adverb = cara. Contoh: quickly, slowly",
        ],
      },
      {
        title: "To Be (am, is, are)",
        icon: "🔗",
        items: [
          "I am a student",
          "She is a teacher",
          "They are friends",
        ],
      },
      {
        title: "Article (a, an, the)",
        icon: "📖",
        items: [
          "a = sebelum bunyi konsonan: a cat, a book",
          "an = sebelum bunyi vokal: an apple, an egg",
          "the = benda tertentu: the sun, the moon",
        ],
      },
    ],
  },
  "2:jawi": {
    subject: "Jawi",
    sections: [
      {
        title: "Huruf Tambahan Jawi Melayu",
        icon: "📌",
        items: [
          "ڤ = pa (contoh: ڤاڤن = papan)",
          "چ = cha (contoh: چيندي = cenderai)",
          "ڠ = nga (contoh: ڠن = ngan)",
          "ڬ = ga (contoh: ڬاجه = gajah)",
          "ۏ = va (contoh: ۏيتمين = vitamin)",
          "Jumlah huruf tambahan = 6 huruf",
        ],
      },
      {
        title: "Cara Menulis Jawi",
        icon: "✍️",
        items: [
          "Ditulis dari kanan ke kiri",
          "Menggunakan huruf Arab sebagai asas",
          "Ada 6 huruf tambahan khas untuk Bahasa Melayu",
        ],
      },
      {
        title: "Ejaan Jawi Perkataan Penting",
        icon: "📝",
        items: [
          "sekolah = سکول",
          "keluarga = كلوارگا",
          "Malaysia = مليسيا",
          "membaca = ممباچا",
          "berlari = برلاري",
          "guru = گورو",
          "pelajar = ڤليجر",
        ],
      },
      {
        title: "Tips Menulis Jawi",
        icon: "💡",
        items: [
          "Ingat huruf yang ada titik",
          "Beza ب (ba) dan ت (ta) dan ث (tha)",
          "Huruf disambung kecuali 6 huruf: ا د ذ ر ز و",
        ],
      },
    ],
  },
  "2:pendidikan-islam": {
    subject: "Pendidikan Islam",
    sections: [
      {
        title: "25 Nabi dan Rasul",
        icon: "📌",
        items: [
          "Wajib mengetahui 25 Nabi dan Rasul",
          "Rasul pertama: Nabi Adam AS",
          "Rasul terakhir: Nabi Muhammad SAW",
        ],
      },
      {
        title: "4 Kitab Allah",
        icon: "📖",
        items: [
          "Zabur → Nabi Daud AS",
          "Taurat → Nabi Musa AS",
          "Injil → Nabi Isa AS",
          "Al-Quran → Nabi Muhammad SAW",
        ],
      },
      {
        title: "Malaikat Wajib Diketahui",
        icon: "👼",
        items: [
          "Jibril → menyampaikan wahyu",
          "Mikail → menurunkan hujan",
          "Israfil → meniup sangkakala",
          "Izrail → mencabut nyawa",
        ],
      },
      {
        title: "Sifat Wajib Allah",
        icon: "✨",
        items: [
          "Wujud = Ada",
          "Qidam = Sedia Ada",
          "Baqa = Kekal",
          "Wahdaniah = Maha Esa",
        ],
      },
      {
        title: "Surah Penting",
        icon: "🕌",
        items: [
          "Al-Fatihah = 7 ayat — surah pertama",
          "Al-Ikhlas = 4 ayat",
          "An-Nas = surah terakhir",
          "Al-Quran ada 114 surah",
        ],
      },
    ],
  },
  "2:sains": {
    subject: "Sains",
    sections: [
      {
        title: "Fotosintesis",
        icon: "🌿",
        items: [
          "Tumbuhan buat makanan sendiri",
          "Perlukan: cahaya matahari, air, karbon dioksida",
          "Menghasilkan: makanan dan oksigen",
          "Berlaku di daun yang hijau",
        ],
      },
      {
        title: "Tiga Keadaan Jirim",
        icon: "💧",
        items: [
          "Pepejal — bentuk tetap, contoh: batu, kayu",
          "Cecair — mengalir, contoh: air, minyak",
          "Gas — tidak kelihatan, contoh: udara, oksigen",
        ],
      },
      {
        title: "Perubahan Jirim",
        icon: "🔄",
        items: [
          "Pepejal + haba = cecair (melebur)",
          "Cecair + haba = gas (menyejat)",
          "Gas - haba = cecair (kondensasi)",
          "Cecair - haba = pepejal (membeku)",
        ],
      },
      {
        title: "Haiwan Mengikut Pemakanan",
        icon: "🍃",
        items: [
          "Herbivor = makan tumbuhan. Contoh: lembu, arnab",
          "Karnivor = makan daging. Contoh: harimau, singa",
          "Omnivor = makan tumbuhan dan daging. Contoh: manusia",
        ],
      },
      {
        title: "Haiwan Mengikut Pembiakan",
        icon: "🐣",
        items: [
          "Ovipar = bertelur. Contoh: ayam, ikan, katak",
          "Vivipar = melahirkan anak. Contoh: kucing, lembu",
        ],
      },
      {
        title: "Kitaran Air",
        icon: "💦",
        items: [
          "Penyejatan → Kondensasi → Hujan → ulang semula",
        ],
      },
    ],
  },
};

export function getNotes(darjahId: string, subjekId: string): SubjectNotes | null {
  return NOTES_BANK[`${darjahId}:${subjekId}`] ?? null;
}
