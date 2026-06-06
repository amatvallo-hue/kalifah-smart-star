import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Gamepad2, Send, Sparkles, Timer, Trophy, Search, CheckSquare, Link2, AlignLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { CariPerkataan, BM_DARJAH1_WORDS, BM_DARJAH1_CLUES, BM_DARJAH2_WORDS, BM_DARJAH2_CLUES, BM_DARJAH3_WORDS, BM_DARJAH3_CLUES, BM_DARJAH4_WORDS, BM_DARJAH4_CLUES, BM_DARJAH5_WORDS, BM_DARJAH5_CLUES, BM_DARJAH6_WORDS, BM_DARJAH6_CLUES, BI_DARJAH1_WORDS, BI_DARJAH1_CLUES, BI_DARJAH2_WORDS, BI_DARJAH2_CLUES, BI_DARJAH3_WORDS, BI_DARJAH3_CLUES, BI_DARJAH4_WORDS, BI_DARJAH4_CLUES, BI_DARJAH5_WORDS, BI_DARJAH5_CLUES, BI_DARJAH6_WORDS, BI_DARJAH6_CLUES, JAWI_DARJAH1_WORDS, JAWI_DARJAH1_CLUES, JAWI_DARJAH2_WORDS, JAWI_DARJAH2_CLUES, JAWI_DARJAH3_WORDS, JAWI_DARJAH3_CLUES, JAWI_DARJAH4_WORDS, JAWI_DARJAH4_CLUES, JAWI_DARJAH5_WORDS, JAWI_DARJAH5_CLUES, JAWI_DARJAH6_WORDS, JAWI_DARJAH6_CLUES, PI_DARJAH1_WORDS, PI_DARJAH1_CLUES, PI_DARJAH2_WORDS, PI_DARJAH2_CLUES, PI_DARJAH3_WORDS, PI_DARJAH3_CLUES, PI_DARJAH4_WORDS, PI_DARJAH4_CLUES, PI_DARJAH5_WORDS, PI_DARJAH5_CLUES, PI_DARJAH6_WORDS, PI_DARJAH6_CLUES, SAINS_DARJAH1_WORDS, SAINS_DARJAH1_CLUES, SAINS_DARJAH2_WORDS, SAINS_DARJAH2_CLUES, SAINS_DARJAH4_WORDS, SAINS_DARJAH4_CLUES, SAINS_DARJAH5_WORDS, SAINS_DARJAH5_CLUES, SAINS_DARJAH6_WORDS, SAINS_DARJAH6_CLUES, MATE_DARJAH2_WORDS, MATE_DARJAH2_CLUES, MATE_DARJAH3_WORDS, MATE_DARJAH3_CLUES, MATE_DARJAH4_WORDS, MATE_DARJAH4_CLUES, MATE_DARJAH5_WORDS, MATE_DARJAH5_CLUES, MATE_DARJAH6_WORDS, MATE_DARJAH6_CLUES } from "@/components/CariPerkataan";
import { BetulSalahGame } from "@/components/games/BetulSalahGame";
import { PadankanJawapanGame } from "@/components/games/PadankanJawapanGame";
import { SusunAyatGame } from "@/components/games/SusunAyatGame";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/game")({
  head: () => ({ meta: [{ title: "Quiz Race — Kalifah.my" }] }),
  ssr: false,
  component: GameSubjekPage,
});

type Soalan = { soalan: string; jawapan: string; options?: string[] };

const BANK: Record<string, Soalan[]> = {
  "1:matematik": [
    { soalan: "3 + 4 = ?", jawapan: "7" },
    { soalan: "10 - 3 = ?", jawapan: "7" },
    { soalan: "5 + 5 = ?", jawapan: "10" },
    { soalan: "8 - 4 = ?", jawapan: "4" },
    { soalan: "Nombor selepas 7?", jawapan: "8" },
    { soalan: "Nombor sebelum 10?", jawapan: "9" },
    { soalan: "Bentuk 3 sisi = ?", jawapan: "Segitiga" },
    { soalan: "Siti 4 guli + Abu 5 guli = ?", jawapan: "9" },
    { soalan: "10 oren - 3 = ?", jawapan: "7" },
    { soalan: "1, 2, 3, ___, 5 = ?", jawapan: "4" },
  ],
  "1:bahasa-melayu": [
    { soalan: "Huruf vokal ialah?", jawapan: "C", options: ["A) b", "B) c", "C) a", "D) d"] },
    { soalan: "'bu' + 'nga' = ?", jawapan: "B", options: ["A) bunag", "B) bunga", "C) gabung", "D) buag"] },
    { soalan: "Haiwan ini 🐱?", jawapan: "C", options: ["A) anjing", "B) arnab", "C) kucing", "D) harimau"] },
    { soalan: "Lawan 'besar' ialah?", jawapan: "C", options: ["A) tinggi", "B) panjang", "C) kecil", "D) lebar"] },
    { soalan: "Ejaan betul?", jawapan: "C", options: ["A) kocing", "B) kuching", "C) kucing", "D) kusing"] },
    { soalan: "Suku kata 'bola'?", jawapan: "B", options: ["A) 1", "B) 2", "C) 3", "D) 4"] },
    { soalan: "'ku' + 'cing' = ?", jawapan: "B", options: ["A) kucng", "B) kucing", "C) kuing", "D) kucig"] },
    { soalan: "Lawan 'panas' ialah?", jawapan: "A", options: ["A) sejuk", "B) panjang", "C) besar", "D) tinggi"] },
    { soalan: "Huruf 'u' ialah?", jawapan: "B", options: ["A) konsonan", "B) vokal", "C) nombor", "D) simbol"] },
    { soalan: "Pilih ayat betul:", jawapan: "B", options: ["A) Makan saya nasi", "B) Saya makan nasi", "C) Nasi saya makan", "D) Saya nasi makan"] },
  ],
  "1:bahasa-inggeris": [
    { soalan: "What is this? 🐱", jawapan: "C", options: ["A) dog", "B) rabbit", "C) cat", "D) bird"] },
    { soalan: "Which is a vowel?", jawapan: "C", options: ["A) b", "B) c", "C) o", "D) d"] },
    { soalan: "Opposite of 'big'?", jawapan: "C", options: ["A) tall", "B) long", "C) small", "D) wide"] },
    { soalan: "What colour is sky?", jawapan: "D", options: ["A) red", "B) green", "C) yellow", "D) blue"] },
    { soalan: "Morning greeting?", jawapan: "C", options: ["A) Good night", "B) Good evening", "C) Good morning", "D) Good afternoon"] },
    { soalan: "Which word starts with S?", jawapan: "D", options: ["A) tree", "B) frog", "C) hat", "D) sun"] },
    { soalan: "I ___ a student.", jawapan: "C", options: ["A) is", "B) are", "C) am", "D) be"] },
    { soalan: "What do we use to write?", jawapan: "C", options: ["A) ruler", "B) eraser", "C) pencil", "D) scissors"] },
    { soalan: "What is this? 🐘", jawapan: "C", options: ["A) lion", "B) giraffe", "C) elephant", "D) horse"] },
    { soalan: "What do you say after receiving?", jawapan: "C", options: ["A) Sorry", "B) Please", "C) Thank you", "D) Excuse me"] },
  ],
  "1:jawi": [
    { soalan: "Huruf Jawi → ا ialah?", jawapan: "C", options: ["A) Ba", "B) Ta", "C) Alif", "D) Jim"] },
    { soalan: "Huruf Jawi → ب ialah?", jawapan: "B", options: ["A) Alif", "B) Ba", "C) Ta", "D) Tha"] },
    { soalan: "Huruf berbunyi S ialah?", jawapan: "C", options: ["A) ش", "B) ز", "C) س", "D) ص"] },
    { soalan: "Jawi → اِبُو bermaksud?", jawapan: "B", options: ["A) abang", "B) ibu", "C) adik", "D) ayah"] },
    { soalan: "Jawi → اَيَه bermaksud?", jawapan: "C", options: ["A) ibu", "B) abang", "C) ayah", "D) kakak"] },
    { soalan: "Jawi → كُوچيڠ bermaksud?", jawapan: "C", options: ["A) anjing", "B) arnab", "C) kucing", "D) harimau"] },
    { soalan: "Huruf berbunyi R ialah?", jawapan: "B", options: ["A) د", "B) ر", "C) ز", "D) و"] },
    { soalan: "Huruf berbunyi K ialah?", jawapan: "C", options: ["A) ق", "B) غ", "C) ک", "D) خ"] },
    { soalan: "Jawi → بُکُو bermaksud?", jawapan: "C", options: ["A) pen", "B) meja", "C) buku", "D) kerusi"] },
    { soalan: "Jawi → رومه bermaksud?", jawapan: "C", options: ["A) sekolah", "B) masjid", "C) rumah", "D) kedai"] },
  ],
  "1:pendidikan-islam": [
    { soalan: "Berapa rukun Islam?", jawapan: "C", options: ["A) 3", "B) 4", "C) 5", "D) 6"] },
    { soalan: "Berapa kali solat sehari?", jawapan: "C", options: ["A) 3", "B) 4", "C) 5", "D) 6"] },
    { soalan: "Ucapan bila berjumpa seseorang?", jawapan: "C", options: ["A) Terima kasih", "B) Selamat pagi", "C) Assalamualaikum", "D) Hai"] },
    { soalan: "Jawapan kepada salam?", jawapan: "C", options: ["A) Assalamualaikum", "B) Alhamdulillah", "C) Waalaikumussalam", "D) Bismillah"] },
    { soalan: "Kita baca bismillah sebelum?", jawapan: "C", options: ["A) tidur", "B) bermain", "C) makan", "D) berlari"] },
    { soalan: "Berapa rakaat solat Subuh?", jawapan: "B", options: ["A) 1", "B) 2", "C) 3", "D) 4"] },
    { soalan: "Adab makan yang betul?", jawapan: "D", options: ["A) tangan kiri", "B) berdiri", "C) berlari", "D) tangan kanan"] },
    { soalan: "Kitab suci umat Islam?", jawapan: "D", options: ["A) Injil", "B) Zabur", "C) Taurat", "D) Al-Quran"] },
    { soalan: "Nabi kita ialah?", jawapan: "D", options: ["A) Nabi Isa", "B) Nabi Musa", "C) Nabi Ibrahim", "D) Nabi Muhammad SAW"] },
    { soalan: "Ucapan bila bersin?", jawapan: "C", options: ["A) diam sahaja", "B) ketawa", "C) Alhamdulillah", "D) lari"] },
  ],
  "1:sains": [
    { soalan: "Berapa deria yang kita ada?", jawapan: "C", options: ["A) 3", "B) 4", "C) 5", "D) 6"] },
    { soalan: "Deria untuk melihat?", jawapan: "C", options: ["A) hidung", "B) telinga", "C) mata", "D) tangan"] },
    { soalan: "Manakah haiwan?", jawapan: "C", options: ["A) pokok", "B) bunga", "C) kucing", "D) rumput"] },
    { soalan: "Haiwan yang boleh terbang?", jawapan: "C", options: ["A) ikan", "B) arnab", "C) burung", "D) kucing"] },
    { soalan: "Bahagian tumbuhan serap air?", jawapan: "D", options: ["A) daun", "B) batang", "C) bunga", "D) akar"] },
    { soalan: "Air jadi wap apabila?", jawapan: "B", options: ["A) dibekukan", "B) dipanaskan", "C) didinginkan", "D) dicampur gula"] },
    { soalan: "Sumber cahaya semula jadi?", jawapan: "C", options: ["A) lampu", "B) lilin", "C) matahari", "D) suluh"] },
    { soalan: "Ais terdedah haba akan?", jawapan: "C", options: ["A) membeku", "B) membesar", "C) cair", "D) mengeras"] },
    { soalan: "Langit berawan gelap bermakna?", jawapan: "C", options: ["A) panas terik", "B) berangin", "C) akan hujan", "D) bersalji"] },
    { soalan: "Makanan arnab ialah?", jawapan: "C", options: ["A) daging", "B) ikan", "C) sayur dan wortel", "D) buah sahaja"] },
  ],
  "2:bahasa-melayu": [
    { soalan: "Antonim 'rajin'?", jawapan: "B", options: ["A) pandai", "B) malas", "C) sihat", "D) kuat"] },
    { soalan: "Sinonim 'gembira'?", jawapan: "C", options: ["A) sedih", "B) marah", "C) suka", "D) takut"] },
    { soalan: "Kata nama dalam ayat?", jawapan: "D", options: ["A) berlari", "B) cantik", "C) dengan", "D) meja"] },
    { soalan: "Kata kerja ialah?", jawapan: "C", options: ["A) meja", "B) cantik", "C) berlari", "D) dengan"] },
    { soalan: "Kata adjektif ialah?", jawapan: "C", options: ["A) berlari", "B) meja", "C) cantik", "D) dengan"] },
    { soalan: "Kata hubung ialah?", jawapan: "D", options: ["A) meja", "B) cantik", "C) berlari", "D) dan"] },
    { soalan: "Kata sendi nama ialah?", jawapan: "B", options: ["A) berlari", "B) di", "C) cantik", "D) meja"] },
    { soalan: "Imbuhan dalam 'berlari'?", jawapan: "A", options: ["A) ber", "B) lari", "C) ri", "D) berl"] },
    { soalan: "Imbuhan dalam 'pemimpin'?", jawapan: "B", options: ["A) pe", "B) pem", "C) mimpin", "D) in"] },
    { soalan: "Antonim 'besar'?", jawapan: "C", options: ["A) tinggi", "B) panjang", "C) kecil", "D) lebar"] },
  ],
  "2:matematik": [
    { soalan: "25 + 37 = ?", jawapan: "B", options: ["A) 52", "B) 62", "C) 72", "D) 82"] },
    { soalan: "84 - 46 = ?", jawapan: "B", options: ["A) 28", "B) 38", "C) 48", "D) 58"] },
    { soalan: "6 × 3 = ?", jawapan: "C", options: ["A) 12", "B) 15", "C) 18", "D) 21"] },
    { soalan: "8 × 4 = ?", jawapan: "C", options: ["A) 24", "B) 28", "C) 32", "D) 36"] },
    { soalan: "20 ÷ 4 = ?", jawapan: "C", options: ["A) 3", "B) 4", "C) 5", "D) 6"] },
    { soalan: "7 × 5 = ?", jawapan: "B", options: ["A) 30", "B) 35", "C) 40", "D) 45"] },
    { soalan: "48 ÷ 8 = ?", jawapan: "C", options: ["A) 4", "B) 5", "C) 6", "D) 7"] },
    { soalan: "9 × 6 = ?", jawapan: "B", options: ["A) 48", "B) 54", "C) 60", "D) 66"] },
    { soalan: "56 ÷ 7 = ?", jawapan: "C", options: ["A) 6", "B) 7", "C) 8", "D) 9"] },
    { soalan: "100 - 45 = ?", jawapan: "B", options: ["A) 45", "B) 55", "C) 65", "D) 75"] },
  ],
  "2:bahasa-inggeris": [
    { soalan: "Plural of cat?", jawapan: "A", options: ["A) cats", "B) cates", "C) caties", "D) catss"] },
    { soalan: "Plural of box?", jawapan: "B", options: ["A) boxs", "B) boxes", "C) boxies", "D) boxess"] },
    { soalan: "Plural of child?", jawapan: "C", options: ["A) childs", "B) childes", "C) children", "D) childrens"] },
    { soalan: "Past tense of run?", jawapan: "C", options: ["A) runned", "B) runs", "C) ran", "D) running"] },
    { soalan: "Past tense of eat?", jawapan: "D", options: ["A) eated", "B) eats", "C) eating", "D) ate"] },
    { soalan: "Past tense of go?", jawapan: "C", options: ["A) goed", "B) goes", "C) went", "D) going"] },
    { soalan: "Past tense of play?", jawapan: "C", options: ["A) plaied", "B) playes", "C) played", "D) playing"] },
    { soalan: "Choose the adjective:", jawapan: "C", options: ["A) run", "B) quickly", "C) beautiful", "D) and"] },
    { soalan: "Choose the verb:", jawapan: "C", options: ["A) beautiful", "B) quickly", "C) swim", "D) and"] },
    { soalan: "Opposite of happy?", jawapan: "B", options: ["A) angry", "B) sad", "C) scared", "D) tired"] },
  ],
  "2:jawi": [
    { soalan: "Ejaan Jawi bagi sekolah?", jawapan: "B", options: ["A)سکوله", "B)سکول", "C)سکولا", "D)سکولة"] },
    { soalan: "Ejaan Jawi bagi keluarga?", jawapan: "B", options: ["A)كلوارگ", "B)كلوارگا", "C)كلورگا", "D)كلواگا"] },
    { soalan: "Ejaan Jawi bagi Malaysia?", jawapan: "A", options: ["A)مليسيا", "B)ملايسيا", "C)ملاسيا", "D)ماليسيا"] },
    { soalan: "Huruf Jawi ڠ berbunyi?", jawapan: "A", options: ["A)nga", "B)ga", "C)na", "D)ma"] },
    { soalan: "Huruf Jawi چ berbunyi?", jawapan: "B", options: ["A)ja", "B)cha", "C)sha", "D)za"] },
    { soalan: "Huruf Jawi ڤ berbunyi?", jawapan: "C", options: ["A)ba", "B)fa", "C)pa", "D)wa"] },
    { soalan: "Jawi گورو bermaksud?", jawapan: "B", options: ["A)pelajar", "B)guru", "C)doktor", "D)polis"] },
    { soalan: "Jawi ڤليجر bermaksud?", jawapan: "C", options: ["A)guru", "B)doktor", "C)pelajar", "D)polis"] },
    { soalan: "Jawi برلاري bermaksud?", jawapan: "B", options: ["A)berjalan", "B)berlari", "C)berenang", "D)bermain"] },
    { soalan: "Tulisan Jawi dibaca dari arah?", jawapan: "B", options: ["A)kiri ke kanan", "B)kanan ke kiri", "C)atas ke bawah", "D)bawah ke atas"] },
  ],
  "2:pendidikan-islam": [
    { soalan: "Rasul terakhir ialah?", jawapan: "D", options: ["A)Nabi Isa", "B)Nabi Musa", "C)Nabi Ibrahim", "D)Nabi Muhammad SAW"] },
    { soalan: "Kitab Nabi Muhammad SAW?", jawapan: "D", options: ["A)Zabur", "B)Taurat", "C)Injil", "D)Al-Quran"] },
    { soalan: "Kitab Nabi Musa?", jawapan: "B", options: ["A)Zabur", "B)Taurat", "C)Injil", "D)Al-Quran"] },
    { soalan: "Malaikat menyampaikan wahyu?", jawapan: "C", options: ["A)Mikail", "B)Izrail", "C)Jibril", "D)Israfil"] },
    { soalan: "Malaikat mencabut nyawa?", jawapan: "B", options: ["A)Mikail", "B)Izrail", "C)Jibril", "D)Israfil"] },
    { soalan: "Malaikat meniup sangkakala?", jawapan: "D", options: ["A)Mikail", "B)Izrail", "C)Jibril", "D)Israfil"] },
    { soalan: "Sifat Wujud bermaksud?", jawapan: "C", options: ["A)Kekal", "B)Maha Esa", "C)Ada", "D)Sedia Ada"] },
    { soalan: "Sifat Baqa bermaksud?", jawapan: "A", options: ["A)Kekal", "B)Maha Esa", "C)Ada", "D)Sedia Ada"] },
    { soalan: "Jumlah Nabi dan Rasul wajib diketahui?", jawapan: "B", options: ["A)20", "B)25", "C)30", "D)35"] },
    { soalan: "Surah Al-Fatihah ada berapa ayat?", jawapan: "C", options: ["A)5", "B)6", "C)7", "D)8"] },
  ],
  "2:sains": [
    { soalan: "Proses tumbuhan buat makanan?", jawapan: "B", options: ["A)Respirasi", "B)Fotosintesis", "C)Evaporasi", "D)Kondensasi"] },
    { soalan: "Gas dihasilkan semasa fotosintesis?", jawapan: "C", options: ["A)Karbon dioksida", "B)Nitrogen", "C)Oksigen", "D)Hidrogen"] },
    { soalan: "Tiga keadaan jirim?", jawapan: "B", options: ["A)pepejal cecair wap", "B)pepejal cecair gas", "C)pepejal gas wap", "D)cecair gas wap"] },
    { soalan: "Contoh pepejal?", jawapan: "C", options: ["A)air", "B)udara", "C)batu", "D)wap"] },
    { soalan: "Contoh cecair?", jawapan: "C", options: ["A)batu", "B)kayu", "C)air", "D)besi"] },
    { soalan: "Contoh gas?", jawapan: "D", options: ["A)batu", "B)kayu", "C)air", "D)udara"] },
    { soalan: "Pepejal dipanaskan akan?", jawapan: "B", options: ["A)membeku", "B)melebur", "C)menyejat", "D)memampat"] },
    { soalan: "Haiwan bertelur dipanggil?", jawapan: "C", options: ["A)mamalia", "B)reptilia", "C)ovipar", "D)vivipar"] },
    { soalan: "Magnet menarik benda dari?", jawapan: "C", options: ["A)kayu", "B)plastik", "C)besi", "D)kaca"] },
    { soalan: "Cahaya bergerak dalam garis?", jawapan: "B", options: ["A)bengkok", "B)lurus", "C)melengkung", "D)zigzag"] },
  ],
  "3:bahasa-melayu": [
    { soalan: "Ayat pasif?", jawapan: "B", options: ["A) Ali membaca buku", "B) Buku dibaca oleh Ali", "C) Buku membaca Ali", "D) Ali buku membaca"] },
    { soalan: "Kata adjektif?", jawapan: "C", options: ["A) berlari", "B) dengan", "C) indah", "D) meja"] },
    { soalan: "Kata kerja transitif?", jawapan: "C", options: ["A) tidur", "B) berlari", "C) memukul", "D) duduk"] },
    { soalan: "Sinonim indah?", jawapan: "C", options: ["A) hodoh", "B) buruk", "C) cantik", "D) kotor"] },
    { soalan: "Antonim rajin?", jawapan: "B", options: ["A) pandai", "B) malas", "C) sihat", "D) kuat"] },
    { soalan: "Kata nama abstrak?", jawapan: "C", options: ["A) meja", "B) kucing", "C) kasih sayang", "D) buku"] },
    { soalan: "Imbuhan dalam kebersihan?", jawapan: "A", options: ["A) ke...an", "B) ke", "C) an", "D) bersih"] },
    { soalan: "Kata ulang budak?", jawapan: "B", options: ["A) budak budak", "B) budak-budak", "C) budakbudak", "D) budaks"] },
    { soalan: "Maksud bersatu teguh bercerai roboh?", jawapan: "B", options: ["A) Perpecahan kuat", "B) Perpaduan kuat", "C) Bergaduh baik", "D) Bersatu susah"] },
    { soalan: "Perkataan majmuk betul?", jawapan: "B", options: ["A) jalanraya", "B) jalan raya", "C) jalan-raya", "D) jalan_raya"] },
  ],
  "3:matematik": [
    { soalan: "234 + 567 = ?", jawapan: "B", options: ["A) 791", "B) 801", "C) 811", "D) 821"] },
    { soalan: "856 - 378 = ?", jawapan: "B", options: ["A) 468", "B) 478", "C) 488", "D) 498"] },
    { soalan: "7 × 8 = ?", jawapan: "B", options: ["A) 54", "B) 56", "C) 58", "D) 60"] },
    { soalan: "72 ÷ 8 = ?", jawapan: "C", options: ["A) 7", "B) 8", "C) 9", "D) 10"] },
    { soalan: "63 ÷ 7 = ?", jawapan: "C", options: ["A) 7", "B) 8", "C) 9", "D) 10"] },
    { soalan: "Bundarkan 456 ke ratus?", jawapan: "C", options: ["A) 400", "B) 450", "C) 500", "D) 460"] },
    { soalan: "1/2 + 1/4 = ?", jawapan: "C", options: ["A) 1/6", "B) 2/6", "C) 3/4", "D) 2/4"] },
    { soalan: "0.5 + 0.3 = ?", jawapan: "B", options: ["A) 0.7", "B) 0.8", "C) 0.9", "D) 1.0"] },
    { soalan: "Luas 6cm × 4cm = ?", jawapan: "B", options: ["A) 20cm²", "B) 24cm²", "C) 28cm²", "D) 32cm²"] },
    { soalan: "Perimeter 3+4+5 cm = ?", jawapan: "B", options: ["A) 10cm", "B) 12cm", "C) 14cm", "D) 16cm"] },
  ],
  "3:bahasa-inggeris": [
    { soalan: "Correct sentence?", jawapan: "B", options: ["A) She go to market", "B) She goes to market", "C) She going to market", "D) She gone to market"] },
    { soalan: "Past tense of 'write'?", jawapan: "D", options: ["A) writed", "B) writes", "C) written", "D) wrote"] },
    { soalan: "Plural of 'leaf'?", jawapan: "C", options: ["A) leafs", "B) leafes", "C) leaves", "D) leafies"] },
    { soalan: "Choose adjective:", jawapan: "C", options: ["A) run", "B) book", "C) beautiful", "D) and"] },
    { soalan: "Choose adverb:", jawapan: "B", options: ["A) beautiful", "B) quickly", "C) swim", "D) table"] },
    { soalan: "I ___ reading a book now.", jawapan: "A", options: ["A) am", "B) is", "C) are", "D) be"] },
    { soalan: "She ___ to school yesterday.", jawapan: "C", options: ["A) go", "B) goes", "C) went", "D) going"] },
    { soalan: "Synonym of 'happy'?", jawapan: "C", options: ["A) sad", "B) angry", "C) joyful", "D) tired"] },
    { soalan: "Antonym of 'brave'?", jawapan: "C", options: ["A) bold", "B) fearless", "C) cowardly", "D) strong"] },
    { soalan: "Example of simile?", jawapan: "B", options: ["A) The cat runs", "B) She is as fast as a cheetah", "C) He runs quickly", "D) The flower is beautiful"] },
  ],
  "3:jawi": [
    { soalan: "Ejaan Jawi 'perpustakaan'?", jawapan: "A", options: ["A) ڤرڤوستاکان", "B) ڤرڤستاکان", "C) ڤرڤوسطاکان", "D) ڤرڤستکان"] },
    { soalan: "Ejaan Jawi 'kemerdekaan'?", jawapan: "C", options: ["A) کمرديکان", "B) کمردیکاءن", "C) کمرديکاءن", "D) کيمرديکان"] },
    { soalan: "Ejaan Jawi 'pembelajaran'?", jawapan: "B", options: ["A) ڤمبلاجرن", "B) ڤمبلاجاران", "C) ڤيمبلاجاران", "D) ڤمبلجران"] },
    { soalan: "Huruf Jawi ڬ berbunyi?", jawapan: "B", options: ["A) ka", "B) ga", "C) ha", "D) na"] },
    { soalan: "Huruf Jawi ۏ berbunyi?", jawapan: "B", options: ["A) wa", "B) va", "C) fa", "D) ba"] },
    { soalan: "Jawi مدرسة bermaksud?", jawapan: "C", options: ["A) rumah", "B) masjid", "C) sekolah", "D) kedai"] },
    { soalan: "Jawi معلم bermaksud?", jawapan: "B", options: ["A) pelajar", "B) guru", "C) doktor", "D) polis"] },
    { soalan: "Jawi كتاب bermaksud?", jawapan: "C", options: ["A) pen", "B) meja", "C) buku", "D) kerusi"] },
    { soalan: "Berapa huruf Jawi asas?", jawapan: "C", options: ["A) 26", "B) 28", "C) 30", "D) 32"] },
    { soalan: "Berapa huruf tambahan Jawi?", jawapan: "C", options: ["A) 4", "B) 5", "C) 6", "D) 7"] },
  ],
  "3:pendidikan-islam": [
    { soalan: "Jumlah nabi & rasul wajib diketahui?", jawapan: "B", options: ["A) 20", "B) 25", "C) 30", "D) 35"] },
    { soalan: "Nabi diutus kepada kaum Ad?", jawapan: "B", options: ["A) Nabi Nuh", "B) Nabi Hud", "C) Nabi Soleh", "D) Nabi Lut"] },
    { soalan: "Kitab Zabur diturunkan kepada?", jawapan: "C", options: ["A) Nabi Musa", "B) Nabi Isa", "C) Nabi Daud", "D) Nabi Muhammad"] },
    { soalan: "Tugas malaikat Jibril?", jawapan: "B", options: ["A) menurunkan hujan", "B) menyampaikan wahyu", "C) mencabut nyawa", "D) meniup sangkakala"] },
    { soalan: "Sifat Wujud bermaksud?", jawapan: "B", options: ["A) Kekal", "B) Ada", "C) Maha Esa", "D) Sedia Ada"] },
    { soalan: "Surah Al-Fatihah ada berapa ayat?", jawapan: "C", options: ["A) 5", "B) 6", "C) 7", "D) 8"] },
    { soalan: "Solat Jumaat wajib bagi?", jawapan: "B", options: ["A) semua orang", "B) lelaki Islam baligh", "C) perempuan Islam", "D) kanak-kanak"] },
    { soalan: "Bulan puasa ialah?", jawapan: "C", options: ["A) Syawal", "B) Zulhijjah", "C) Ramadan", "D) Muharram"] },
    { soalan: "Sifat mahmudah contohnya?", jawapan: "C", options: ["A) dengki", "B) sombong", "C) jujur", "D) bakhil"] },
    { soalan: "Kaabah terletak di?", jawapan: "C", options: ["A) Madinah", "B) Palestin", "C) Makkah", "D) Taif"] },
  ],
  "3:sains": [
    { soalan: "Proses tumbuhan buat makanan?", jawapan: "B", options: ["A) Respirasi", "B) Fotosintesis", "C) Evaporasi", "D) Kondensasi"] },
    { soalan: "Tiga keadaan jirim?", jawapan: "B", options: ["A) pepejal cecair wap", "B) pepejal cecair gas", "C) pepejal gas wap", "D) cecair gas wap"] },
    { soalan: "Haiwan bertelur dipanggil?", jawapan: "C", options: ["A) mamalia", "B) reptilia", "C) ovipar", "D) vivipar"] },
    { soalan: "Haiwan melahirkan anak?", jawapan: "D", options: ["A) mamalia", "B) reptilia", "C) ovipar", "D) vivipar"] },
    { soalan: "Magnet menarik benda dari?", jawapan: "C", options: ["A) kayu", "B) plastik", "C) besi", "D) kaca"] },
    { soalan: "Berapa planet sistem suria?", jawapan: "B", options: ["A) 7", "B) 8", "C) 9", "D) 10"] },
    { soalan: "Gas diserap semasa fotosintesis?", jawapan: "C", options: ["A) Oksigen", "B) Nitrogen", "C) Karbon dioksida", "D) Hidrogen"] },
    { soalan: "Rantaian makanan bermula dengan?", jawapan: "B", options: ["A) haiwan", "B) tumbuhan", "C) manusia", "D) bakteria"] },
    { soalan: "Gerhana matahari berlaku?", jawapan: "A", options: ["A) bumi masuk bayang bulan", "B) bulan masuk bayang bumi", "C) matahari hilang", "D) bumi berhenti berputar"] },
    { soalan: "Pemanasan global disebabkan?", jawapan: "C", options: ["A) lebih pokok", "B) lebih hujan", "C) gas rumah hijau", "D) lebih angin"] },
  ],
  "4:bahasa-melayu": [
    { soalan: "Apakah ayat majmuk?", jawapan: "B", options: ["A) Ayat tunggal", "B) Gabungan dua ayat atau lebih", "C) Ayat pendek", "D) Ayat panjang"] },
    { soalan: "Pilih ayat majmuk:", jawapan: "B", options: ["A) Ali pergi ke sekolah", "B) Ali pergi ke sekolah dan Abu duduk", "C) Ali dan Abu", "D) Pergi ke sekolah"] },
    { soalan: "Kata sendi nama?", jawapan: "C", options: ["A) dan", "B) tetapi", "C) di", "D) cantik"] },
    { soalan: "Kata tanya?", jawapan: "D", options: ["A) dan", "B) tetapi", "C) di", "D) siapa"] },
    { soalan: "Maksud 'air di daun keladi'?", jawapan: "B", options: ["A) Tidak bertanggungjawab", "B) Tidak kekal", "C) Sangat setia", "D) Sangat rajin"] },
    { soalan: "Kata penguat?", jawapan: "A", options: ["A) sangat", "B) dan", "C) di", "D) berlari"] },
    { soalan: "Apakah pantun?", jawapan: "B", options: ["A) Puisi bebas", "B) Puisi tradisional 4 baris", "C) Cerita panjang", "D) Dialog"] },
    { soalan: "Kata nafi?", jawapan: "B", options: ["A) sangat", "B) tidak", "C) di", "D) dan"] },
    { soalan: "Apakah dialog?", jawapan: "B", options: ["A) Cerita pendek", "B) Perbualan dua orang atau lebih", "C) Puisi", "D) Pantun"] },
    { soalan: "Kata bilangan?", jawapan: "C", options: ["A) cantik", "B) berlari", "C) tiga orang", "D) di"] },
  ],
  "4:matematik": [
    { soalan: "2345 + 3456 = ?", jawapan: "B", options: ["A) 5791", "B) 5801", "C) 5811", "D) 5821"] },
    { soalan: "8765 - 4321 = ?", jawapan: "C", options: ["A) 4334", "B) 4344", "C) 4444", "D) 4454"] },
    { soalan: "12 × 8 = ?", jawapan: "B", options: ["A) 86", "B) 96", "C) 106", "D) 116"] },
    { soalan: "144 ÷ 12 = ?", jawapan: "C", options: ["A) 10", "B) 11", "C) 12", "D) 13"] },
    { soalan: "3/4 - 1/2 = ?", jawapan: "A", options: ["A) 1/4", "B) 2/4", "C) 1/2", "D) 2/2"] },
    { soalan: "0.75 + 0.25 = ?", jawapan: "B", options: ["A) 0.9", "B) 1.0", "C) 1.1", "D) 1.2"] },
    { soalan: "Luas 12cm × 8cm = ?", jawapan: "C", options: ["A) 80cm²", "B) 86cm²", "C) 96cm²", "D) 106cm²"] },
    { soalan: "Perimeter 12cm × 8cm = ?", jawapan: "B", options: ["A) 36cm", "B) 40cm", "C) 44cm", "D) 48cm"] },
    { soalan: "Sudut tegak berapa darjah?", jawapan: "B", options: ["A) 45", "B) 90", "C) 180", "D) 360"] },
    { soalan: "25 × 4 = ?", jawapan: "C", options: ["A) 90", "B) 95", "C) 100", "D) 105"] },
  ],
  "4:bahasa-inggeris": [
    { soalan: "What is a compound sentence?", jawapan: "B", options: ["A) One main clause", "B) Two or more main clauses joined", "C) A short sentence", "D) A long sentence"] },
    { soalan: "Present continuous tense?", jawapan: "C", options: ["A) I eat", "B) I ate", "C) I am eating", "D) I will eat"] },
    { soalan: "She ___ singing now.", jawapan: "B", options: ["A) am", "B) is", "C) are", "D) be"] },
    { soalan: "They ___ playing now.", jawapan: "C", options: ["A) am", "B) is", "C) are", "D) be"] },
    { soalan: "Choose pronoun:", jawapan: "C", options: ["A) book", "B) run", "C) she", "D) quickly"] },
    { soalan: "Synonym of angry?", jawapan: "B", options: ["A) happy", "B) furious", "C) sad", "D) tired"] },
    { soalan: "Antonym of ancient?", jawapan: "B", options: ["A) old", "B) modern", "C) antique", "D) historical"] },
    { soalan: "Example of alliteration?", jawapan: "B", options: ["A) She is like a rose", "B) Peter Piper picked peppers", "C) The moon is a coin", "D) He runs quickly"] },
    { soalan: "Past continuous: She ___ when I called.", jawapan: "C", options: ["A) sleep", "B) sleeps", "C) was sleeping", "D) slept"] },
    { soalan: "Possessive pronoun?", jawapan: "C", options: ["A) she", "B) her", "C) hers", "D) herself"] },
  ],
  "4:jawi": [
    { soalan: "Ejaan Jawi 'kecemerlangan'?", jawapan: "C", options: ["A) کچمرلڠن", "B) کيچمرلاڠن", "C) کچمرلاڠن", "D) کيچمرلڠن"] },
    { soalan: "Ejaan Jawi 'persekitaran'?", jawapan: "A", options: ["A) ڤرسيکيتارن", "B) ڤيرسيکيتارن", "C) ڤرسکيتارن", "D) ڤيرسکيتارن"] },
    { soalan: "Ejaan Jawi 'pembangunan'?", jawapan: "C", options: ["A) ڤمباڠونن", "B) ڤيمباڠونن", "C) ڤمبانڬونن", "D) ڤيمبانڬونن"] },
    { soalan: "Ejaan Jawi 'keselamatan'?", jawapan: "C", options: ["A) کسلامتن", "B) کيسلامتن", "C) کسيلامتن", "D) کيسيلامتن"] },
    { soalan: "Ejaan Jawi 'tanggungjawab'?", jawapan: "A", options: ["A) تاڠڬوڠجاوب", "B) تڠڬوڠجاوب", "C) تاڠڬوڠجوب", "D) تڠڬوڠجوب"] },
    { soalan: "Jawi کسيلامتن bermaksud?", jawapan: "C", options: ["A) persekitaran", "B) pembangunan", "C) keselamatan", "D) tanggungjawab"] },
    { soalan: "Berapa huruf Jawi asas?", jawapan: "C", options: ["A) 26", "B) 28", "C) 30", "D) 32"] },
    { soalan: "Berapa huruf tambahan Jawi?", jawapan: "C", options: ["A) 4", "B) 5", "C) 6", "D) 7"] },
    { soalan: "Ejaan Jawi 'kebebasan'?", jawapan: "C", options: ["A) کببسن", "B) کيببسن", "C) کببيسن", "D) کيببيسن"] },
    { soalan: "Ejaan Jawi 'kepimpinan'?", jawapan: "A", options: ["A) کڤيمڤينن", "B) کيڤيمڤينن", "C) کڤمڤينن", "D) کيڤمڤينن"] },
  ],
  "4:pendidikan-islam": [
    { soalan: "Maksud akhlak?", jawapan: "B", options: ["A) Ilmu", "B) Budi pekerti", "C) Ibadat", "D) Aqidah"] },
    { soalan: "Maksud ukhuwah?", jawapan: "B", options: ["A) persaingan", "B) persaudaraan", "C) permusuhan", "D) perdebatan"] },
    { soalan: "Solat berjemaah lebih afdal berapa kali ganda?", jawapan: "B", options: ["A) 17", "B) 27", "C) 37", "D) 47"] },
    { soalan: "Maksud amanah?", jawapan: "B", options: ["A) berbohong", "B) boleh dipercayai", "C) sombong", "D) dengki"] },
    { soalan: "Maksud istiqamah?", jawapan: "C", options: ["A) berubah-ubah", "B) tidak konsisten", "C) tetap pendirian", "D) tidak sabar"] },
    { soalan: "Nabi Muhammad SAW lahir tahun?", jawapan: "A", options: ["A) 570M", "B) 580M", "C) 590M", "D) 600M"] },
    { soalan: "Nabi terima wahyu usia?", jawapan: "C", options: ["A) 30", "B) 35", "C) 40", "D) 45"] },
    { soalan: "Tahun hijrah?", jawapan: "C", options: ["A) 610M", "B) 620M", "C) 622M", "D) 630M"] },
    { soalan: "Sahabat menemani Nabi hijrah?", jawapan: "D", options: ["A) Umar", "B) Uthman", "C) Ali", "D) Abu Bakar"] },
    { soalan: "Maksud tawaduk?", jawapan: "B", options: ["A) sombong", "B) rendah diri", "C) pemarah", "D) dengki"] },
  ],
  "4:sains": [
    { soalan: "Apakah sel?", jawapan: "A", options: ["A) Unit terkecil makhluk hidup", "B) Organ", "C) Tisu", "D) Sistem"] },
    { soalan: "Sel tumbuhan beza dari sel haiwan kerana?", jawapan: "B", options: ["A) nukleus", "B) dinding sel", "C) sitoplasma", "D) membran"] },
    { soalan: "Fungsi kloroplas?", jawapan: "C", options: ["A) simpan makanan", "B) kawalan sel", "C) fotosintesis", "D) pernafasan"] },
    { soalan: "Apakah ekosistem?", jawapan: "C", options: ["A) sekumpulan haiwan", "B) sekumpulan tumbuhan", "C) komuniti organisma + persekitaran", "D) rantaian makanan"] },
    { soalan: "Apakah habitat?", jawapan: "B", options: ["A) makanan haiwan", "B) tempat tinggal organisma", "C) musuh semulajadi", "D) rantaian makanan"] },
    { soalan: "Apakah adaptasi?", jawapan: "B", options: ["A) perpindahan", "B) penyesuaian diri", "C) pembiakan", "D) pemakanan"] },
    { soalan: "Contoh tenaga kinetik?", jawapan: "B", options: ["A) batu diam", "B) air mengalir", "C) spring termampat", "D) bateri"] },
    { soalan: "Tenaga boleh diperbaharui?", jawapan: "D", options: ["A) minyak", "B) arang batu", "C) gas asli", "D) solar"] },
    { soalan: "Tenaga tidak boleh diperbaharui?", jawapan: "C", options: ["A) angin", "B) solar", "C) minyak", "D) air"] },
    { soalan: "Apakah kitar semula?", jawapan: "B", options: ["A) buang sampah", "B) proses semula bahan", "C) bakar sampah", "D) tanam sampah"] },
  ],
  "5:bahasa-melayu": [
    { soalan: "Apakah novel?", jawapan: "C", options: ["A) Puisi panjang", "B) Prosa panjang berbentuk cerpen", "C) Karya prosa panjang berbentuk naratif", "D) Dialog panjang"] },
    { soalan: "Apakah cerpen?", jawapan: "B", options: ["A) Novel pendek", "B) Cerita pendek kurang 10000 patah perkataan", "C) Puisi", "D) Drama"] },
    { soalan: "Apakah tema?", jawapan: "C", options: ["A) Watak", "B) Latar", "C) Persoalan utama yang disampaikan", "D) Plot"] },
    { soalan: "Apakah plot?", jawapan: "B", options: ["A) Watak utama", "B) Susunan peristiwa dalam cerita", "C) Latar tempat", "D) Tema"] },
    { soalan: "Watak protagonis?", jawapan: "B", options: ["A) Watak jahat", "B) Watak utama yang baik", "C) Watak sampingan", "D) Watak neutral"] },
    { soalan: "Watak antagonis?", jawapan: "C", options: ["A) Watak baik", "B) Watak utama", "C) Watak yang menentang protagonis", "D) Watak sampingan"] },
    { soalan: "Latar tempat?", jawapan: "B", options: ["A) Masa cerita berlaku", "B) Tempat cerita berlaku", "C) Suasana cerita", "D) Watak cerita"] },
    { soalan: "Sudut pandangan pertama?", jawapan: "B", options: ["A) Pencerita luar", "B) Pencerita menggunakan aku atau saya", "C) Pencerita ketiga", "D) Pencerita kedua"] },
    { soalan: "Gaya bahasa?", jawapan: "B", options: ["A) Tema karya", "B) Cara pengarang menggunakan bahasa", "C) Plot cerita", "D) Watak cerita"] },
    { soalan: "Imbuhan sisipan?", jawapan: "C", options: ["A) Imbuhan di depan", "B) Imbuhan di belakang", "C) Imbuhan di tengah kata", "D) Imbuhan di depan dan belakang"] },
  ],
  "5:matematik": [
    { soalan: "23456 + 34567 = ?", jawapan: "A", options: ["A) 58023", "B) 58013", "C) 58033", "D) 58043"] },
    { soalan: "75000 - 34567 = ?", jawapan: "B", options: ["A) 40333", "B) 40433", "C) 40533", "D) 40633"] },
    { soalan: "15 × 15 = ?", jawapan: "B", options: ["A) 215", "B) 225", "C) 235", "D) 245"] },
    { soalan: "360 ÷ 15 = ?", jawapan: "C", options: ["A) 22", "B) 23", "C) 24", "D) 25"] },
    { soalan: "2/5 + 3/5 = ?", jawapan: "D", options: ["A) 5/5", "B) 1", "C) 5/10", "D) A dan B"] },
    { soalan: "3/4 - 1/8 = ?", jawapan: "A", options: ["A) 5/8", "B) 6/8", "C) 7/8", "D) 2/4"] },
    { soalan: "1.25 + 2.75 = ?", jawapan: "B", options: ["A) 3.9", "B) 4.0", "C) 4.1", "D) 4.2"] },
    { soalan: "Luas bulatan jejari 7cm = ?", jawapan: "B", options: ["A) 144cm²", "B) 154cm²", "C) 164cm²", "D) 174cm²"] },
    { soalan: "Perimeter bulatan diameter 14cm = ?", jawapan: "A", options: ["A) 44cm", "B) 54cm", "C) 64cm", "D) 74cm"] },
    { soalan: "Apakah nombor perdana?", jawapan: "B", options: ["A) Nombor boleh dibahagi banyak", "B) Nombor hanya boleh dibahagi 1 dan dirinya", "C) Nombor genap", "D) Nombor ganjil"] },
  ],
  "5:bahasa-inggeris": [
    { soalan: "What is a complex sentence?", jawapan: "C", options: ["A) One clause", "B) Two independent clauses", "C) One main and one subordinate clause", "D) Three clauses"] },
    { soalan: "Choose subordinating conjunction:", jawapan: "D", options: ["A) and", "B) but", "C) or", "D) although"] },
    { soalan: "What is passive voice?", jawapan: "B", options: ["A) Subject does action", "B) Subject receives action", "C) No subject", "D) No object"] },
    { soalan: "Example of passive voice:", jawapan: "B", options: ["A) Ali reads book", "B) Book is read by Ali", "C) Ali is reading", "D) Reading book"] },
    { soalan: "Present perfect: She ___ finished.", jawapan: "D", options: ["A) is", "B) was", "C) will", "D) has"] },
    { soalan: "What is reported speech?", jawapan: "B", options: ["A) Direct speech", "B) Telling what someone said without quoting", "C) Question", "D) Command"] },
    { soalan: "Direct to reported: He said I am happy.", jawapan: "B", options: ["A) He said he is happy", "B) He said he was happy", "C) He told happy", "D) He said am happy"] },
    { soalan: "What is conditional sentence?", jawapan: "B", options: ["A) Statement", "B) If-then sentence", "C) Question", "D) Command"] },
    { soalan: "First conditional: If it rains ___", jawapan: "C", options: ["A) I stay home", "B) I stayed home", "C) I will stay home", "D) I would stay home"] },
    { soalan: "Second conditional: If I were rich ___", jawapan: "B", options: ["A) I will buy car", "B) I would buy car", "C) I buy car", "D) I bought car"] },
  ],
  "5:jawi": [
    { soalan: "Ejaan Jawi 'kemasyarakatan'?", jawapan: "A", options: ["A) کماسياراکتن", "B) کيماسياراکتن", "C) کماسارکتن", "D) کيماسارکتن"] },
    { soalan: "Ejaan Jawi 'kepimpinan'?", jawapan: "A", options: ["A) کڤيمڤينن", "B) کيڤيمڤينن", "C) کڤمڤينن", "D) کيڤمڤينن"] },
    { soalan: "Ejaan Jawi 'pembangunan'?", jawapan: "C", options: ["A) ڤمباڠونن", "B) ڤيمباڠونن", "C) ڤمبانڬونن", "D) ڤيمبانڬونن"] },
    { soalan: "Ejaan Jawi 'keharmonian'?", jawapan: "A", options: ["A) کهارمونين", "B) کيهارمونين", "C) کهرمونين", "D) کيهرمونين"] },
    { soalan: "Ejaan Jawi 'perjuangan'?", jawapan: "A", options: ["A) ڤرجواڠن", "B) ڤيرجواڠن", "C) ڤرجوڠن", "D) ڤيرجوڠن"] },
    { soalan: "Jawi ڤرجواڠn bermaksud?", jawapan: "C", options: ["A) Persatuan", "B) Pertubuhan", "C) Perjuangan", "D) Pembangunan"] },
    { soalan: "Jawi کهارمونين bermaksud?", jawapan: "A", options: ["A) Keharmonian", "B) Keberanian", "C) Ketabahan", "D) Kesabaran"] },
    { soalan: "Ejaan Jawi 'semangat'?", jawapan: "A", options: ["A) سماڠت", "B) سيماڠت", "C) سمڠت", "D) سيمڠت"] },
    { soalan: "Ejaan Jawi 'keberanian'?", jawapan: "C", options: ["A) کبرانين", "B) کيبرانين", "C) کبراءنين", "D) کيبراءنين"] },
    { soalan: "Ejaan Jawi 'tanggungjawab'?", jawapan: "A", options: ["A) تاڠڬوڠجاوب", "B) تڠڬوڠجاوب", "C) تاڠڬوڠجوب", "D) تڠڬوڠجوب"] },
  ],
  "5:pendidikan-islam": [
    { soalan: "Apakah aqidah?", jawapan: "B", options: ["A) Budi pekerti", "B) Kepercayaan dan keyakinan dalam Islam", "C) Ibadat", "D) Akhlak"] },
    { soalan: "Apakah syariah?", jawapan: "C", options: ["A) Aqidah", "B) Akhlak", "C) Undang-undang Islam", "D) Budaya"] },
    { soalan: "Tiga bahagian Islam?", jawapan: "A", options: ["A) Aqidah syariah akhlak", "B) Solat puasa zakat", "C) Iman islam ihsan", "D) Rukun iman rukun islam sirah"] },
    { soalan: "Apakah muamalat?", jawapan: "B", options: ["A) Ibadat khusus", "B) Urusan sesama manusia", "C) Akhlak", "D) Aqidah"] },
    { soalan: "Apakah ibadat?", jawapan: "B", options: ["A) Urusan manusia", "B) Segala perbuatan kerana Allah", "C) Akhlak sahaja", "D) Solat sahaja"] },
    { soalan: "Nabi terima wahyu pertama di?", jawapan: "C", options: ["A) Masjidil Haram", "B) Madinah", "C) Gua Hira", "D) Padang Arafah"] },
    { soalan: "Tempoh Nabi berdakwah di Makkah?", jawapan: "B", options: ["A) 10 tahun", "B) 13 tahun", "C) 15 tahun", "D) 23 tahun"] },
    { soalan: "Tempoh Nabi berdakwah di Madinah?", jawapan: "C", options: ["A) 5 tahun", "B) 8 tahun", "C) 10 tahun", "D) 13 tahun"] },
    { soalan: "Pembukaan Makkah tahun?", jawapan: "C", options: ["A) 6H", "B) 7H", "C) 8H", "D) 9H"] },
    { soalan: "Apakah fardu ain?", jawapan: "B", options: ["A) Kewajipan kolektif", "B) Kewajipan individu", "C) Sunat", "D) Harus"] },
  ],
    "6:bahasa-melayu": [
    { soalan: "Apakah maksud konotasi?", jawapan: "B", options: ["A) Makna literal", "B) Makna tersirat atau tambahan sesuatu perkataan", "C) Makna kamus", "D) Makna terjemahan"] },
    { soalan: "Apakah denotasi?", jawapan: "C", options: ["A) Makna tersirat", "B) Makna tambahan", "C) Makna literal dalam kamus", "D) Makna kiasan"] },
    { soalan: "Apakah inversi dalam ayat?", jawapan: "B", options: ["A) Ayat biasa", "B) Subjek diletakkan di belakang predikat", "C) Ayat aktif", "D) Ayat pasif"] },
    { soalan: "Bahasa surat rasmi?", jawapan: "B", options: ["A) Bahasa santai", "B) Bahasa formal baku dan sopan", "C) Bahasa pasar", "D) Bahasa slanga"] },
    { soalan: "Format surat rasmi?", jawapan: "C", options: ["A) Alamat dan tarikh sahaja", "B) Tajuk sahaja", "C) Alamat tarikh tajuk isi dan penutup", "D) Nama sahaja"] },
    { soalan: "Apakah eufemisme?", jawapan: "B", options: ["A) Bahasa kasar", "B) Kata halus menggantikan kata kasar", "C) Bahasa pasar", "D) Bahasa asing"] },
    { soalan: "Contoh eufemisme?", jawapan: "B", options: ["A) mati", "B) meninggal dunia", "C) bunuh", "D) musnah"] },
    { soalan: "Apakah laras bahasa?", jawapan: "B", options: ["A) Jenis huruf", "B) Variasi bahasa mengikut bidang atau situasi", "C) Jenis ayat", "D) Jenis perkataan"] },
    { soalan: "Apakah wacana?", jawapan: "B", options: ["A) Ayat tunggal", "B) Unit bahasa yang lebih besar dari ayat", "C) Perkataan tunggal", "D) Suku kata"] },
    { soalan: "Apakah kohesi?", jawapan: "B", options: ["A) Percanggahan idea", "B) Kesinambungan dan perkaitan antara ayat", "C) Tiada hubungan", "D) Idea berulang"] },
  ],
  "6:matematik": [
    { soalan: "345678 + 456789 = ?", jawapan: "A", options: ["A) 802467", "B) 802367", "C) 802567", "D) 802267"] },
    { soalan: "1000000 - 456789 = ?", jawapan: "B", options: ["A) 543111", "B) 543211", "C) 543311", "D) 543411"] },
    { soalan: "25 × 36 = ?", jawapan: "C", options: ["A) 880", "B) 890", "C) 900", "D) 910"] },
    { soalan: "1440 ÷ 36 = ?", jawapan: "C", options: ["A) 38", "B) 39", "C) 40", "D) 41"] },
    { soalan: "3/4 × 2/3 = ?", jawapan: "D", options: ["A) 5/7", "B) 6/12", "C) 1/2", "D) B dan C"] },
    { soalan: "5/6 ÷ 5/3 = ?", jawapan: "A", options: ["A) 1/2", "B) 1/3", "C) 2/3", "D) 25/18"] },
    { soalan: "2.5 × 1.4 = ?", jawapan: "B", options: ["A) 3.4", "B) 3.5", "C) 3.6", "D) 3.7"] },
    { soalan: "Isipadu silinder j=7cm t=10cm = ?", jawapan: "A", options: ["A) 1540cm³", "B) 1640cm³", "C) 1740cm³", "D) 1840cm³"] },
    { soalan: "Luas permukaan kubus 5cm = ?", jawapan: "C", options: ["A) 100cm²", "B) 125cm²", "C) 150cm²", "D) 175cm²"] },
    { soalan: "Nisbah 2:3:5 jumlah 200 nilai terbesar = ?", jawapan: "C", options: ["A) 80", "B) 90", "C) 100", "D) 110"] },
  ],
  "6:bahasa-inggeris": [
    { soalan: "What is a narrative essay?", jawapan: "B", options: ["A) arguing a point", "B) telling a story", "C) describing something", "D) explaining a process"] },
    { soalan: "What is an expository essay?", jawapan: "C", options: ["A) telling a story", "B) arguing a point", "C) explaining or informing", "D) describing something"] },
    { soalan: "What is an argumentative essay?", jawapan: "B", options: ["A) telling a story", "B) arguing and persuading", "C) describing something", "D) explaining a process"] },
    { soalan: "What is a descriptive essay?", jawapan: "D", options: ["A) telling a story", "B) arguing a point", "C) explaining", "D) describing vividly"] },
    { soalan: "What is the thesis statement?", jawapan: "B", options: ["A) conclusion", "B) main argument of essay", "C) introduction", "D) body paragraph"] },
    { soalan: "What is a topic sentence?", jawapan: "B", options: ["A) last sentence", "B) main idea of paragraph", "C) supporting detail", "D) conclusion"] },
    { soalan: "What is a supporting detail?", jawapan: "B", options: ["A) main idea", "B) evidence that supports topic sentence", "C) conclusion", "D) thesis"] },
    { soalan: "What is a transition word?", jawapan: "C", options: ["A) noun", "B) verb", "C) word that connects ideas", "D) adjective"] },
    { soalan: "Example of transition word?", jawapan: "C", options: ["A) run", "B) beautiful", "C) furthermore", "D) quickly"] },
    { soalan: "What is active voice?", jawapan: "B", options: ["A) subject receives action", "B) subject does action", "C) no subject", "D) no verb"] },
  ],
  "6:jawi": [
    { soalan: "Ejaan Jawi 'kesukarelaan'?", jawapan: "A", options: ["A) کسوکاريلاءن", "B) کيسوکاريلاءن", "C) کسوکرلاءن", "D) کيسوکرلاءن"] },
    { soalan: "Ejaan Jawi 'pembangunan insan'?", jawapan: "C", options: ["A) ڤمبانڬونن انسن", "B) ڤمبانڬونن اينسن", "C) ڤمبانڬونن انسان", "D) ڤمبانڬونن اينسان"] },
    { soalan: "Ejaan Jawi 'kelestarian alam'?", jawapan: "C", options: ["A) کلستارين الم", "B) کيلستارين الم", "C) کلستاريان الم", "D) کيلستاريان الم"] },
    { soalan: "Ejaan Jawi 'kemampanan'?", jawapan: "A", options: ["A) کمامڤانن", "B) کيمامڤانن", "C) کمامڤنن", "D) کيمامڤنن"] },
    { soalan: "Ejaan Jawi 'kesejahteraan'?", jawapan: "C", options: ["A) کسجاهتراءن", "B) کيسجاهتراءن", "C) کسيجاهتراءن", "D) کيسيجاهتراءن"] },
    { soalan: "Ejaan Jawi 'kewarganegaraan'?", jawapan: "A", options: ["A) کوارڬانيڬاراءن", "B) کيوارڬانيڬاراءن", "C) کوارڬنيڬاراءن", "D) کوارڬانيڬارأن"] },
    { soalan: "Ejaan Jawi 'kepelbagaian'?", jawapan: "A", options: ["A) کڤلباڬاين", "B) کيڤلباڬاين", "C) کڤلبڬاين", "D) کيڤلبڬاين"] },
    { soalan: "Ejaan Jawi 'kesinambungan'?", jawapan: "C", options: ["A) کسينمبوڠن", "B) کيسينمبوڠن", "C) کسينامبوڠن", "D) کيسينامبوڠن"] },
    { soalan: "Ejaan Jawi 'pemberdayaan'?", jawapan: "A", options: ["A) ڤمبرداياءن", "B) ڤيمبرداياءن", "C) ڤمبيرداياءن", "D) ڤيمبيرداياءن"] },
    { soalan: "Ejaan Jawi 'pengantarabangsaan'?", jawapan: "C", options: ["A) ڤڠنتارابڠساءن", "B) ڤيڠنتارابڠساءن", "C) ڤڠانتارابڠساءن", "D) ڤيڠانتارابڠساءن"] },
  ],
  "6:pendidikan-islam": [
    { soalan: "Apakah maksud tauhid?", jawapan: "B", options: ["A) mempercayai banyak tuhan", "B) mengesakan Allah", "C) mempercayai malaikat", "D) mempercayai kitab"] },
    { soalan: "Tiga bahagian tauhid ialah?", jawapan: "A", options: ["A) rububiyyah uluhiyyah asma wassifat", "B) iman islam ihsan", "C) aqidah syariah akhlak", "D) wajib sunat harus"] },
    { soalan: "Apakah tauhid rububiyyah?", jawapan: "B", options: ["A) mengesakan Allah dalam ibadat", "B) mengesakan Allah sebagai pencipta", "C) mengesakan nama dan sifat Allah", "D) mengesakan Rasul"] },
    { soalan: "Apakah tauhid uluhiyyah?", jawapan: "C", options: ["A) mengesakan Allah sebagai pencipta", "B) mengesakan nama Allah", "C) mengesakan Allah dalam ibadat", "D) mengesakan Rasul"] },
    { soalan: "Apakah tauhid asma wassifat?", jawapan: "C", options: ["A) mengesakan Allah sebagai pencipta", "B) mengesakan dalam ibadat", "C) mengesakan nama dan sifat Allah", "D) mengesakan Rasul"] },
    { soalan: "Apakah syirik?", jawapan: "B", options: ["A) mengesakan Allah", "B) menyekutukan Allah", "C) mempercayai Allah", "D) berdoa kepada Allah"] },
    { soalan: "Syirik besar contohnya?", jawapan: "C", options: ["A) riak", "B) sum'ah", "C) menyembah berhala", "D) ujub"] },
    { soalan: "Syirik kecil contohnya?", jawapan: "B", options: ["A) menyembah berhala", "B) riak", "C) kafir", "D) murtad"] },
    { soalan: "Apakah maksud riak?", jawapan: "B", options: ["A) ikhlas", "B) beramal untuk dipuji manusia", "C) beramal kerana Allah", "D) beramal ikhlas"] },
    { soalan: "Apakah maksud nifak?", jawapan: "C", options: ["A) jujur", "B) ikhlas", "C) munafik berpura-pura Islam", "D) berani"] },
  ],
  "6:sains": [
    { soalan: "Apakah evolusi?", jawapan: "B", options: ["A) perubahan mendadak", "B) perubahan perlahan spesies dari generasi ke generasi", "C) pembiakan cepat", "D) kepupusan spesies"] },
    { soalan: "Siapa pencetus teori evolusi?", jawapan: "C", options: ["A) Newton", "B) Einstein", "C) Darwin", "D) Pasteur"] },
    { soalan: "Apakah seleksi semula jadi?", jawapan: "B", options: ["A) pemilihan manusia", "B) proses alam memilih yang terbaik untuk hidup", "C) pembiakan terpilih", "D) evolusi"] },
    { soalan: "Apakah fosil?", jawapan: "B", options: ["A) batu biasa", "B) sisa atau kesan organisma purba dalam batuan", "C) mineral", "D) kristal"] },
    { soalan: "Apakah spesies?", jawapan: "B", options: ["A) individu tunggal", "B) kumpulan organisma yang boleh membiak antara satu sama lain", "C) genus", "D) kingdom"] },
    { soalan: "Apakah ekosistem akuatik?", jawapan: "B", options: ["A) ekosistem darat", "B) ekosistem air", "C) ekosistem udara", "D) ekosistem gurun"] },
    { soalan: "Apakah ekosistem terestrial?", jawapan: "B", options: ["A) ekosistem air", "B) ekosistem darat", "C) ekosistem udara", "D) ekosistem lautan"] },
    { soalan: "Apakah perubahan iklim?", jawapan: "B", options: ["A) cuaca harian", "B) perubahan jangka panjang dalam iklim bumi", "C) musim biasa", "D) angin biasa"] },
    { soalan: "Punca utama perubahan iklim?", jawapan: "B", options: ["A) aktiviti semula jadi sahaja", "B) aktiviti manusia terutama pembakaran bahan api fosil", "C) cuaca sahaja", "D) musim sahaja"] },
    { soalan: "Apakah pembangunan lestari?", jawapan: "B", options: ["A) pembangunan pesat", "B) pembangunan yang memenuhi keperluan kini tanpa menjejaskan masa depan", "C) pembangunan lambat", "D) tiada pembangunan"] },
  ],
  "5:sains": [
    { soalan: "Apakah DNA?", jawapan: "B", options: ["A) Protein", "B) Bahan genetik dalam sel", "C) Vitamin", "D) Mineral"] },
    { soalan: "DNA terdapat dalam?", jawapan: "C", options: ["A) Sitoplasma", "B) Dinding sel", "C) Nukleus", "D) Membran sel"] },
    { soalan: "Apakah kromosom?", jawapan: "B", options: ["A) Sel", "B) DNA yang tergulung", "C) Protein", "D) Vitamin"] },
    { soalan: "Apakah gen?", jawapan: "A", options: ["A) Unit pewarisan sifat", "B) Sel", "C) Tisu", "D) Organ"] },
    { soalan: "Pembiakan seks?", jawapan: "B", options: ["A) Satu induk", "B) Dua induk jantan dan betina", "C) Tanpa benih", "D) Vegetatif"] },
    { soalan: "Pembiakan aseks?", jawapan: "B", options: ["A) Dua induk", "B) Satu induk tanpa penyatuan gamet", "C) Memerlukan benih", "D) Memerlukan bunga"] },
    { soalan: "Contoh pembiakan aseks tumbuhan?", jawapan: "C", options: ["A) Biji benih", "B) Pendebungaan", "C) Keratan batang", "D) Buah"] },
    { soalan: "Apakah ekologi?", jawapan: "B", options: ["A) Kajian tentang sel", "B) Kajian hubungan organisma dengan persekitaran", "C) Kajian tentang atom", "D) Kajian tentang planet"] },
    { soalan: "Apakah biodiversiti?", jawapan: "B", options: ["A) Satu spesies", "B) Kepelbagaian spesies hidupan", "C) Satu ekosistem", "D) Satu habitat"] },
    { soalan: "Ancaman kepada biodiversiti?", jawapan: "B", options: ["A) Menanam pokok", "B) Pembalakan haram", "C) Kitar semula", "D) Taman negara"] },
  ],
};



const TIME_MAP: Record<string, number> = {
  "1:bahasa-melayu": 10,
  "1:bahasa-inggeris": 10,
  "1:jawi": 10,
  "1:pendidikan-islam": 10,
  "1:sains": 10,
  "2:bahasa-melayu": 10,
  "2:matematik": 10,
  "2:bahasa-inggeris": 10,
  "2:jawi": 10,
  "2:pendidikan-islam": 10,
  "2:sains": 10,
  "3:bahasa-melayu": 10,
  "3:matematik": 10,
  "3:bahasa-inggeris": 10,
  "3:jawi": 10,
  "3:pendidikan-islam": 10,
  "3:sains": 10,
  "4:bahasa-melayu": 10,
  "4:matematik": 10,
  "4:bahasa-inggeris": 10,
  "4:jawi": 10,
  "4:pendidikan-islam": 10,
  "4:sains": 10,
  "5:bahasa-melayu": 10,
  "5:matematik": 10,
  "5:bahasa-inggeris": 10,
  "5:jawi": 10,
  "5:pendidikan-islam": 10,
  "5:sains": 10,
  "6:bahasa-melayu": 10,
  "6:matematik": 10,
  "6:bahasa-inggeris": 10,
  "6:jawi": 10,
  "6:pendidikan-islam": 10,
  "6:sains": 10,
};



function totalTimeFor(darjahId: string, subjekId: string) {
  return TIME_MAP[`${darjahId}:${subjekId}`] ?? 60;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function GameSubjekPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/game" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId);
  const subjek = getSubjek(subjekId);

  const soalanList = useMemo(() => BANK[`${darjahId}:${subjekId}`] ?? [], [darjahId, subjekId]);
  const totalTime = totalTimeFor(darjahId, subjekId);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [jwp, setJwp] = useState("");
  const [markah, setMarkah] = useState(0);
  const [masa, setMasa] = useState(totalTime);
  const [habis, setHabis] = useState(false);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBM = darjahId === "1" && subjekId === "bahasa-melayu";
  const isBM2 = darjahId === "2" && subjekId === "bahasa-melayu";
  const isBI = darjahId === "1" && subjekId === "bahasa-inggeris";
  const isBI2 = darjahId === "2" && subjekId === "bahasa-inggeris";
  const isMate = darjahId === "1" && subjekId === "matematik";
  const isMate2 = darjahId === "2" && subjekId === "matematik";
  const isJawi = darjahId === "1" && subjekId === "jawi";
  const isJawi2 = darjahId === "2" && subjekId === "jawi";
  const isPI = darjahId === "1" && subjekId === "pendidikan-islam";
  const isPI2 = darjahId === "2" && subjekId === "pendidikan-islam";
  const isSains = darjahId === "1" && subjekId === "sains";
  const isSains2 = darjahId === "2" && subjekId === "sains";
  const isBM3 = darjahId === "3" && subjekId === "bahasa-melayu";
  const isMate3 = darjahId === "3" && subjekId === "matematik";
  const isBI3 = darjahId === "3" && subjekId === "bahasa-inggeris";
  const isJawi3 = darjahId === "3" && subjekId === "jawi";
  const isPI3 = darjahId === "3" && subjekId === "pendidikan-islam";
  const isSains3 = darjahId === "3" && subjekId === "sains";
  const isBM4 = darjahId === "4" && subjekId === "bahasa-melayu";
  const isMate4 = darjahId === "4" && subjekId === "matematik";
  const isBI4 = darjahId === "4" && subjekId === "bahasa-inggeris";
  const isJawi4 = darjahId === "4" && subjekId === "jawi";
  const isPI4 = darjahId === "4" && subjekId === "pendidikan-islam";
  const isSains4 = darjahId === "4" && subjekId === "sains";
  const isBM5 = darjahId === "5" && subjekId === "bahasa-melayu";
  const isMate5 = darjahId === "5" && subjekId === "matematik";
  const isBI5 = darjahId === "5" && subjekId === "bahasa-inggeris";
  const isJawi5 = darjahId === "5" && subjekId === "jawi";
  const isPI5 = darjahId === "5" && subjekId === "pendidikan-islam";
  const isSains5 = darjahId === "5" && subjekId === "sains";
  const isBM6 = darjahId === "6" && subjekId === "bahasa-melayu";
  const isMate6 = darjahId === "6" && subjekId === "matematik";
  const isBI6 = darjahId === "6" && subjekId === "bahasa-inggeris";
  const isJawi6 = darjahId === "6" && subjekId === "jawi";
  const isPI6 = darjahId === "6" && subjekId === "pendidikan-islam";
  const isSains6 = darjahId === "6" && subjekId === "sains";
  const hasCariPerkataan = isMate || isMate2 || isMate3 || isMate4 || isMate5 || isBM || isBM2 || isBM3 || isBM4 || isBM5 || isBI || isBI2 || isBI3 || isBI4 || isBI5 || isJawi || isJawi2 || isJawi3 || isJawi4 || isJawi5 || isPI || isPI2 || isPI3 || isPI4 || isPI5 || isSains || isSains2 || isSains3 || isSains4 || isSains5 || isBM6 || isMate6 || isBI6 || isJawi6 || isPI6 || isSains6;

  const hasRace = soalanList.length > 0;
  const [mode, setMode] = useState<"race" | "cari" | "betul" | "padan" | "susun">(hasRace ? "race" : "betul");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!started || habis) return;
    if (masa <= 0) {
      setHabis(true);
      return;
    }
    const t = setTimeout(() => setMasa((m) => m - 1), 1000);
    return () => clearTimeout(t);
  }, [started, habis, masa]);

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

  if (!darjah || !subjek || soalanList.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Game belum tersedia</h1>
          <Link to="/darjah/$darjahId/$subjekId" params={{ darjahId, subjekId }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  function mula() {
    setStarted(true);
    setIdx(0);
    setJwp("");
    setMarkah(0);
    setMasa(totalTime);
    setHabis(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function hantar(e?: React.FormEvent) {
    e?.preventDefault();
    if (habis) return;
    const betul = normalize(jwp) === normalize(soalanList[idx].jawapan);
    if (betul) setMarkah((m) => m + 1);
    setFlash(betul ? "ok" : "no");
    setTimeout(() => setFlash(null), 250);
    const next = idx + 1;
    if (next >= soalanList.length) {
      setHabis(true);
    } else {
      setIdx(next);
      setJwp("");
    }
  }

  const bintang = markah >= soalanList.length * 0.9
    ? 3
    : markah >= soalanList.length * 0.6
    ? 2
    : markah > 0
    ? 1
    : 0;

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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-300 text-rose-900 shadow-soft">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              {hasCariPerkataan && mode === "cari" ? "Cari Perkataan" : "Quiz Race"}
            </h1>
            <p className="text-sm text-muted-foreground">{darjah.label} • {subjek.title}</p>
          </div>
        </div>

        {hasCariPerkataan && (
          <div className="mt-5 inline-flex rounded-full bg-secondary p-1">
            <button
              onClick={() => setMode("race")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-extrabold transition ${
                mode === "race" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"
              }`}
            >
              <Trophy className="h-4 w-4" /> Quiz Race
            </button>
            <button
              onClick={() => setMode("cari")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-extrabold transition ${
                mode === "cari" ? "text-white shadow-soft" : "text-muted-foreground"
              }`}
              style={mode === "cari" ? { backgroundColor: "#1B8A5A" } : undefined}
            >
              <Search className="h-4 w-4" /> Cari Perkataan
            </button>
          </div>
        )}

        {hasCariPerkataan && mode === "cari" ? (
          isBM ? (
            <CariPerkataan
              words={BM_DARJAH1_WORDS}
              clues={BM_DARJAH1_CLUES}
              gridSize={10}
            />
          ) : isBM2 ? (
            <CariPerkataan
              words={BM_DARJAH2_WORDS}
              clues={BM_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Bahasa Melayu"
            />
          ) : isMate2 ? (
            <CariPerkataan
              words={MATE_DARJAH2_WORDS}
              clues={MATE_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Matematik"
            />
          ) : isBI ? (
            <CariPerkataan
              words={BI_DARJAH1_WORDS}
              clues={BI_DARJAH1_CLUES}
              gridSize={10}
              title="Word Search"
            />
          ) : isBI2 ? (
            <CariPerkataan
              words={BI_DARJAH2_WORDS}
              clues={BI_DARJAH2_CLUES}
              gridSize={10}
              title="Word Search"
            />
          ) : isJawi ? (
            <CariPerkataan
              words={JAWI_DARJAH1_WORDS}
              clues={JAWI_DARJAH1_CLUES}
              gridSize={10}
              title="Cari Perkataan Jawi"
            />
          ) : isJawi2 ? (
            <CariPerkataan
              words={JAWI_DARJAH2_WORDS}
              clues={JAWI_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Jawi"
            />
          ) : isPI ? (
            <CariPerkataan
              words={PI_DARJAH1_WORDS}
              clues={PI_DARJAH1_CLUES}
              gridSize={10}
              title="Cari Perkataan Pendidikan Islam"
            />
          ) : isSains ? (
            <CariPerkataan
              words={SAINS_DARJAH1_WORDS}
              clues={SAINS_DARJAH1_CLUES}
              gridSize={10}
              title="Cari Perkataan Sains"
            />
          ) : isPI2 ? (
            <CariPerkataan
              words={PI_DARJAH2_WORDS}
              clues={PI_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Pendidikan Islam"
            />
          ) : isSains2 ? (
            <CariPerkataan
              words={SAINS_DARJAH2_WORDS}
              clues={SAINS_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Sains"
            />
          ) : isBM3 ? (
            <CariPerkataan
              words={BM_DARJAH3_WORDS}
              clues={BM_DARJAH3_CLUES}
              gridSize={10}
              title="Cari Perkataan Bahasa Melayu"
            />
          ) : isMate3 ? (
            <CariPerkataan
              words={MATE_DARJAH3_WORDS}
              clues={MATE_DARJAH3_CLUES}
              gridSize={10}
              title="Cari Perkataan Matematik"
            />
          ) : isBI3 ? (
            <CariPerkataan
              words={BI_DARJAH3_WORDS}
              clues={BI_DARJAH3_CLUES}
              gridSize={10}
              title="Word Search"
            />
          ) : isJawi3 ? (
            <CariPerkataan
              words={JAWI_DARJAH3_WORDS}
              clues={JAWI_DARJAH3_CLUES}
              gridSize={10}
              title="Cari Perkataan Jawi"
            />
          ) : isPI3 ? (
            <CariPerkataan
              words={PI_DARJAH3_WORDS}
              clues={PI_DARJAH3_CLUES}
              gridSize={10}
              title="Cari Perkataan Pendidikan Islam"
            />
          ) : isSains3 ? (
            <CariPerkataan
              words={SAINS_DARJAH2_WORDS}
              clues={SAINS_DARJAH2_CLUES}
              gridSize={10}
              title="Cari Perkataan Sains"
            />
          ) : isBM4 ? (
            <CariPerkataan words={BM_DARJAH4_WORDS} clues={BM_DARJAH4_CLUES} gridSize={10} title="Cari Perkataan Bahasa Melayu" />
          ) : isMate4 ? (
            <CariPerkataan words={MATE_DARJAH4_WORDS} clues={MATE_DARJAH4_CLUES} gridSize={10} title="Cari Perkataan Matematik" />
          ) : isBI4 ? (
            <CariPerkataan words={BI_DARJAH4_WORDS} clues={BI_DARJAH4_CLUES} gridSize={10} title="Word Search" />
          ) : isJawi4 ? (
            <CariPerkataan words={JAWI_DARJAH4_WORDS} clues={JAWI_DARJAH4_CLUES} gridSize={10} title="Cari Perkataan Jawi" />
          ) : isPI4 ? (
            <CariPerkataan words={PI_DARJAH4_WORDS} clues={PI_DARJAH4_CLUES} gridSize={10} title="Cari Perkataan Pendidikan Islam" />
          ) : isSains4 ? (
            <CariPerkataan words={SAINS_DARJAH4_WORDS} clues={SAINS_DARJAH4_CLUES} gridSize={10} title="Cari Perkataan Sains" />
          ) : isBM5 ? (
            <CariPerkataan words={BM_DARJAH5_WORDS} clues={BM_DARJAH5_CLUES} gridSize={10} title="Cari Perkataan Bahasa Melayu" />
          ) : isMate5 ? (
            <CariPerkataan words={MATE_DARJAH5_WORDS} clues={MATE_DARJAH5_CLUES} gridSize={10} title="Cari Perkataan Matematik" />
          ) : isBI5 ? (
            <CariPerkataan words={BI_DARJAH5_WORDS} clues={BI_DARJAH5_CLUES} gridSize={10} title="Word Search" />
          ) : isJawi5 ? (
            <CariPerkataan words={JAWI_DARJAH5_WORDS} clues={JAWI_DARJAH5_CLUES} gridSize={10} title="Cari Perkataan Jawi" />
          ) : isPI5 ? (
            <CariPerkataan words={PI_DARJAH5_WORDS} clues={PI_DARJAH5_CLUES} gridSize={10} title="Cari Perkataan Pendidikan Islam" />
          ) : isSains5 ? (
            <CariPerkataan words={SAINS_DARJAH5_WORDS} clues={SAINS_DARJAH5_CLUES} gridSize={10} title="Cari Perkataan Sains" />
          ) : isBM6 ? (
            <CariPerkataan words={BM_DARJAH6_WORDS} clues={BM_DARJAH6_CLUES} gridSize={15} title="Cari Perkataan Bahasa Melayu" />
          ) : isMate6 ? (
            <CariPerkataan words={MATE_DARJAH6_WORDS} clues={MATE_DARJAH6_CLUES} gridSize={15} title="Cari Perkataan Matematik" />
          ) : isBI6 ? (
            <CariPerkataan words={BI_DARJAH6_WORDS} clues={BI_DARJAH6_CLUES} gridSize={15} title="Word Search" />
          ) : isJawi6 ? (
            <CariPerkataan words={JAWI_DARJAH6_WORDS} clues={JAWI_DARJAH6_CLUES} gridSize={15} title="Cari Perkataan Jawi" />
          ) : isPI6 ? (
            <CariPerkataan words={PI_DARJAH6_WORDS} clues={PI_DARJAH6_CLUES} gridSize={15} title="Cari Perkataan Pendidikan Islam" />
          ) : isSains6 ? (
            <CariPerkataan words={SAINS_DARJAH6_WORDS} clues={SAINS_DARJAH6_CLUES} gridSize={15} title="Cari Perkataan Sains" />
          ) : (
            <CariPerkataan />
          )
        ) : !started ? (
          <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
            <Trophy className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Sedia untuk berlumba?</h2>
            <p className="mt-2 text-muted-foreground">
              Jawab {soalanList.length} soalan {subjek.title} dalam {totalTime} saat. Semakin banyak betul, semakin banyak bintang!
            </p>
            <button
              onClick={mula}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
            >
              Mula Game →
            </button>
          </div>
        ) : !habis ? (
          <div
            className={`mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8 transition ${
              flash === "ok" ? "ring-4 ring-primary/60" : flash === "no" ? "ring-4 ring-rose-400/60" : ""
            }`}
          >
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-primary">
                <Timer className="h-4 w-4" /> {masa}s
              </span>
              <span className="text-muted-foreground">
                Soalan {idx + 1} / {soalanList.length}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-gold-foreground">
                <Trophy className="h-4 w-4" /> {markah}
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-primary transition-all"
                style={{ width: `${(masa / totalTime) * 100}%` }}
              />
            </div>

            <h2 className="mt-6 text-center font-display text-3xl font-extrabold text-foreground md:text-4xl">
              {soalanList[idx].soalan}
            </h2>

            {soalanList[idx].options ? (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {soalanList[idx].options!.map((opt) => {
                  const letter = opt.charAt(0);
                  return (
                    <button
                      key={letter}
                      onClick={() => {
                        setJwp(letter);
                        setTimeout(() => hantar(), 50);
                      }}
                      className="rounded-2xl border-2 border-input bg-background p-4 text-left font-display text-lg font-extrabold text-foreground transition hover:border-primary hover:bg-secondary"
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={hantar} className="mt-6">
                <input
                  ref={inputRef}
                  value={jwp}
                  onChange={(e) => setJwp(e.target.value)}
                  placeholder="Taip jawapan..."
                  className="w-full rounded-2xl border-2 border-input bg-background p-4 text-center font-display text-2xl font-extrabold text-foreground outline-none transition focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={jwp.trim().length === 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-5 w-5" /> Hantar
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-gradient-hero p-8 text-center shadow-card">
            <Sparkles className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">Tamat! 🏁</h2>
            <p className="mt-2 text-muted-foreground">
              Markah kamu: <span className="font-extrabold text-primary">{markah}</span> / {soalanList.length}
            </p>
            <p className="text-sm text-muted-foreground">Masa tinggal: {masa}s</p>
            <div className="mt-4 flex justify-center">
              <StarReward earned={bintang} />
            </div>
            <button
              onClick={mula}
              className="mt-5 rounded-full bg-card px-5 py-2 font-display font-extrabold text-foreground shadow-soft"
            >
              Main Lagi
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
