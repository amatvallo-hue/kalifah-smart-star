import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PenLine, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/latihan")({
  head: () => ({ meta: [{ title: "Latihan Bertulis — Kalifah.my" }] }),
  ssr: false,
  component: LatihanSubjekPage,
});

type Soalan = { soalan: string; jawapan: string; petunjuk?: string };
type SoalanMcq = { soalan: string; pilihan: string[]; betul: number };

const JAWI_D2_MCQ: SoalanMcq[] = [
  { soalan: "Pilih ejaan Jawi bagi 'sekolah'", pilihan: ["سکوله", "سکول", "سکولا", "سکولة"], betul: 1 },
  { soalan: "Pilih ejaan Jawi bagi 'keluarga'", pilihan: ["كلوارگ", "كلوارگا", "كلورگا", "كلواگا"], betul: 1 },
  { soalan: "Pilih ejaan Jawi bagi 'membaca'", pilihan: ["ممباچ", "ممباچا", "مامباچا", "ممبچا"], betul: 1 },
  { soalan: "Pilih ejaan Jawi bagi 'berlari'", pilihan: ["برلاري", "بيرلاري", "برلارى", "بيرلارى"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'Malaysia'", pilihan: ["مليسيا", "ملايسيا", "ملاسيا", "ماليسيا"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'guru'", pilihan: ["گورو", "گوروا", "گورا", "گوروه"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'pelajar'", pilihan: ["ڤليجر", "ڤلاجر", "ڤليجار", "ڤلجار"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'hospital'", pilihan: ["هوسڤيتل", "هسڤيتل", "هوسڤيتال", "هسڤيتال"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'membeli'", pilihan: ["ممبيلي", "ممبلي", "مامبيلي", "ممبيل"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'bersekolah'", pilihan: ["برسکول", "بيرسکول", "برسکوله", "بيرسکوله"], betul: 0 },
];


const BANK: Record<string, Soalan[]> = {
  "1:matematik": [
    { soalan: "Kirakan: 2 + 3 = ___", jawapan: "5" },
    { soalan: "Kirakan: 9 - 4 = ___", jawapan: "5" },
    { soalan: "Kirakan: 6 + 7 = ___", jawapan: "13" },
    { soalan: "Selesaikan: 15 - 8 = ___", jawapan: "7" },
    { soalan: "Siti ada 4 guli, Abu ada 5 guli. Berapa jumlah guli mereka?", jawapan: "9" },
    { soalan: "Dalam bakul ada 10 oren. 3 dimakan. Berapa tinggal?", jawapan: "7" },
    { soalan: "Isi tempat kosong: 1, 2, 3, ___, 5", jawapan: "4" },
    { soalan: "Isi tempat kosong: 10, ___, 12, 13", jawapan: "11" },
  ],
  "1:bahasa-melayu": [
    { soalan: "Ejakan perkataan untuk gambar 🐘.", jawapan: "gajah", petunjuk: "haiwan besar berbelalai" },
    { soalan: "Ejakan perkataan untuk gambar 🍎.", jawapan: "epal", petunjuk: "buah berwarna merah" },
    { soalan: "Ejakan perkataan untuk gambar 🌙.", jawapan: "bulan", petunjuk: "cahaya pada malam hari" },
    { soalan: "Ejakan perkataan untuk gambar ⭐.", jawapan: "bintang", petunjuk: "ada di langit malam" },
    { soalan: "Ejakan perkataan untuk gambar 🐟.", jawapan: "ikan", petunjuk: "haiwan dalam air" },
    { soalan: "Lengkapkan: 'Ibu memasak ___.'", jawapan: "nasi", petunjuk: "apa yang dimasak ibu" },
    { soalan: "Lengkapkan: 'Langit berwarna ___.'", jawapan: "biru", petunjuk: "tengok langit siang" },
    { soalan: "Apakah lawan kata 'panas'?", jawapan: "sejuk", petunjuk: "lawan kepada panas" },
     { soalan: "Apakah lawan kata 'siang'?", jawapan: "malam", petunjuk: "masa yang gelap" },
     { soalan: "Tulis satu ayat mudah tentang diri anda.", jawapan: "nama saya", petunjuk: "cerita tentang diri sendiri" },
   ],
   "1:bahasa-inggeris": [
     { soalan: "Spell the word for 🐘.", jawapan: "elephant", petunjuk: "big animal with long trunk" },
     { soalan: "Spell the word for 🍎.", jawapan: "apple", petunjuk: "red fruit" },
     { soalan: "Spell the word for 🌟.", jawapan: "star", petunjuk: "shines in sky at night" },
     { soalan: "Spell the word for 🐟.", jawapan: "fish", petunjuk: "lives in water" },
     { soalan: "Spell the word for 🌸.", jawapan: "flower", petunjuk: "beautiful colourful plant" },
     { soalan: "Complete: 'I eat ___ for breakfast.'", jawapan: "rice", petunjuk: "what do you eat in morning" },
     { soalan: "Complete: 'My favourite colour is ___.'", jawapan: "blue", petunjuk: "what is your favourite colour" },
     { soalan: "Complete: 'I go to ___ every day.'", jawapan: "school", petunjuk: "where do you study" },
      { soalan: "Name 3 colours in English.", jawapan: "red blue green", petunjuk: "colours of rainbow" },
      { soalan: "What do you say before sleep?", jawapan: "good night", petunjuk: "greeting at night time" },
    ],
    "1:jawi": [
      { soalan: "Apakah nama huruf Jawi → ت ?", jawapan: "ta", petunjuk: "huruf berbunyi T" },
      { soalan: "Apakah nama huruf Jawi → ج ?", jawapan: "jim", petunjuk: "huruf berbunyi J" },
      { soalan: "Apakah nama huruf Jawi → ه ?", jawapan: "ha", petunjuk: "huruf berbunyi H" },
      { soalan: "Apakah nama huruf Jawi → ي ?", jawapan: "ya", petunjuk: "huruf berbunyi Y" },
      { soalan: "Apakah nama huruf Jawi → ع ?", jawapan: "ain", petunjuk: "huruf Arab berbunyi A kuat" },
      { soalan: "Tulis perkataan 'ibu' dalam Jawi.", jawapan: "اِبُو", petunjuk: "i-bu 2 suku kata" },
      { soalan: "Tulis perkataan 'ayah' dalam Jawi.", jawapan: "اَيَه", petunjuk: "a-yah 2 suku kata" },
      { soalan: "Tulis perkataan 'buku' dalam Jawi.", jawapan: "بُکُو", petunjuk: "bu-ku 2 suku kata" },
      { soalan: "Jawi → سکول bermaksud?", jawapan: "sekolah", petunjuk: "tempat kita belajar" },
      { soalan: "Jawi → ماکن bermaksud?", jawapan: "makan", petunjuk: "aktiviti menggunakan mulut" },
    ],
    "1:pendidikan-islam": [
      { soalan: "Namakan rukun Islam yang kedua.", jawapan: "solat", petunjuk: "ibadat 5 kali sehari" },
      { soalan: "Berapa rakaat solat Zohor?", jawapan: "4 rakaat", petunjuk: "solat tengah hari" },
      { soalan: "Apakah doa sebelum makan?", jawapan: "bismillahirrahmanirrahim", petunjuk: "bermula dengan nama Allah" },
      { soalan: "Apakah maksud Alhamdulillah?", jawapan: "segala puji bagi Allah", petunjuk: "ucapan syukur" },
      { soalan: "Apakah maksud Bismillah?", jawapan: "dengan nama Allah", petunjuk: "bermula dengan nama Allah" },
      { soalan: "Apakah yang kita ucap bila mendapat sesuatu baik?", jawapan: "alhamdulillah", petunjuk: "ucapan syukur" },
      { soalan: "Siapakah Nabi kita?", jawapan: "nabi Muhammad SAW", petunjuk: "nabi akhir zaman" },
      { soalan: "Apakah kitab suci umat Islam?", jawapan: "Al-Quran", petunjuk: "firman Allah" },
      { soalan: "Namakan 2 adab makan dalam Islam.", jawapan: "makan dengan tangan kanan dan baca bismillah", petunjuk: "cara makan yang diajar Nabi" },
      { soalan: "Apakah maksud amanah?", jawapan: "boleh dipercayai", petunjuk: "sifat orang yang boleh dipercayai" },
    ],
    "1:sains": [
      { soalan: "Namakan 5 deria manusia.", jawapan: "penglihatan, pendengaran, penciuman, rasa, sentuhan", petunjuk: "deria yang kita guna setiap hari" },
      { soalan: "Organ untuk melihat ialah?", jawapan: "mata", petunjuk: "organ pada muka" },
      { soalan: "Apakah yang kita guna untuk memegang?", jawapan: "tangan", petunjuk: "anggota badan yang ada jari" },
      { soalan: "Namakan 3 haiwan yang hidup di air.", jawapan: "ikan, ketam, udang", petunjuk: "haiwan dalam sungai atau laut" },
      { soalan: "Keperluan asas tumbuhan untuk hidup?", jawapan: "air, cahaya matahari, udara", petunjuk: "apa yang tumbuhan perlukan" },
      { soalan: "Namakan bahagian-bahagian tumbuhan.", jawapan: "akar, batang, daun, bunga, buah", petunjuk: "dari bawah hingga atas" },
      { soalan: "Apakah yang menyebabkan hujan?", jawapan: "wap air naik ke atas jadi awan turun sebagai hujan", petunjuk: "kitaran air" },
      { soalan: "Namakan 3 jenis cuaca.", jawapan: "panas, hujan, berangin", petunjuk: "keadaan cuaca yang kita alami" },
      { soalan: "Air apabila dibekukan bertukar jadi?", jawapan: "ais", petunjuk: "masukkan air dalam peti sejuk" },
      { soalan: "Namakan 2 cara jimat air.", jawapan: "tutup paip semasa gosok gigi, guna air secukupnya", petunjuk: "cara menjimatkan air di rumah" },
    ],
    "2:bahasa-melayu": [
      { soalan: "Tulis ayat lengkap menggunakan perkataan 'berlari'.", jawapan: "ali berlari di padang", petunjuk: "buat ayat dengan kata kerja berlari" },
      { soalan: "Apakah imbuhan dalam perkataan 'membantu'?", jawapan: "mem", petunjuk: "imbuhan awalan" },
      { soalan: "Tulis antonim bagi perkataan 'rajin'.", jawapan: "malas", petunjuk: "lawan kata rajin" },
      { soalan: "Tulis sinonim bagi perkataan 'gembira'.", jawapan: "suka", petunjuk: "perkataan yang sama maksud" },
      { soalan: "Tulis ayat tanya menggunakan perkataan 'bila'.", jawapan: "bila ibu akan pulang", petunjuk: "ayat yang bertanya" },
      { soalan: "Apakah kata nama dalam ayat 'Adik makan nasi'?", jawapan: "adik dan nasi", petunjuk: "nama orang atau benda" },
      { soalan: "Tulis ayat perintah.", jawapan: "tolong ambil buku itu", petunjuk: "ayat yang menyuruh" },
      { soalan: "Apakah maksud peribahasa 'bagai aur dengan tebing'?", jawapan: "saling membantu antara satu sama lain", petunjuk: "peribahasa tentang kerjasama" },
      { soalan: "Tulis kata adjektif bagi sifat orang yang baik hati.", jawapan: "pemurah", petunjuk: "kata sifat" },
    { soalan: "Tulis ayat menggunakan kata hubung 'dan'.", jawapan: "ali dan abu pergi ke sekolah", petunjuk: "gabungkan dua ayat" },
  ],
  "2:matematik": [
    { soalan: "Kirakan: 25 + 37 = ___", jawapan: "62", petunjuk: "tambah puluhan dulu" },
    { soalan: "Kirakan: 84 - 46 = ___", jawapan: "38", petunjuk: "tolak puluhan dulu" },
    { soalan: "Kirakan: 6 × 3 = ___", jawapan: "18", petunjuk: "sifir 6" },
    { soalan: "Kirakan: 8 × 4 = ___", jawapan: "32", petunjuk: "sifir 8" },
    { soalan: "Kirakan: 20 ÷ 4 = ___", jawapan: "5", petunjuk: "berapa kumpulan 4 dalam 20" },
    { soalan: "Ali ada 45 guli. Dapat 28 lagi. Berapa jumlah?", jawapan: "73", petunjuk: "45 + 28" },
    { soalan: "Ibu beli 91 biji telur. Pecah 54. Berapa tinggal?", jawapan: "37", petunjuk: "91 - 54" },
    { soalan: "Dalam sebuah kotak ada 6 baris pensil. Setiap baris ada 7 pensil. Berapa jumlah pensil?", jawapan: "42", petunjuk: "6 × 7" },
    { soalan: "56 epal dibahagi sama rata kepada 7 kanak-kanak. Berapa epal setiap orang?", jawapan: "8", petunjuk: "56 ÷ 7" },
    { soalan: "Harga baju RM75. Harga seluar RM38. Berapa jumlah harga?", jawapan: "rm113", petunjuk: "75 + 38" },
  ],
  "2:bahasa-inggeris": [
    { soalan: "Write the plural of 'cat'.", jawapan: "cats", petunjuk: "add s" },
    { soalan: "Write the plural of 'box'.", jawapan: "boxes", petunjuk: "add es" },
    { soalan: "Write the plural of 'child'.", jawapan: "children", petunjuk: "irregular plural" },
    { soalan: "Write the past tense of 'run'.", jawapan: "ran", petunjuk: "irregular verb" },
    { soalan: "Write the past tense of 'eat'.", jawapan: "ate", petunjuk: "irregular verb" },
    { soalan: "Write the past tense of 'go'.", jawapan: "went", petunjuk: "irregular verb" },
    { soalan: "Write the past tense of 'play'.", jawapan: "played", petunjuk: "add ed" },
    { soalan: "Write one sentence using the word 'beautiful'.", jawapan: "the flower is beautiful", petunjuk: "use adjective in a sentence" },
    { soalan: "Write the opposite of 'happy'.", jawapan: "sad", petunjuk: "antonym" },
    { soalan: "Write the opposite of 'big'.", jawapan: "small", petunjuk: "antonym" },
  ],
  "2:jawi": [
    { soalan: "Tulis perkataan 'sekolah' dalam Jawi.", jawapan: "سکول", petunjuk: "se-ko-lah" },
    { soalan: "Tulis perkataan 'keluarga' dalam Jawi.", jawapan: "كلوارگا", petunjuk: "ke-lu-ar-ga" },
    { soalan: "Tulis perkataan 'membaca' dalam Jawi.", jawapan: "ممباچا", petunjuk: "mem-ba-ca" },
    { soalan: "Tulis perkataan 'berlari' dalam Jawi.", jawapan: "برلاري", petunjuk: "ber-la-ri" },
    { soalan: "Tulis perkataan 'Malaysia' dalam Jawi.", jawapan: "مليسيا", petunjuk: "Ma-lay-si-a" },
    { soalan: "Apakah bunyi huruf Jawi ڠ ?", jawapan: "nga", petunjuk: "huruf tambahan Jawi" },
    { soalan: "Apakah bunyi huruf Jawi چ ?", jawapan: "cha", petunjuk: "huruf tambahan Jawi" },
    { soalan: "Apakah bunyi huruf Jawi ڤ ?", jawapan: "pa", petunjuk: "huruf tambahan Jawi" },
    { soalan: "Jawi گورو bermaksud apa?", jawapan: "guru", petunjuk: "orang yang mengajar" },
    { soalan: "Jawi مليسيا bermaksud apa?", jawapan: "Malaysia", petunjuk: "negara kita" },
  ],
  "2:pendidikan-islam": [
    { soalan: "Namakan kitab yang diturunkan kepada Nabi Muhammad SAW.", jawapan: "Al-Quran", petunjuk: "kitab suci umat Islam" },
    { soalan: "Namakan malaikat yang menyampaikan wahyu.", jawapan: "Jibril", petunjuk: "malaikat yang berjumpa Nabi" },
    { soalan: "Berapa jumlah Nabi dan Rasul yang wajib diketahui?", jawapan: "25", petunjuk: "dua puluh lima" },
    { soalan: "Apakah maksud sifat Wujud Allah?", jawapan: "Allah itu Ada", petunjuk: "sifat wajib Allah pertama" },
    { soalan: "Apakah maksud sifat Baqa Allah?", jawapan: "Allah itu Kekal", petunjuk: "Allah tidak akan musnah" },
    { soalan: "Apakah maksud sifat Wahdaniah Allah?", jawapan: "Allah Maha Esa", petunjuk: "Allah hanya satu" },
    { soalan: "Siapakah Rasul terakhir?", jawapan: "Nabi Muhammad SAW", petunjuk: "nabi akhir zaman" },
    { soalan: "Berapa ayat dalam Surah Al-Fatihah?", jawapan: "7 ayat", petunjuk: "surah pertama dalam Al-Quran" },
    { soalan: "Apakah nama malaikat yang mencabut nyawa?", jawapan: "Izrail", petunjuk: "malaikat maut" },
    { soalan: "Apakah nama malaikat yang meniup sangkakala?", jawapan: "Israfil", petunjuk: "malaikat yang meniup sangkakala hari kiamat" },
  ],
  "2:sains": [
    { soalan: "Apakah proses tumbuhan membuat makanan?", jawapan: "Fotosintesis", petunjuk: "proses menggunakan cahaya matahari" },
    { soalan: "Namakan 3 keadaan jirim.", jawapan: "Pepejal, cecair, gas", petunjuk: "tiga bentuk bahan" },
    { soalan: "Berikan contoh pepejal.", jawapan: "batu, kayu, besi", petunjuk: "benda yang keras dan tidak berubah bentuk" },
    { soalan: "Berikan contoh cecair.", jawapan: "air, minyak, susu", petunjuk: "benda yang boleh mengalir" },
    { soalan: "Berikan contoh gas.", jawapan: "udara, oksigen, karbon dioksida", petunjuk: "benda yang tidak kelihatan" },
    { soalan: "Apakah yang berlaku kepada ais apabila dipanaskan?", jawapan: "Melebur menjadi air", petunjuk: "pepejal bertukar cecair" },
    { soalan: "Apakah yang berlaku kepada air apabila dipanaskan?", jawapan: "Menyejat menjadi wap", petunjuk: "cecair bertukar gas" },
    { soalan: "Namakan 2 haiwan ovipar.", jawapan: "ayam, ikan, katak, burung", petunjuk: "haiwan yang bertelur" },
    { soalan: "Namakan 2 haiwan vivipar.", jawapan: "kucing, anjing, lembu, manusia", petunjuk: "haiwan yang melahirkan anak" },
    { soalan: "Apakah yang menyebabkan magnet menarik benda?", jawapan: "Daya tarikan magnet", petunjuk: "kuasa magnet menarik besi" },
  ],
  "3:bahasa-melayu": [
    { soalan: "Pilih ayat pasif yang betul.", jawapan: "Buku dibaca oleh Ali", petunjuk: "subjek menerima perbuatan" },
    { soalan: "Apakah imbuhan dalam perkataan 'kebersihan'?", jawapan: "ke...an", petunjuk: "imbuhan apitan" },
    { soalan: "Tulis ayat menggunakan kata hubung 'tetapi'.", jawapan: "Ali rajin tetapi adiknya malas", petunjuk: "gabungkan dua ayat bertentangan" },
    { soalan: "Apakah kata nama abstrak?", jawapan: "kasih sayang", petunjuk: "tidak dapat dilihat atau disentuh" },
    { soalan: "Tulis sinonim bagi 'indah'.", jawapan: "cantik", petunjuk: "perkataan sama maksud" },
    { soalan: "Tulis antonim bagi 'rajin'.", jawapan: "malas", petunjuk: "lawan kata rajin" },
    { soalan: "Apakah maksud peribahasa 'bersatu teguh bercerai roboh'?", jawapan: "Perpaduan itu kuat", petunjuk: "tentang perpaduan" },
    { soalan: "Tulis ayat aktif menggunakan perkataan 'membaca'.", jawapan: "Ali membaca buku", petunjuk: "subjek + kata kerja + objek" },
    { soalan: "Apakah kata ulang bagi 'budak'?", jawapan: "budak-budak", petunjuk: "guna sengkang" },
    { soalan: "Apakah perkataan majmuk bagi 'jalan' dan 'raya'?", jawapan: "jalan raya", petunjuk: "dua perkataan, satu makna" },
  ],
  "3:matematik": [
    { soalan: "Kirakan: 234 + 567 = ___", jawapan: "801", petunjuk: "tambah sa, puluh, ratus" },
    { soalan: "Kirakan: 856 - 378 = ___", jawapan: "478", petunjuk: "pinjam dari puluh / ratus" },
    { soalan: "Kirakan: 7 × 8 = ___", jawapan: "56", petunjuk: "sifir 7" },
    { soalan: "Kirakan: 72 ÷ 8 = ___", jawapan: "9", petunjuk: "sifir 8 songsang" },
    { soalan: "Kirakan: 1/2 + 1/4 = ___", jawapan: "3/4", petunjuk: "samakan penyebut dulu" },
    { soalan: "Kirakan: 0.5 + 0.3 = ___", jawapan: "0.8", petunjuk: "susun titik perpuluhan" },
    { soalan: "Luas segiempat 6cm × 4cm = ___", jawapan: "24cm²", petunjuk: "panjang × lebar" },
    { soalan: "Perimeter segitiga 3cm + 4cm + 5cm = ___", jawapan: "12cm", petunjuk: "jumlah semua sisi" },
    { soalan: "Bundarkan 456 ke ratus terdekat = ___", jawapan: "500", petunjuk: "5 atau lebih, naik" },
    { soalan: "RM100 - RM67 = ___", jawapan: "RM33", petunjuk: "tolak dari 100" },
  ],
  "3:bahasa-inggeris": [
    { soalan: "Write the plural of 'leaf'.", jawapan: "leaves", petunjuk: "f → ves" },
    { soalan: "Write the past tense of 'write'.", jawapan: "wrote", petunjuk: "irregular verb" },
    { soalan: "Write a synonym of 'happy'.", jawapan: "joyful", petunjuk: "same meaning" },
    { soalan: "Write an antonym of 'brave'.", jawapan: "cowardly", petunjuk: "opposite of brave" },
    { soalan: "Write an example of a simile.", jawapan: "She is as fast as a cheetah", petunjuk: "use 'as ... as'" },
    { soalan: "Fill in: She ___ to school yesterday.", jawapan: "went", petunjuk: "past tense of go" },
    { soalan: "Fill in: I ___ reading now.", jawapan: "am", petunjuk: "to be with I" },
    { soalan: "Write a sentence using 'but'.", jawapan: "Ali is smart but lazy", petunjuk: "contrast two ideas" },
    { soalan: "Write a sentence using 'because'.", jawapan: "She cried because she was sad", petunjuk: "give a reason" },
    { soalan: "Write a sentence using 'although'.", jawapan: "Although it rained we went to school", petunjuk: "show contrast" },
  ],
  "3:pendidikan-islam": [
    { soalan: "Namakan nabi yang diutus kepada kaum Ad.", jawapan: "Nabi Hud", petunjuk: "salah seorang nabi" },
    { soalan: "Namakan kitab Nabi Daud.", jawapan: "Zabur", petunjuk: "4 kitab Allah" },
    { soalan: "Apakah tugas malaikat Jibril?", jawapan: "menyampaikan wahyu", petunjuk: "kepada para nabi" },
    { soalan: "Apakah maksud sifat Wujud?", jawapan: "Allah itu Ada", petunjuk: "sifat wajib pertama" },
    { soalan: "Berapa ayat surah Al-Fatihah?", jawapan: "7", petunjuk: "tujuh ayat" },
    { soalan: "Siapakah yang wajib solat Jumaat?", jawapan: "lelaki Islam baligh", petunjuk: "syarat wajib" },
    { soalan: "Apakah bulan puasa?", jawapan: "Ramadan", petunjuk: "bulan ke-9" },
    { soalan: "Berikan contoh sifat mahmudah.", jawapan: "jujur amanah sabar", petunjuk: "sifat terpuji" },
    { soalan: "Berikan contoh sifat mazmumah.", jawapan: "dengki sombong bakhil", petunjuk: "sifat keji" },
    { soalan: "Kaabah terletak di mana?", jawapan: "Makkah", petunjuk: "kota suci umat Islam" },
  ],
  "3:sains": [
    { soalan: "Apakah fotosintesis?", jawapan: "proses tumbuhan buat makanan menggunakan cahaya", petunjuk: "berlaku di daun hijau" },
    { soalan: "Namakan 3 keadaan jirim.", jawapan: "pepejal cecair gas", petunjuk: "tiga bentuk bahan" },
    { soalan: "Berikan contoh haiwan ovipar.", jawapan: "ayam ikan katak", petunjuk: "haiwan bertelur" },
    { soalan: "Berikan contoh haiwan vivipar.", jawapan: "kucing lembu manusia", petunjuk: "haiwan melahirkan anak" },
    { soalan: "Apa yang magnet tarik?", jawapan: "benda besi", petunjuk: "bukan kayu/plastik" },
    { soalan: "Berapa planet dalam sistem suria?", jawapan: "8", petunjuk: "lapan planet" },
    { soalan: "Apakah rantaian makanan?", jawapan: "urutan pemakanan dari tumbuhan ke haiwan", petunjuk: "bermula dengan tumbuhan" },
    { soalan: "Berikan contoh haiwan herbivor.", jawapan: "lembu arnab kuda", petunjuk: "haiwan makan tumbuhan" },
    { soalan: "Apakah gerhana matahari?", jawapan: "bumi masuk bayang bulan", petunjuk: "bulan halang cahaya" },
    { soalan: "Apakah pemanasan global?", jawapan: "peningkatan suhu bumi akibat gas rumah hijau", petunjuk: "isu alam sekitar" },
  ],
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function LatihanSubjekPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/latihan" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const isJawiD2 = darjahId === "2" && subjekId === "jawi";
  const soalanList = useMemo(() => (isJawiD2 ? [] : (BANK[`${darjahId}:${subjekId}`] ?? [])), [darjahId, subjekId, isJawiD2]);
  const mcqList = isJawiD2 ? JAWI_D2_MCQ : [];
  const totalSoalan = isJawiD2 ? mcqList.length : soalanList.length;
  const [pilihan, setPilihan] = useState<number | null>(null);

  const [idx, setIdx] = useState(0);
  const [jwp, setJwp] = useState("");
  const [semak, setSemak] = useState<null | boolean>(null);
  const [bintang, setBintang] = useState(0);
  const [habis, setHabis] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuatkan...</p>
      </div>
    );
  }

  if (!darjah || !subjek || totalSoalan === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Latihan belum tersedia</h1>
          <Link to="/darjah/$darjahId/$subjekId" params={{ darjahId, subjekId }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  const soalan = soalanList[idx];
  const mcq = mcqList[idx];

  function semakJawapan() {
    const betul = normalize(jwp) === normalize(soalan.jawapan);
    setSemak(betul);
    if (betul) setBintang((b) => b + 1);
  }

  function pilihKotak(i: number) {
    if (semak !== null) return;
    setPilihan(i);
    const betul = i === mcq.betul;
    setSemak(betul);
    if (betul) setBintang((b) => b + 1);
  }

  function seterusnya() {
    if (idx + 1 >= totalSoalan) {
      setHabis(true);
    } else {
      setIdx(idx + 1);
      setJwp("");
      setSemak(null);
      setPilihan(null);
    }
  }

  function ulang() {
    setIdx(0);
    setJwp("");
    setSemak(null);
    setPilihan(null);
    setBintang(0);
    setHabis(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Aktiviti
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground shadow-soft"
            style={isJawiD2 ? { background: "#1B8A5A" } : undefined}
          >
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">Latihan Bertulis</h1>
            <p className="text-sm text-muted-foreground">{darjah.label} • {subjek.title}</p>
          </div>
        </div>

        {!habis ? (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-xs font-bold text-muted-foreground">
              Soalan {idx + 1} / {totalSoalan}
            </div>

            {isJawiD2 ? (
              <>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">{mcq.soalan}</h2>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {mcq.pilihan.map((opt, i) => {
                    const dipilih = pilihan === i;
                    const betulIdx = mcq.betul;
                    let style: React.CSSProperties = { borderColor: "#F5A623", color: "#1B8A5A" };
                    if (semak !== null) {
                      if (i === betulIdx) style = { background: "#1B8A5A", borderColor: "#1B8A5A", color: "#fff" };
                      else if (dipilih) style = { background: "#dc2626", borderColor: "#dc2626", color: "#fff" };
                      else style = { borderColor: "#e5e7eb", color: "#9ca3af" };
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => pilihKotak(i)}
                        disabled={semak !== null}
                        style={style}
                        className="flex min-h-[120px] items-center justify-center rounded-2xl border-4 bg-card p-4 text-5xl font-extrabold shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed md:min-h-[140px] md:text-6xl"
                        dir="rtl"
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">{soalan.soalan}</h2>
                {soalan.petunjuk && (
                  <p className="mt-2 text-sm text-muted-foreground italic">Petunjuk: {soalan.petunjuk}</p>
                )}

                <input
                  value={jwp}
                  onChange={(e) => setJwp(e.target.value)}
                  disabled={semak !== null}
                  placeholder="Tulis jawapan kamu..."
                  className="mt-5 w-full rounded-2xl border-2 border-input bg-background p-4 font-display text-xl font-extrabold text-foreground outline-none transition focus:border-primary disabled:opacity-70"
                />

                {semak === null && (
                  <button
                    onClick={semakJawapan}
                    disabled={jwp.trim().length === 0}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" /> Semak Jawapan
                  </button>
                )}
              </>
            )}

            {semak !== null && (
              <div className="mt-5 space-y-3">
                <div
                  className="rounded-2xl p-4 text-center font-display text-lg font-extrabold"
                  style={
                    semak
                      ? { background: "#1B8A5A", color: "#fff" }
                      : { background: "#fee2e2", color: "#b91c1c" }
                  }
                >
                  {semak
                    ? "Betul! 🎉"
                    : isJawiD2
                      ? `Jawapan betul: ${mcq.pilihan[mcq.betul]}`
                      : `Jawapan betul: ${soalan.jawapan}`}
                </div>
                <button
                  onClick={seterusnya}
                  style={{ background: "#1B8A5A" }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-lg font-extrabold text-white shadow-soft"
                >
                  {idx + 1 >= totalSoalan ? "Lihat Keputusan" : "Soalan Seterusnya →"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
            <Sparkles className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Syabas! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Kamu jawab betul <span className="font-extrabold text-primary">{bintang}</span> daripada {totalSoalan} soalan.
            </p>
            <div className="mt-4 flex justify-center">
              <StarReward earned={Math.min(3, Math.ceil((bintang / totalSoalan) * 3))} />
            </div>
            <button
              onClick={ulang}
              className="mt-5 rounded-full bg-card px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
            >
              Cuba Lagi
            </button>
          </div>
        )}
      </main>
    </div>
  );

}
