import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, X, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StarReward } from "@/components/StarReward";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getDarjah, getSubjek } from "@/lib/curriculum";
import { getQuiz, type QuizQuestion } from "@/lib/quiz-bank";

export const Route = createFileRoute("/darjah/$darjahId_/$subjekId_/kuiz")({
  head: () => ({ meta: [{ title: "Kuiz — Kalifah.my" }] }),
  ssr: false,
  component: KuizPage,
});

// Hardcoded fallback supaya soalan pasti muncul untuk Matematik Darjah 1
const MATEMATIK_D1: QuizQuestion[] = [
  { soalan: "Nombor apakah selepas 7?", pilihan: ["6", "8", "9", "10"], jawapan: 1, nota: "Selepas 7 ialah 8." },
  { soalan: "3 + 4 = ?", pilihan: ["6", "7", "8", "9"], jawapan: 1 },
  { soalan: "10 - 3 = ?", pilihan: ["6", "7", "8", "13"], jawapan: 1 },
  { soalan: "5 + 5 = ?", pilihan: ["9", "10", "11", "55"], jawapan: 1 },
  { soalan: "8 - 4 = ?", pilihan: ["2", "3", "4", "12"], jawapan: 2 },
  { soalan: "Bentuk dengan 3 sisi ialah?", pilihan: ["Bulatan", "Segiempat", "Segitiga", "Segilima"], jawapan: 2 },
  { soalan: "Berapa sisi segiempat?", pilihan: ["2", "3", "4", "5"], jawapan: 2 },
  { soalan: "Nombor apakah sebelum 10?", pilihan: ["11", "10", "9", "8"], jawapan: 2 },
  { soalan: "Siti ada 4 guli + Abu 5 guli = ?", pilihan: ["7", "8", "9", "10"], jawapan: 2 },
  { soalan: "1, 2, 3, ___, 5 = ?", pilihan: ["2", "4", "6", "3"], jawapan: 1 },
];

// Hardcoded soalan Bahasa Melayu Darjah 1
const BAHASA_MELAYU_D1: QuizQuestion[] = [
  { soalan: "Huruf manakah huruf vokal?", pilihan: ["b", "c", "a", "d"], jawapan: 2, nota: "Huruf vokal: a, e, i, o, u." },
  { soalan: "Berapa huruf vokal dalam Bahasa Melayu?", pilihan: ["3", "4", "5", "6"], jawapan: 2, nota: "a, e, i, o, u — 5 huruf." },
  { soalan: "Huruf manakah BUKAN vokal?", pilihan: ["a", "e", "i", "b"], jawapan: 3 },
  { soalan: "Pilih perkataan bermula dengan huruf vokal:", pilihan: ["bola", "cawan", "epal", "pokok"], jawapan: 2 },
  { soalan: "'bola' ada berapa suku kata?", pilihan: ["1", "2", "3", "4"], jawapan: 1, nota: "bo-la = 2 suku kata." },
  { soalan: "Suku kata pertama 'mama' ialah:", pilihan: ["ma", "am", "aa", "mm"], jawapan: 0 },
  { soalan: "Gabung 'bu' + 'nga' = ?", pilihan: ["bunag", "gabung", "bunga", "buag"], jawapan: 2 },
  { soalan: "'ku' + 'cing' = ?", pilihan: ["kucng", "kucing", "kuing", "kucig"], jawapan: 1 },
  { soalan: "Haiwan ini 🐱 ialah?", pilihan: ["anjing", "arnab", "kucing", "harimau"], jawapan: 2 },
  { soalan: "Pilih ayat yang betul:", pilihan: ["Saya makan nasi sedap", "Saya makan nasi", "Makan saya nasi", "Nasi saya makan"], jawapan: 1 },
  { soalan: "Lawan kata 'besar' ialah?", pilihan: ["tinggi", "panjang", "kecil", "lebar"], jawapan: 2 },
  { soalan: "Ejaan yang betul ialah?", pilihan: ["kocing", "kuching", "kucing", "kusing"], jawapan: 2 },
  { soalan: "'Ali _____ ke sekolah.'", pilihan: ["makan", "tidur", "pergi", "minum"], jawapan: 2 },
  { soalan: "Huruf 'u' ialah huruf?", pilihan: ["konsonan", "vokal", "nombor", "simbol"], jawapan: 1 },
  { soalan: "Perkataan manakah ada 3 suku kata?", pilihan: ["buku", "meja", "semua", "tin"], jawapan: 2, nota: "se-mu-a = 3 suku kata." },
];

// Hardcoded soalan Bahasa Inggeris Darjah 1
const BAHASA_INGGERIS_D1: QuizQuestion[] = [
  { soalan: "Which letter comes after D?", pilihan: ["C", "E", "F", "G"], jawapan: 1 },
  { soalan: "Which word starts with B?", pilihan: ["apple", "cat", "ball", "dog"], jawapan: 2 },
  { soalan: "How many letters in the alphabet?", pilihan: ["24", "25", "26", "27"], jawapan: 2 },
  { soalan: "Which is a vowel?", pilihan: ["b", "c", "o", "d"], jawapan: 2 },
  { soalan: "Which word starts with S?", pilihan: ["tree", "frog", "hat", "sun"], jawapan: 3 },
  { soalan: "What is this? 🐱", pilihan: ["dog", "rabbit", "cat", "bird"], jawapan: 2 },
  { soalan: "What colour is the sky?", pilihan: ["red", "green", "yellow", "blue"], jawapan: 3 },
  { soalan: "What do we use to write?", pilihan: ["ruler", "eraser", "pencil", "scissors"], jawapan: 2 },
  { soalan: "Opposite of 'big'?", pilihan: ["tall", "long", "small", "wide"], jawapan: 2 },
  { soalan: "How many days in a week?", pilihan: ["5", "6", "7", "8"], jawapan: 2 },
  { soalan: "Correct sentence?", pilihan: ["I am name Ali", "Name I Ali is", "My name is Ali", "Ali name my is"], jawapan: 2 },
  { soalan: "I ___ a student.", pilihan: ["is", "are", "am", "be"], jawapan: 2 },
  { soalan: "Morning greeting?", pilihan: ["Good night", "Good evening", "Good morning", "Good afternoon"], jawapan: 2 },
  { soalan: "What do you say after receiving?", pilihan: ["Sorry", "Please", "Thank you", "Excuse me"], jawapan: 2 },
  { soalan: "What is this? 🐘", pilihan: ["lion", "giraffe", "elephant", "horse"], jawapan: 2 },
];

// Hardcoded soalan Jawi Darjah 1
const JAWI_D1: QuizQuestion[] = [
  { soalan: "Huruf Jawi → ا ialah?", pilihan: ["Ba", "Ta", "Alif", "Jim"], jawapan: 2 },
  { soalan: "Huruf Jawi → ب ialah?", pilihan: ["Alif", "Ba", "Ta", "Tha"], jawapan: 1 },
  { soalan: "Huruf Jawi → د ialah?", pilihan: ["Ra", "Zai", "Wau", "Dal"], jawapan: 3 },
  { soalan: "Huruf Jawi → م ialah?", pilihan: ["Nun", "Wau", "Mim", "Lam"], jawapan: 2 },
  { soalan: "Huruf Jawi → ن ialah?", pilihan: ["Mim", "Wau", "Nun", "Ya"], jawapan: 2 },
  { soalan: "Huruf berbunyi S ialah?", pilihan: ["ش", "ز", "س", "ص"], jawapan: 2 },
  { soalan: "Huruf berbunyi R ialah?", pilihan: ["د", "ر", "ز", "و"], jawapan: 1 },
  { soalan: "Huruf berbunyi K ialah?", pilihan: ["ق", "غ", "ک", "خ"], jawapan: 2 },
  { soalan: "Huruf berbunyi L ialah?", pilihan: ["ن", "م", "ل", "و"], jawapan: 2 },
  { soalan: "Jawi → اِبُو bermaksud?", pilihan: ["abang", "ibu", "adik", "ayah"], jawapan: 1 },
  { soalan: "Jawi → اَيَه bermaksud?", pilihan: ["ibu", "abang", "ayah", "kakak"], jawapan: 2 },
  { soalan: "Jawi → كُوچيڠ bermaksud?", pilihan: ["anjing", "arnab", "kucing", "harimau"], jawapan: 2 },
  { soalan: "Jawi → بُکُو bermaksud?", pilihan: ["pen", "meja", "buku", "kerusi"], jawapan: 2 },
  { soalan: "Jawi → رومه bermaksud?", pilihan: ["sekolah", "masjid", "rumah", "kedai"], jawapan: 2 },
  { soalan: "Huruf berbunyi W ialah?", pilihan: ["ي", "ن", "م", "و"], jawapan: 3 },
];

// Hardcoded soalan Pendidikan Islam Darjah 1
const PENDIDIKAN_ISLAM_D1: QuizQuestion[] = [
  { soalan: "Berapa rukun Islam?", pilihan: ["3", "4", "5", "6"], jawapan: 2 },
  { soalan: "Rukun Islam pertama ialah?", pilihan: ["solat", "puasa", "zakat", "mengucap dua kalimah syahadah"], jawapan: 3 },
  { soalan: "Berapa kali solat sehari?", pilihan: ["3", "4", "5", "6"], jawapan: 2 },
  { soalan: "Solat waktu pagi ialah?", pilihan: ["Zohor", "Asar", "Subuh", "Isyak"], jawapan: 2 },
  { soalan: "Berapa rukun Iman?", pilihan: ["4", "5", "6", "7"], jawapan: 2 },
  { soalan: "Kita baca bismillah sebelum?", pilihan: ["tidur", "bermain", "makan", "berlari"], jawapan: 2 },
  { soalan: "Ucapan bila berjumpa seseorang?", pilihan: ["Terima kasih", "Selamat pagi", "Assalamualaikum", "Hai"], jawapan: 2 },
  { soalan: "Jawapan kepada salam ialah?", pilihan: ["Assalamualaikum", "Alhamdulillah", "Waalaikumussalam", "Bismillah"], jawapan: 2 },
  { soalan: "Apakah yang kita ucap bila bersin?", pilihan: ["diam sahaja", "ketawa", "Alhamdulillah", "lari"], jawapan: 2 },
  { soalan: "Adab makan yang betul?", pilihan: ["tangan kiri", "berdiri", "berlari", "tangan kanan"], jawapan: 3 },
  { soalan: "Kita perlu menghormati?", pilihan: ["ibu bapa sahaja", "guru sahaja", "kawan sahaja", "ibu bapa guru dan semua orang"], jawapan: 3 },
  { soalan: "Berapa rakaat solat Subuh?", pilihan: ["1", "2", "3", "4"], jawapan: 1 },
  { soalan: "Berapa rakaat solat Maghrib?", pilihan: ["2", "3", "4", "5"], jawapan: 1 },
  { soalan: "Kitab suci umat Islam ialah?", pilihan: ["Injil", "Zabur", "Taurat", "Al-Quran"], jawapan: 3 },
  { soalan: "Nabi kita ialah?", pilihan: ["Nabi Isa", "Nabi Musa", "Nabi Ibrahim", "Nabi Muhammad SAW"], jawapan: 3 },
];

// Hardcoded soalan Sains Darjah 1
const SAINS_D1: QuizQuestion[] = [
  { soalan: "Berapa deria yang kita ada?", pilihan: ["3", "4", "5", "6"], jawapan: 2 },
  { soalan: "Deria untuk melihat ialah?", pilihan: ["hidung", "telinga", "mata", "tangan"], jawapan: 2 },
  { soalan: "Deria untuk menghidu ialah?", pilihan: ["mata", "hidung", "telinga", "lidah"], jawapan: 1 },
  { soalan: "Fungsi telinga ialah?", pilihan: ["melihat", "menghidu", "merasa", "mendengar"], jawapan: 3 },
  { soalan: "Lidah digunakan untuk?", pilihan: ["melihat", "mendengar", "merasa", "menghidu"], jawapan: 2 },
  { soalan: "Manakah haiwan?", pilihan: ["pokok", "bunga", "kucing", "rumput"], jawapan: 2 },
  { soalan: "Makanan arnab ialah?", pilihan: ["daging", "ikan", "sayur dan wortel", "buah sahaja"], jawapan: 2 },
  { soalan: "Tumbuhan perlukan?", pilihan: ["air sahaja", "cahaya air dan udara", "tanah sahaja", "baja sahaja"], jawapan: 1 },
  { soalan: "Haiwan yang boleh terbang?", pilihan: ["ikan", "arnab", "burung", "kucing"], jawapan: 2 },
  { soalan: "Bahagian tumbuhan yang serap air?", pilihan: ["daun", "batang", "bunga", "akar"], jawapan: 3 },
  { soalan: "Langit berawan gelap bermakna?", pilihan: ["panas terik", "berangin", "akan hujan", "bersalji"], jawapan: 2 },
  { soalan: "Air berubah jadi wap apabila?", pilihan: ["dibekukan", "dipanaskan", "didinginkan", "dicampur gula"], jawapan: 1 },
  { soalan: "Sumber cahaya semula jadi ialah?", pilihan: ["lampu", "lilin", "matahari", "suluh"], jawapan: 2 },
  { soalan: "Ais apabila terdedah kepada haba akan?", pilihan: ["membeku", "membesar", "cair", "mengeras"], jawapan: 2 },
  { soalan: "Udara yang kita sedut mengandungi?", pilihan: ["karbon dioksida", "hidrogen", "oksigen", "nitrogen"], jawapan: 2 },
];

function KuizPage() {
  const navigate = useNavigate();
  const { darjahId, subjekId } = useParams({ from: "/darjah/$darjahId_/$subjekId_/kuiz" });
  const { user, loading } = useAuth();
  const darjah = getDarjah(darjahId) ?? { id: darjahId, label: `Darjah ${darjahId}`, locked: false };
  const subjek = getSubjek(subjekId) ?? { id: subjekId, title: subjekId.charAt(0).toUpperCase() + subjekId.slice(1) };
  const isMatematikD1 = darjahId === "1" && subjekId === "matematik";
  const isBahasaMelayuD1 = darjahId === "1" && subjekId === "bahasa-melayu";
  const isBahasaInggerisD1 = darjahId === "1" && subjekId === "bahasa-inggeris";
  const isJawiD1 = darjahId === "1" && subjekId === "jawi";
  const isPendidikanIslamD1 = darjahId === "1" && subjekId === "pendidikan-islam";
  const isSainsD1 = darjahId === "1" && subjekId === "sains";
  const fromBank = isMatematikD1 || isBahasaMelayuD1 || isBahasaInggerisD1 || isJawiD1 || isPendidikanIslamD1 || isSainsD1 ? [] : getQuiz(darjahId, subjekId);
  const soalanList: QuizQuestion[] = isMatematikD1
    ? MATEMATIK_D1
    : isBahasaMelayuD1
      ? BAHASA_MELAYU_D1
      : isBahasaInggerisD1
        ? BAHASA_INGGERIS_D1
        : isJawiD1
          ? JAWI_D1
          : isPendidikanIslamD1
            ? PENDIDIKAN_ISLAM_D1
            : isSainsD1
              ? SAINS_D1
              : fromBank && fromBank.length > 0
                ? fromBank
                : [];

  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [skor, setSkor] = useState(0);
  const [selesai, setSelesai] = useState(false);

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

  if (!darjah || darjah.locked || !subjek) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Tidak dijumpai</h1>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </main>
      </div>
    );
  }

  if (!soalanList || soalanList.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader stars={42} onLogout={handleLogout} />
        <main className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <Link
            to="/darjah/$darjahId/$subjekId"
            params={{ darjahId, subjekId }}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="mt-8 rounded-3xl bg-gradient-hero p-10 shadow-card">
            <h1 className="font-display text-3xl font-extrabold text-foreground">Kuiz akan datang</h1>
            <p className="mt-2 text-muted-foreground">
              Kuiz untuk {subjek.title} ({darjah.label}) sedang disediakan. Nantikan!
            </p>
          </div>
        </main>
      </div>
    );
  }

  const soalan = soalanList[i];
  const betul = pilih !== null && pilih === soalan.jawapan;
  const bintang = skor >= Math.ceil(soalanList.length * 0.8) ? 3 : skor >= Math.ceil(soalanList.length * 0.5) ? 2 : skor >= 1 ? 1 : 0;

  const seterusnya = () => {
    if (i + 1 >= soalanList.length) setSelesai(true);
    else {
      setI(i + 1);
      setPilih(null);
    }
  };

  const handlePilih = (idx: number) => {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soalan.jawapan) setSkor((s) => s + 1);
  };

  const reset = () => {
    setI(0);
    setPilih(null);
    setSkor(0);
    setSelesai(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader stars={42} onLogout={handleLogout} />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/darjah/$darjahId/$subjekId"
          params={{ darjahId, subjekId }}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Aktiviti
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-primary shadow-soft">
            {darjah.label}
          </span>
          <span className="rounded-full bg-card px-4 py-1.5 font-display text-xs font-bold text-gold-foreground shadow-soft">
            {subjek.title}
          </span>
          <span className="rounded-full bg-gradient-primary px-4 py-1.5 font-display text-xs font-extrabold text-primary-foreground shadow-soft">
            Kuiz
          </span>
        </div>

        {!selesai ? (
          <>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-muted-foreground">
                Soalan {i + 1} / {soalanList.length}
              </span>
              <span className="rounded-full bg-gradient-gold px-3 py-1 font-display text-xs font-extrabold text-gold-foreground">
                Skor: {skor}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${((i + (pilih !== null ? 1 : 0)) / soalanList.length) * 100}%` }}
              />
            </div>

            <div className="mt-6 rounded-3xl bg-card p-6 shadow-card md:p-8">
              <h1 className="font-display text-2xl font-extrabold leading-snug text-foreground md:text-3xl">
                {soalan.soalan}
              </h1>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {soalan.pilihan.map((p, idx) => {
                  const isPilih = pilih === idx;
                  const showBetul = pilih !== null && idx === soalan.jawapan;
                  const showSalah = isPilih && idx !== soalan.jawapan;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePilih(idx)}
                      disabled={pilih !== null}
                      className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left font-bold transition ${
                        showBetul
                          ? "border-success bg-success/10 text-success"
                          : showSalah
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : pilih !== null
                              ? "border-border bg-secondary/50 text-muted-foreground"
                              : "border-border bg-background hover:-translate-y-0.5 hover:border-primary hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-base font-extrabold ${
                          showBetul
                            ? "bg-success text-success-foreground"
                            : showSalah
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}
                      >
                        {showBetul ? <Check className="h-5 w-5" /> : showSalah ? <X className="h-5 w-5" /> : String.fromCharCode(65 + idx)}
                      </span>
                      <span>{p}</span>
                    </button>
                  );
                })}
              </div>

              {pilih !== null && (
                <div
                  className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${
                    betul ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm font-bold">
                    {betul ? "Syabas! Jawapan kamu betul! 🎉" : "Hampir betul! Cuba lagi pada soalan seterusnya."}
                    {soalan.nota && <div className="mt-1 font-medium opacity-90">{soalan.nota}</div>}
                  </div>
                </div>
              )}

              <button
                onClick={seterusnya}
                disabled={pilih === null}
                className="mt-6 w-full rounded-2xl bg-gradient-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {i + 1 >= soalanList.length ? "Selesai" : "Soalan Seterusnya →"}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-3xl bg-gradient-hero p-8 text-center shadow-card md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <Sparkles className="h-10 w-10 text-gold-foreground" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-4xl">
              Tahniah! 🎉
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Kamu jawab betul <span className="font-extrabold text-primary">{skor}</span> daripada{" "}
              <span className="font-extrabold text-primary">{soalanList.length}</span> soalan
            </p>
            <div className="mt-5 flex justify-center">
              <StarReward earned={bintang} />
            </div>
            <p className="mt-4 font-display font-extrabold text-foreground">
              {bintang === 3 ? "Cemerlang! Kamu hebat!" : bintang === 2 ? "Bagus sekali!" : bintang === 1 ? "Terus berusaha!" : "Jangan putus asa, cuba lagi!"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-gradient-primary px-6 py-3 font-display font-extrabold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Cuba Lagi
              </button>
              <Link
                to="/darjah/$darjahId/$subjekId"
                params={{ darjahId, subjekId }}
                className="rounded-full bg-card px-6 py-3 font-display font-extrabold text-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                Kembali ke Aktiviti
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
