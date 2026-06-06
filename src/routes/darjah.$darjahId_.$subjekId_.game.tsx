import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Gamepad2, Send, Sparkles, Timer, Trophy, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { CariPerkataan, BM_DARJAH1_WORDS, BM_DARJAH1_CLUES, BM_DARJAH2_WORDS, BM_DARJAH2_CLUES, BI_DARJAH1_WORDS, BI_DARJAH1_CLUES, BI_DARJAH2_WORDS, BI_DARJAH2_CLUES, JAWI_DARJAH1_WORDS, JAWI_DARJAH1_CLUES, JAWI_DARJAH2_WORDS, JAWI_DARJAH2_CLUES, PI_DARJAH1_WORDS, PI_DARJAH1_CLUES, PI_DARJAH2_WORDS, PI_DARJAH2_CLUES, SAINS_DARJAH1_WORDS, SAINS_DARJAH1_CLUES, MATE_DARJAH2_WORDS, MATE_DARJAH2_CLUES } from "@/components/CariPerkataan";
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
  const hasCariPerkataan = isMate || isMate2 || isBM || isBM2 || isBI || isBI2 || isJawi || isJawi2 || isPI || isPI2 || isSains;

  const [mode, setMode] = useState<"race" | "cari">("race");

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
