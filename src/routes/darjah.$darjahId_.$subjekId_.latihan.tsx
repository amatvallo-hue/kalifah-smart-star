import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PenLine, Send, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { simpanProgress } from "@/lib/progress";

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

const JAWI_D4_MCQ: SoalanMcq[] = [
  { soalan: "Pilih ejaan Jawi bagi 'kecemerlangan'", pilihan: ["کچمرلڠن", "کيچمرلاڠن", "کچمرلاڠن", "کيچمرلڠن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'persekitaran'", pilihan: ["ڤرسيکيتارن", "ڤيرسيکيتارن", "ڤرسکيتارن", "ڤيرسکيتارن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'pembangunan'", pilihan: ["ڤمباڠونن", "ڤيمباڠونن", "ڤمبانڬونن", "ڤيمبانڬونن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'keselamatan'", pilihan: ["کسلامتن", "کيسلامتن", "کسيلامتن", "کيسيلامتن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'tanggungjawab'", pilihan: ["تاڠڬوڠجاوب", "تڠڬوڠجاوب", "تاڠڬوڠجوب", "تڠڬوڠجوب"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'perkhidmatan'", pilihan: ["ڤرخدمتن", "ڤيرخدمتن", "ڤرخيدمتن", "ڤيرخيدمتن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'kebebasan'", pilihan: ["کببسن", "کيببسن", "کببيسن", "کيببيسن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'pengetahuan'", pilihan: ["ڤڠتاهوان", "ڤيڠتاهوان", "ڤڠيتاهوان", "ڤيڠيتاهوان"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'kepimpinan'", pilihan: ["کڤيمڤينن", "کيڤيمڤينن", "کڤمڤينن", "کيڤمڤينن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kemasyarakatan'", pilihan: ["کماسياراکتن", "کيماسياراکتن", "کماسارکتن", "کيماسارکتن"], betul: 0 },
];

const JAWI_D6_MCQ: SoalanMcq[] = [
  { soalan: "Pilih ejaan Jawi bagi 'kesukarelaan'", pilihan: ["کسوکاريلاءن", "کيسوکاريلاءن", "کسوکرلاءن", "کيسوکرلاءن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'pembangunan insan'", pilihan: ["ڤمبانڬونن انسن", "ڤمبانڬونن اينسن", "ڤمبانڬونن انسان", "ڤمبانڬونن اينسان"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'kelestarian alam'", pilihan: ["کلستارين الم", "کيلستارين الم", "کلستاريان الم", "کيلستاريان الم"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'kemampanan'", pilihan: ["کمامڤانن", "کيمامڤانن", "کمامڤنن", "کيمامڤنن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kesejahteraan'", pilihan: ["کسجاهتراءن", "کيسجاهتراءن", "کسيجاهتراءن", "کيسيجاهتراءن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'kewarganegaraan'", pilihan: ["کوارڬانيڬاراءن", "کيوارڬانيڬاراءن", "کوارڬنيڬاراءن", "کوارڬانيڬارأن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kepelbagaian'", pilihan: ["کڤلباڬاين", "کيڤلباڬاين", "کڤلبڬاين", "کيڤلبڬاين"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kesinambungan'", pilihan: ["کسينمبوڠن", "کيسينمبوڠن", "کسينامبوڠن", "کيسينامبوڠن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'pemberdayaan'", pilihan: ["ڤمبرداياءن", "ڤيمبرداياءن", "ڤمبيرداياءن", "ڤيمبيرداياءن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'pengantarabangsaan'", pilihan: ["ڤڠنتارابڠساءن", "ڤيڠنتارابڠساءن", "ڤڠانتارابڠساءن", "ڤيڠانتارابڠساءن"], betul: 2 },
];

const JAWI_D5_MCQ: SoalanMcq[] = [
  { soalan: "Pilih ejaan Jawi bagi 'kemasyarakatan'", pilihan: ["کماسياراکتن", "کيماسياراکتن", "کماسارکتن", "کيماسارکتن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kepimpinan'", pilihan: ["کڤيمڤينن", "کيڤيمڤينن", "کڤمڤينن", "کيڤمڤينن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'pembangunan'", pilihan: ["ڤمباڠونن", "ڤيمباڠونن", "ڤمبانڬونن", "ڤيمبانڬونن"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'keharmonian'", pilihan: ["کهارمونين", "کيهارمونين", "کهرمونين", "کيهرمونين"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'perjuangan'", pilihan: ["ڤرجواڠن", "ڤيرجواڠن", "ڤرجوڠن", "ڤيرجوڠن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kejayaan'", pilihan: ["کجاياءن", "کيجاياءن", "کجايأن", "کيجايأن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'semangat'", pilihan: ["سماڠت", "سيماڠت", "سمڠت", "سيمڠت"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'keberanian'", pilihan: ["کبرانين", "کيبرانين", "کبراءنين", "کيبراءنين"], betul: 2 },
  { soalan: "Pilih ejaan Jawi bagi 'ketabahan'", pilihan: ["کتابهن", "کيتابهن", "کتبهن", "کيتبهن"], betul: 0 },
  { soalan: "Pilih ejaan Jawi bagi 'kesabaran'", pilihan: ["کصبارن", "کيصبارن", "کسبارن", "کيسبارن"], betul: 2 },
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
  "4:bahasa-melayu": [
    { soalan: "Tulis ayat majmuk menggunakan kata hubung 'dan'.", jawapan: "Ali makan nasi dan Abu minum air", petunjuk: "gabungkan dua ayat dengan 'dan'" },
    { soalan: "Apa maksud peribahasa 'seperti air di daun keladi'?", jawapan: "Tidak kekal", petunjuk: "tentang sifat yang berubah-ubah" },
    { soalan: "Tulis pantun 4 baris mudah.", jawapan: "Buah cempedak di luar pagar/Ambil galah tolong jolokkan/Saya budak baru belajar/Kalau salah tolong tunjukkan", petunjuk: "2 baris pembayang + 2 baris maksud" },
    { soalan: "Apakah kata sendi nama?", jawapan: "kata yang menunjukkan tempat seperti di ke dari", petunjuk: "contoh: di, ke, dari" },
    { soalan: "Tulis ayat menggunakan kata penguat 'sangat'.", jawapan: "Bunga itu sangat cantik", petunjuk: "tambah 'sangat' sebelum sifat" },
    { soalan: "Apakah imbuhan apitan 'ke...an'?", jawapan: "imbuhan yang hadir di awal dan akhir kata", petunjuk: "ada di permulaan dan penghujung" },
    { soalan: "Tulis dialog dua orang.", jawapan: "Ali:Selamat pagi. Abu:Selamat pagi juga", petunjuk: "perbualan ringkas" },
    { soalan: "Apakah bahagian pantun yang mengandungi maksud?", jawapan: "Maksud", petunjuk: "2 baris terakhir pantun" },
    { soalan: "Tulis kata nafi dalam ayat.", jawapan: "Saya tidak suka makan sayur", petunjuk: "guna 'tidak' atau 'bukan'" },
    { soalan: "Apakah kata bilangan?", jawapan: "kata yang menunjukkan jumlah seperti tiga orang dua buah", petunjuk: "menunjukkan kuantiti" },
  ],
  "4:matematik": [
    { soalan: "2345 + 3456 = ___", jawapan: "5801", petunjuk: "tambah lajur kanan dulu" },
    { soalan: "8765 - 4321 = ___", jawapan: "4444", petunjuk: "tolak lajur kanan dulu" },
    { soalan: "12 × 8 = ___", jawapan: "96", petunjuk: "sifir 12" },
    { soalan: "144 ÷ 12 = ___", jawapan: "12", petunjuk: "sifir 12 songsang" },
    { soalan: "2/3 + 1/3 = ___", jawapan: "1", petunjuk: "penyebut sama, tambah pengangka" },
    { soalan: "3/4 - 1/2 = ___", jawapan: "1/4", petunjuk: "samakan penyebut dulu" },
    { soalan: "0.75 + 0.25 = ___", jawapan: "1.0", petunjuk: "susun titik perpuluhan" },
    { soalan: "Luas segiempat 12cm × 8cm = ___", jawapan: "96cm²", petunjuk: "panjang × lebar" },
    { soalan: "Perimeter segiempat 12cm × 8cm = ___", jawapan: "40cm", petunjuk: "2(p + l)" },
    { soalan: "Sudut tegak berapa darjah?", jawapan: "90 darjah", petunjuk: "sudut siku-siku" },
  ],
  "4:bahasa-inggeris": [
    { soalan: "Write a compound sentence using 'and'.", jawapan: "She sings and he dances", petunjuk: "two clauses joined by 'and'" },
    { soalan: "Write in present continuous: She/sing.", jawapan: "She is singing", petunjuk: "is + verb-ing" },
    { soalan: "Write an example of alliteration.", jawapan: "Peter Piper picked peppers", petunjuk: "same starting sound" },
    { soalan: "Write an example of onomatopoeia.", jawapan: "The bee buzzed", petunjuk: "word sounds like meaning" },
    { soalan: "Replace noun with pronoun: 'Ali runs fast'.", jawapan: "He runs fast", petunjuk: "Ali is male" },
    { soalan: "Write a synonym of 'angry'.", jawapan: "furious", petunjuk: "very angry" },
    { soalan: "Write an antonym of 'ancient'.", jawapan: "modern", petunjuk: "opposite of old" },
    { soalan: "Fill in: They ___ playing now.", jawapan: "are", petunjuk: "to be with they" },
    { soalan: "Write a sentence using possessive pronoun.", jawapan: "The book is hers", petunjuk: "hers/his/theirs" },
    { soalan: "Write a compound sentence using 'but'.", jawapan: "She is smart but lazy", petunjuk: "contrast two ideas" },
  ],
  "4:pendidikan-islam": [
    { soalan: "Apakah maksud akhlak?", jawapan: "budi pekerti", petunjuk: "sifat yang mulia" },
    { soalan: "Apakah maksud ukhuwah?", jawapan: "persaudaraan", petunjuk: "sesama Muslim" },
    { soalan: "Apakah maksud amanah?", jawapan: "boleh dipercayai", petunjuk: "sifat yang dipercayai" },
    { soalan: "Apakah maksud istiqamah?", jawapan: "tetap pendirian", petunjuk: "konsisten dalam amalan" },
    { soalan: "Bila Nabi Muhammad SAW lahir?", jawapan: "570M", petunjuk: "tahun gajah" },
    { soalan: "Bila Nabi mula terima wahyu?", jawapan: "usia 40 tahun", petunjuk: "di Gua Hira" },
    { soalan: "Apakah peristiwa hijrah?", jawapan: "perpindahan Nabi dari Makkah ke Madinah", petunjuk: "tahun 622M" },
    { soalan: "Siapa menemani Nabi hijrah?", jawapan: "Abu Bakar", petunjuk: "sahabat akrab Nabi" },
    { soalan: "Apakah maksud tawaduk?", jawapan: "rendah diri", petunjuk: "tidak sombong" },
    { soalan: "Apakah maksud syukur?", jawapan: "berterima kasih atas nikmat Allah", petunjuk: "ucap Alhamdulillah" },
  ],
  "4:sains": [
    { soalan: "Apakah sel?", jawapan: "unit terkecil makhluk hidup", petunjuk: "binaan asas hidupan" },
    { soalan: "Apakah ekosistem?", jawapan: "komuniti organisma dan persekitaran", petunjuk: "interaksi hidupan + alam" },
    { soalan: "Apakah habitat?", jawapan: "tempat tinggal organisma", petunjuk: "rumah haiwan/tumbuhan" },
    { soalan: "Apakah adaptasi?", jawapan: "penyesuaian diri dengan persekitaran", petunjuk: "cara hidup di habitat" },
    { soalan: "Contoh tenaga kinetik.", jawapan: "air mengalir bola bergerak", petunjuk: "tenaga pergerakan" },
    { soalan: "Contoh tenaga keupayaan.", jawapan: "batu di atas meja spring termampat", petunjuk: "tenaga tersimpan" },
    { soalan: "Contoh tenaga boleh diperbaharui.", jawapan: "solar angin air", petunjuk: "sumber tidak habis" },
    { soalan: "Contoh tenaga tidak boleh diperbaharui.", jawapan: "minyak arang batu gas asli", petunjuk: "sumber fosil" },
    { soalan: "Apakah pencemaran udara?", jawapan: "udara tercemar bahan berbahaya", petunjuk: "asap, gas toksik" },
    { soalan: "Cara kitar semula.", jawapan: "proses semula bahan seperti kertas plastik logam", petunjuk: "kurangkan sampah" },
  ],
  "5:bahasa-melayu": [
    { soalan: "Apakah tema?", jawapan: "persoalan utama yang disampaikan dalam karya", petunjuk: "mesej utama karya sastera" },
    { soalan: "Apakah plot?", jawapan: "susunan peristiwa dalam cerita", petunjuk: "urutan cerita dari mula hingga tamat" },
    { soalan: "Beza protagonis dan antagonis.", jawapan: "protagonis watak baik antagonis watak jahat atau menentang", petunjuk: "watak utama vs watak lawan" },
    { soalan: "Apakah latar tempat?", jawapan: "tempat cerita berlaku", petunjuk: "lokasi dalam cerita" },
    { soalan: "Apakah sudut pandangan pertama?", jawapan: "pencerita menggunakan aku atau saya", petunjuk: "told from I perspective" },
    { soalan: "Contoh imbuhan sisipan.", jawapan: "geletar gelegar gemilang", petunjuk: "el, em, er, in di tengah kata" },
    { soalan: "Apakah kata terbitan?", jawapan: "kata yang menerima imbuhan", petunjuk: "kata asal + imbuhan" },
    { soalan: "Apakah simpulan bahasa?", jawapan: "ungkapan pendek dengan makna kiasan", petunjuk: "bukan literal" },
    { soalan: "Contoh simpulan bahasa.", jawapan: "kaki bangku bermaksud bodoh", petunjuk: "contoh ungkapan kiasan" },
    { soalan: "Beza cerpen dan novel.", jawapan: "cerpen lebih pendek novel lebih panjang dan kompleks", petunjuk: "perbandingan genre" },
  ],
  "5:matematik": [
    { soalan: "Kirakan: 23456 + 34567 = ___", jawapan: "58023", petunjuk: "tambah lajur kanan dulu" },
    { soalan: "Kirakan: 75000 - 34567 = ___", jawapan: "40433", petunjuk: "pinjam dari puluh / ratus" },
    { soalan: "Kirakan: 15 × 15 = ___", jawapan: "225", petunjuk: "sifir 15" },
    { soalan: "Kirakan: 360 ÷ 15 = ___", jawapan: "24", petunjuk: "bahagi 15" },
    { soalan: "Kirakan: 2/5 + 3/5 = ___", jawapan: "1", petunjuk: "penyebut sama" },
    { soalan: "Kirakan: 3/4 - 1/8 = ___", jawapan: "5/8", petunjuk: "samakan penyebut dulu" },
    { soalan: "Kirakan: 1.25 + 2.75 = ___", jawapan: "4.0", petunjuk: "susun titik perpuluhan" },
    { soalan: "Luas bulatan jejari 7cm = ___", jawapan: "154cm²", petunjuk: "π = 22/7" },
    { soalan: "Perimeter bulatan diameter 14cm = ___", jawapan: "44cm", petunjuk: "π × d" },
    { soalan: "Faktor bagi 24 = ___", jawapan: "1,2,3,4,6,8,12,24", petunjuk: "semua nombor yang boleh bahagi 24" },
  ],
  "5:bahasa-inggeris": [
    { soalan: "Write a complex sentence using although.", jawapan: "Although it rained we went to school", petunjuk: "main + subordinate clause" },
    { soalan: "Change to passive: Ali reads the book.", jawapan: "The book is read by Ali", petunjuk: "subject receives action" },
    { soalan: "Write a present perfect sentence.", jawapan: "She has finished her homework", petunjuk: "has/have + past participle" },
    { soalan: "Write a first conditional sentence.", jawapan: "If it rains I will stay home", petunjuk: "if + present, will + base" },
    { soalan: "Write a second conditional sentence.", jawapan: "If I were rich I would buy a car", petunjuk: "if + past, would + base" },
    { soalan: "Change to reported speech: He said I am happy.", jawapan: "He said he was happy", petunjuk: "backshift tense" },
    { soalan: "Write a sentence with subject-verb agreement.", jawapan: "The children are playing", petunjuk: "plural subject + plural verb" },
    { soalan: "Write an example of an idiom.", jawapan: "break a leg means good luck", petunjuk: "figurative meaning" },
    { soalan: "Write an example of direct speech.", jawapan: "She said I love reading", petunjuk: "exact words in quotes" },
    { soalan: "Write an example of indirect speech.", jawapan: "She said she loved reading", petunjuk: "reported without quotes" },
  ],
  "5:pendidikan-islam": [
    { soalan: "Apakah aqidah?", jawapan: "kepercayaan dan keyakinan dalam Islam", petunjuk: "rukun iman" },
    { soalan: "Apakah syariah?", jawapan: "undang-undang Islam", petunjuk: "peraturan Islam" },
    { soalan: "Tiga bahagian Islam.", jawapan: "aqidah syariah akhlak", petunjuk: "tiga komponen utama" },
    { soalan: "Apakah muamalat?", jawapan: "urusan sesama manusia", petunjuk: "hubungan manusia" },
    { soalan: "Tempoh Nabi dakwah di Makkah.", jawapan: "13 tahun", petunjuk: "dakwah awal" },
    { soalan: "Tempoh Nabi dakwah di Madinah.", jawapan: "10 tahun", petunjuk: "dakwah akhir" },
    { soalan: "Pembukaan Makkah berlaku tahun berapa?", jawapan: "8H", petunjuk: "tahun hijrah" },
    { soalan: "Apakah fardu ain?", jawapan: "kewajipan individu", petunjuk: "wajib bagi setiap individu" },
    { soalan: "Apakah fardu kifayah?", jawapan: "kewajipan kolektif", petunjuk: "wajib kolektif" },
    { soalan: "Apakah sunnah?", jawapan: "sesuatu yang dilakukan Nabi dan digalakkan", petunjuk: "amalan Nabi" },
  ],
  "6:bahasa-melayu": [
    { soalan: "Apakah konotasi?", jawapan: "makna tersirat atau tambahan sesuatu perkataan", petunjuk: "makna tambahan" },
    { soalan: "Apakah denotasi?", jawapan: "makna literal dalam kamus", petunjuk: "makna kamus" },
    { soalan: "Apakah eufemisme?", jawapan: "kata halus menggantikan kata kasar", petunjuk: "kata halus" },
    { soalan: "Contoh eufemisme?", jawapan: "meninggal dunia gantikan mati", petunjuk: "contoh kata halus" },
    { soalan: "Apakah laras bahasa?", jawapan: "variasi bahasa mengikut bidang atau situasi", petunjuk: "jenis bahasa" },
    { soalan: "Format surat rasmi?", jawapan: "alamat tarikh tajuk isi dan penutup", petunjuk: "bahagian surat" },
    { soalan: "Apakah wacana?", jawapan: "unit bahasa yang lebih besar dari ayat", petunjuk: "unit bahasa" },
    { soalan: "Apakah kohesi?", jawapan: "kesinambungan dan perkaitan antara ayat", petunjuk: "kesinambungan" },
    { soalan: "Kata hubung syarat contohnya?", jawapan: "jika sekiranya andainya", petunjuk: "syarat" },
    { soalan: "Kata hubung konsesif contohnya?", jawapan: "walaupun meskipun sungguhpun", petunjuk: "konsesif" },
  ],
  "6:matematik": [
    { soalan: "Kirakan: 345678 + 456789 = ___", jawapan: "802467", petunjuk: "tambah lajur kanan dulu" },
    { soalan: "Kirakan: 1000000 - 456789 = ___", jawapan: "543211", petunjuk: "pinjam dari puluh / ratus" },
    { soalan: "Kirakan: 25 × 36 = ___", jawapan: "900", petunjuk: "sifir 25" },
    { soalan: "Kirakan: 1440 ÷ 36 = ___", jawapan: "40", petunjuk: "bahagi 36" },
    { soalan: "Kirakan: 3/4 × 2/3 = ___", jawapan: "1/2", petunjuk: "darab pecahan" },
    { soalan: "Kirakan: 5/6 ÷ 5/3 = ___", jawapan: "1/2", petunjuk: "bahagi pecahan" },
    { soalan: "Kirakan: 2.5 × 1.4 = ___", jawapan: "3.5", petunjuk: "darab perpuluhan" },
    { soalan: "Isipadu silinder j=7cm t=10cm = ___", jawapan: "1540cm³", petunjuk: "π = 22/7" },
    { soalan: "Nisbah 2:3:5 jumlah 200 nilai terbesar = ___", jawapan: "100", petunjuk: "bahagikan mengikut nisbah" },
    { soalan: "Peratusan untung beli RM80 jual RM100 = ___", jawapan: "25%", petunjuk: "(jual - beli) / beli × 100%" },
  ],
  "6:bahasa-inggeris": [
    { soalan: "Apakah narrative essay?", jawapan: "essay yang menceritakan kisah", petunjuk: "story essay" },
    { soalan: "Apakah thesis statement?", jawapan: "hujah utama sesebuah esei", petunjuk: "main argument" },
    { soalan: "Apakah topic sentence?", jawapan: "idea utama perenggan", petunjuk: "main idea paragraph" },
    { soalan: "Tulis transition word contoh?", jawapan: "furthermore moreover however therefore", petunjuk: "connecting words" },
    { soalan: "Tukar passive ke active: The letter was written by Sarah", jawapan: "Sarah wrote the letter", petunjuk: "subject does action" },
    { soalan: "Apakah rhetorical question?", jawapan: "soalan yang ditanya untuk kesan bukan untuk dijawab", petunjuk: "effect not answer" },
    { soalan: "Apakah irony?", jawapan: "berkata berlawanan dengan maksud sebenar", petunjuk: "opposite meaning" },
    { soalan: "Tulis argumentative essay introduction?", jawapan: "introduce topic state thesis", petunjuk: "intro + thesis" },
    { soalan: "Apakah citation?", jawapan: "rujukan kepada sumber maklumat", petunjuk: "reference" },
    { soalan: "Tulis example of irony?", jawapan: "What a beautiful day said during storm", petunjuk: "opposite of what is meant" },
  ],
  "6:pendidikan-islam": [
    { soalan: "Apakah tauhid?", jawapan: "mengesakan Allah", petunjuk: "satu tuhan" },
    { soalan: "Tiga bahagian tauhid?", jawapan: "rububiyyah uluhiyyah asma wassifat", petunjuk: "tiga bahagian" },
    { soalan: "Apakah syirik?", jawapan: "menyekutukan Allah", petunjuk: "sekutu" },
    { soalan: "Beza syirik besar dan kecil?", jawapan: "besar menyembah berhala kecil riak", petunjuk: "perbandingan syirik" },
    { soalan: "Apakah riak?", jawapan: "beramal untuk dipuji manusia", petunjuk: "pamer amal" },
    { soalan: "Apakah nifak?", jawapan: "berpura-pura Islam munafik", petunjuk: "munafik" },
    { soalan: "Ciri munafik?", jawapan: "berdusta bila bercakap khianat bila diamanahkan ingkar bila berjanji", petunjuk: "ciri-ciri" },
    { soalan: "Apakah riddah?", jawapan: "keluar dari Islam", petunjuk: "tinggalkan Islam" },
    { soalan: "Apakah jihad sebenar?", jawapan: "bersungguh-sungguh berjuang di jalan Allah dalam semua aspek", petunjuk: "berjuang" },
    { soalan: "Apakah amar makruf nahi mungkar?", jawapan: "menyuruh kebaikan melarang kemungkaran", petunjuk: "suruh baik larang mungkar" },
  ],
  "6:sains": [
    { soalan: "Apakah evolusi?", jawapan: "perubahan perlahan spesies dari generasi ke generasi", petunjuk: "evolution" },
    { soalan: "Siapa pencetus teori evolusi?", jawapan: "Charles Darwin", petunjuk: "scientist" },
    { soalan: "Apakah seleksi semula jadi?", jawapan: "proses alam memilih yang terbaik untuk hidup", petunjuk: "natural selection" },
    { soalan: "Apakah fosil?", jawapan: "sisa atau kesan organisma purba dalam batuan", petunjuk: "fossil" },
    { soalan: "Apakah perubahan iklim?", jawapan: "perubahan jangka panjang dalam iklim bumi", petunjuk: "climate change" },
    { soalan: "Punca utama perubahan iklim?", jawapan: "aktiviti manusia pembakaran bahan api fosil", petunjuk: "human activity" },
    { soalan: "Apakah pembangunan lestari?", jawapan: "pembangunan yang memenuhi keperluan kini tanpa menjejaskan masa depan", petunjuk: "sustainable development" },
    { soalan: "Apakah jejak karbon?", jawapan: "jumlah karbon dioksida yang dihasilkan aktiviti manusia", petunjuk: "carbon footprint" },
    { soalan: "Cara kurangkan jejak karbon?", jawapan: "guna tenaga boleh diperbaharui kurangkan pembaziran", petunjuk: "reduce carbon" },
    { soalan: "Cara pelihara alam sekitar?", jawapan: "kitar semula jimat tenaga dan air tanam pokok", petunjuk: "save environment" },
  ],
  "5:sains": [
    { soalan: "Apakah DNA?", jawapan: "bahan genetik dalam sel yang membawa maklumat pewarisan", petunjuk: "materi genetik" },
    { soalan: "Apakah gen?", jawapan: "unit pewarisan sifat", petunjuk: "unit heredity" },
    { soalan: "Beza pembiakan seks dan aseks.", jawapan: "seks dua induk aseks satu induk", petunjuk: "perbandingan" },
    { soalan: "Contoh pembiakan aseks.", jawapan: "keratan batang mencambah bertunas", petunjuk: "tumbuhan tanpa biji" },
    { soalan: "Apakah ekologi?", jawapan: "kajian hubungan organisma dengan persekitaran", petunjuk: "study of organisms and environment" },
    { soalan: "Apakah biodiversiti?", jawapan: "kepelbagaian spesies hidupan", petunjuk: "variety of life" },
    { soalan: "Ancaman kepada biodiversiti.", jawapan: "pembalakan haram pembangunan tanpa kawalan pemburuan", petunjuk: "ancaman alam" },
    { soalan: "Cara pelihara biodiversiti.", jawapan: "taman negara rizab alam kitar semula", petunjuk: "conservation methods" },
    { soalan: "Apakah kesan rumah hijau?", jawapan: "pemanasan bumi akibat gas rumah hijau", petunjuk: "greenhouse effect" },
    { soalan: "Contoh gas rumah hijau.", jawapan: "karbon dioksida metana wap air", petunjuk: "greenhouse gases" },
  ],
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.?]+$/g, "").replace(/\s+/g, " ");
}

function LatihanSubjekPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/latihan" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const isJawiD2 = darjahId === "2" && subjekId === "jawi";
  const isJawiD4 = darjahId === "4" && subjekId === "jawi";
  const isJawiD5 = darjahId === "5" && subjekId === "jawi";
  const isJawiD6 = darjahId === "6" && subjekId === "jawi";
  const isJawiMcq = isJawiD2 || isJawiD4 || isJawiD5 || isJawiD6;
  const isEnglish = subjekId === "bahasa-inggeris";

  const t = {
    memuatkan: isEnglish ? "Loading..." : "Memuatkan...",
    latihanBelumTersedia: isEnglish ? "Exercise not available" : "Latihan belum tersedia",
    kembali: isEnglish ? "Back" : "Kembali",
    kembaliKeAktiviti: isEnglish ? "Back to Activities" : "Kembali ke Aktiviti",
    latihanBertulis: isEnglish ? "Written Exercise" : "Latihan Bertulis",
    soalan: (n: number, total: number) => (isEnglish ? `Question ${n} / ${total}` : `Soalan ${n} / ${total}`),
    petunjuk: isEnglish ? "Hint" : "Petunjuk",
    tulisJawapan: isEnglish ? "Write your answer..." : "Tulis jawapan kamu...",
    semakJawapan: isEnglish ? "Check Answer" : "Semak Jawapan",
    betul: isEnglish ? "Correct! 🎉" : "Betul! 🎉",
    jawapanBetul: isEnglish ? "Correct answer" : "Jawapan betul",
    lihatKeputusan: isEnglish ? "View Results" : "Lihat Keputusan",
    soalanSeterusnya: isEnglish ? "Next Question →" : "Soalan Seterusnya →",
    syabas: isEnglish ? "Well Done! 🎉" : "Syabas! 🎉",
    kamuJawabBetul: (bintang: number, total: number) =>
      isEnglish
        ? `You answered correctly ${bintang} out of ${total} questions.`
        : `Kamu jawab betul ${bintang} daripada ${total} soalan.`,
    cubaLagi: isEnglish ? "Try Again" : "Cuba Lagi",
  };
  const soalanList = useMemo(() => (isJawiMcq ? [] : (BANK[`${darjahId}:${subjekId}`] ?? [])), [darjahId, subjekId, isJawiMcq]);
  const mcqList = isJawiD2 ? JAWI_D2_MCQ : isJawiD4 ? JAWI_D4_MCQ : isJawiD5 ? JAWI_D5_MCQ : isJawiD6 ? JAWI_D6_MCQ : [];
  const totalSoalan = isJawiMcq ? mcqList.length : soalanList.length;
  const [pilihan, setPilihan] = useState<number | null>(null);

  const [idx, setIdx] = useState(0);
  const [jwp, setJwp] = useState("");
  const [semak, setSemak] = useState<null | boolean>(null);
  const [bintang, setBintang] = useState(0);
  const [habis, setHabis] = useState(false);
  const [mulaMasa] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (habis && totalSoalan > 0) {
      simpanProgress({
        darjah: darjahId,
        subjek: subjekId,
        aktiviti: "latihan",
        markah: bintang,
        jumlahSoalan: totalSoalan,
        masaAmbil: Math.round((Date.now() - mulaMasa) / 1000),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t.memuatkan}</p>
      </div>
    );
  }

  if (!darjah || !subjek || totalSoalan === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">{t.latihanBelumTersedia}</h1>
          <Link to="/darjah/$darjahId/$subjekId" params={{ darjahId, subjekId }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> {t.kembali}
          </Link>
        </main>
      </div>
    );
  }

  const soalan = soalanList[idx];
  const mcq = mcqList[idx];

  function semakJawapan() {
    const nJwp = normalize(jwp);
    const nCorrect = normalize(soalan.jawapan);
    const betul =
      nJwp.length > 0 &&
      (nJwp === nCorrect ||
        nCorrect.startsWith(nJwp) ||
        nJwp.includes(nCorrect));
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
          <ArrowLeft className="h-4 w-4" /> {t.kembaliKeAktiviti}
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground shadow-soft"
            style={isJawiMcq ? { background: "#1B8A5A" } : undefined}
          >
            <PenLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">{t.latihanBertulis}</h1>
            <p className="text-sm text-muted-foreground">
              <Link to="/darjah/$darjahId" params={{ darjahId }} className="hover:underline hover:text-primary transition">{darjah.label}</Link>
              {" • "}
              <Link to="/darjah/$darjahId/$subjekId" params={{ darjahId, subjekId }} className="hover:underline hover:text-primary transition">{subjek.title}</Link>
            </p>
          </div>
        </div>

        {!habis ? (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-xs font-bold text-muted-foreground">
              {t.soalan(idx + 1, totalSoalan)}
            </div>

            {isJawiMcq ? (
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
                  <p className="mt-2 text-sm text-muted-foreground italic">{t.petunjuk}: {soalan.petunjuk}</p>
                )}

                <input
                  value={jwp}
                  onChange={(e) => setJwp(e.target.value)}
                  disabled={semak !== null}
                  placeholder={t.tulisJawapan}
                  className="mt-5 w-full rounded-2xl border-2 border-input bg-background p-4 font-display text-xl font-extrabold text-foreground outline-none transition focus:border-primary disabled:opacity-70"
                />

                {semak === null && (
                  <button
                    onClick={semakJawapan}
                    disabled={jwp.trim().length === 0}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" /> {t.semakJawapan}
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
                    ? t.betul
                    : isJawiMcq
                      ? `${t.jawapanBetul}: ${mcq.pilihan[mcq.betul]}`
                      : `${t.jawapanBetul}: ${soalan.jawapan}`}
                </div>
                <button
                  onClick={seterusnya}
                  style={{ background: "#1B8A5A" }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-lg font-extrabold text-white shadow-soft"
                >
                  {idx + 1 >= totalSoalan ? t.lihatKeputusan : t.soalanSeterusnya}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
            <Sparkles className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">{t.syabas}</h2>
            <p className="mt-2 text-muted-foreground">
              {t.kamuJawabBetul(bintang, totalSoalan)}
            </p>
            <div className="mt-4 flex justify-center">
              <StarReward earned={Math.min(3, Math.ceil((bintang / totalSoalan) * 3))} />
            </div>
            <button
              onClick={ulang}
              className="mt-5 rounded-full bg-card px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
            >
              {t.cubaLagi}
            </button>
          </div>
        )}
      </main>
    </div>
  );

}
