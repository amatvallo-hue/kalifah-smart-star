import { supabase } from "@/integrations/supabase/client";
import { SUBJEK_LIST } from "@/lib/curriculum";

export interface SimpanProgressInput {
  darjah: string;
  subjek: string;
  aktiviti: string;
  markah: number;
  jumlahSoalan: number;
  masaAmbil?: number; // saat
  topik?: string;
  /**
   * Kalau `true` (default), `user_stats.bab_selesai` akan +1 bila insert
   * baris user_progress baru. Untuk sesi multi-topik (contoh: latih-tubi
   * yang panggil simpanProgress sekali per topik), set `false` untuk semua
   * panggilan SELEPAS yang pertama supaya bab_selesai tak inflate.
   */
  bumpBabSelesai?: boolean;
}

export interface BadgeRow {
  id: string;
  kod: string;
  nama: string;
  ikon: string;
  created_at: string;
}



function todayKL(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function daysAgoKL(n: number): string {
  const t = new Date(todayKL() + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - n);
  return t.toISOString().slice(0, 10);
}

function kiraStreak(tarikhSet: Set<string>): number {
  let mula = tarikhSet.has(todayKL()) ? 0 : tarikhSet.has(daysAgoKL(1)) ? 1 : -1;
  if (mula < 0) return 0;
  let streak = 0;
  while (tarikhSet.has(daysAgoKL(mula))) {
    streak++;
    mula++;
  }
  return streak;
}

async function awardBadge(userId: string, kod: string, nama: string, ikon: string) {
  // ON CONFLICT DO NOTHING via ignoreDuplicates
  await supabase
    .from("user_badges")
    .upsert({ user_id: userId, kod, nama, ikon }, { onConflict: "user_id,kod", ignoreDuplicates: true });
}

async function semakDanBeriLencana(userId: string, input: SimpanProgressInput) {
  try {
    // Lencana Cemerlang — markah penuh dalam kuiz
    if (input.aktiviti === "kuiz" && input.jumlahSoalan > 0 && input.markah >= input.jumlahSoalan) {
      await awardBadge(userId, "cemerlang", "Cemerlang", "🏆");
    }

    // Lencana Pakar Subjek — syarat ketat:
    //   • Kuiz: purata skor semua kuiz subjek ≥ 70%
    //   • Latih Tubi: jumlah soalan ≥ 100 DAN purata ≥ 70%
    //   • Nota: semua topik nota (untuk darjah + subjek) sudah ditick
    const { data: progSubjek } = await supabase
      .from("user_progress")
      .select("aktiviti, peratus, markah, jumlah_soalan, topik, darjah")
      .eq("user_id", userId)
      .eq("subjek", input.subjek);

    const rows = progSubjek ?? [];
    const kuizRows = rows.filter((r) => r.aktiviti === "kuiz");
    const ltRows = rows.filter((r) => r.aktiviti === "latih-tubi");
    const notaRows = rows.filter((r) => r.aktiviti === "nota" && r.darjah === String(input.darjah));

    const kuizPurata = kuizRows.length
      ? kuizRows.reduce((a, r) => a + Number(r.peratus ?? 0), 0) / kuizRows.length
      : 0;
    const kuizOk = kuizRows.length > 0 && kuizPurata >= 70;

    const ltJumlahSoalan = ltRows.reduce((a, r) => a + Number(r.jumlah_soalan ?? 0), 0);
    const ltMarkah = ltRows.reduce((a, r) => a + Number(r.markah ?? 0), 0);
    const ltPurata = ltJumlahSoalan > 0 ? (ltMarkah / ltJumlahSoalan) * 100 : 0;
    const ltOk = ltJumlahSoalan >= 100 && ltPurata >= 70;

    // Nota: ambil semua topik dari nota_topik untuk darjah+subjek, semak setiap satu ada di user_progress
    const { data: notaTopikList } = await supabase
      .from("nota_topik")
      .select("topik")
      .eq("darjah", Number(input.darjah))
      .eq("subjek", input.subjek);
    const semuaTopikNota = (notaTopikList ?? []).map((r: any) => r.topik);
    const notaTickSet = new Set(notaRows.map((r) => r.topik).filter(Boolean) as string[]);
    const notaOk =
      semuaTopikNota.length > 0 && semuaTopikNota.every((t) => notaTickSet.has(t));

    if (kuizOk && ltOk && notaOk) {
      const sj = SUBJEK_LIST.find((s) => s.id === input.subjek);
      if (sj) await awardBadge(userId, `subjek-${sj.id}`, `Pakar ${sj.title}`, "🎖️");
    }

    // Lencana streak — Bintang ⭐ (7) & Emas 🥇 (30)
    const { data: stats } = await supabase
      .from("user_stats")
      .select("tarikh")
      .eq("user_id", userId)
      .order("tarikh", { ascending: false })
      .limit(60);
    const streak = kiraStreak(new Set((stats ?? []).map((r) => r.tarikh)));
    if (streak >= 7) await awardBadge(userId, "bintang", "Bintang 7 Hari", "⭐");
    if (streak >= 30) await awardBadge(userId, "emas", "Emas 30 Hari", "🥇");
  } catch (e) {
    console.warn("semakDanBeriLencana gagal:", e);
  }
}

export async function catatHariAktif(): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return;
    await supabase.from("user_stats").upsert(
      { user_id: userId, tarikh: todayKL(), soalan_dijawab: 0, masa_belajar: 0, bab_selesai: 0 },
      { onConflict: "user_id,tarikh", ignoreDuplicates: true }
    );
  } catch (e) {
    console.warn("catatHariAktif gagal:", e);
  }
}

/** Simpan satu aktiviti selesai + kemas kini statistik harian + beri lencana. Senyap kalau gagal / tetamu. */
export async function simpanProgress(input: SimpanProgressInput): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return;

    const jumlah = Math.max(1, input.jumlahSoalan || 1);
    const markah = Math.max(0, input.markah || 0);
    const peratus = Math.round((markah / jumlah) * 100);
    const masa = Math.max(0, input.masaAmbil ?? 0);

    // ── 1) Simpan rekod per (user,darjah,subjek,aktiviti[,topik])
    //    Untuk Latih Tubi + topik: ACCUMULATE (SUM) — track prestasi terkumpul.
    //    Aktiviti lain: simpan rekod terbaik (DEDUP) sahaja.
    let progressQuery = supabase
      .from("user_progress")
      .select("id, peratus, masa_ambil, markah, jumlah_soalan")
      .eq("user_id", userId)
      .eq("darjah", String(input.darjah))
      .eq("subjek", input.subjek)
      .eq("aktiviti", input.aktiviti);

    if (input.topik) {
      progressQuery = progressQuery.eq("topik", input.topik);
    } else {
      progressQuery = progressQuery.is("topik", null);
    }

    const { data: existing } = await progressQuery.maybeSingle();
    const isLatihTubiTopik = input.aktiviti === "latih-tubi" && !!input.topik;

    if (!existing) {
      await supabase.from("user_progress").insert({
        user_id: userId,
        darjah: String(input.darjah),
        subjek: input.subjek,
        aktiviti: input.aktiviti,
        topik: input.topik ?? null,
        markah,
        jumlah_soalan: jumlah,
        peratus,
        masa_ambil: masa,
      });
    } else if (isLatihTubiTopik) {
      const newMarkah = Number((existing as any).markah ?? 0) + markah;
      const newJumlah = Number((existing as any).jumlah_soalan ?? 0) + jumlah;
      const newPeratus = newJumlah > 0 ? Math.round((newMarkah / newJumlah) * 100) : 0;
      const newMasa = Number(existing.masa_ambil ?? 0) + masa;
      await supabase
        .from("user_progress")
        .update({
          markah: newMarkah,
          jumlah_soalan: newJumlah,
          peratus: newPeratus,
          masa_ambil: newMasa,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else if (peratus > Number(existing.peratus)) {
      await supabase
        .from("user_progress")
        .update({
          markah,
          jumlah_soalan: jumlah,
          peratus,
          masa_ambil: masa,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }

    // ── 2) STATS HARIAN — upsert atomic supaya tak ada race condition
    const tarikh = todayKL();
    const minit = Math.max(0, Math.round(masa / 60));
    const { data: statRow } = await supabase
      .from("user_stats")
      .select("id, soalan_dijawab, masa_belajar, bab_selesai")
      .eq("user_id", userId)
      .eq("tarikh", tarikh)
      .maybeSingle();

    if (statRow) {
      await supabase.from("user_stats").update({
        soalan_dijawab: (statRow.soalan_dijawab ?? 0) + jumlah,
        masa_belajar: (statRow.masa_belajar ?? 0) + minit,
        bab_selesai: (statRow.bab_selesai ?? 0) + (existing ? 0 : 1),
        updated_at: new Date().toISOString(),
      }).eq("id", statRow.id);
    } else {
      await supabase.from("user_stats").upsert(
        { user_id: userId, tarikh, soalan_dijawab: jumlah, masa_belajar: minit, bab_selesai: 1 },
        { onConflict: "user_id,tarikh", ignoreDuplicates: false }
      );
    }

    // ── 3) Catat hari aktif (streak hanya kira bila ada aktiviti)
    await catatHariAktif();

    // ── 4) Lencana
    await semakDanBeriLencana(userId, input);
  } catch (e) {
    console.warn("simpanProgress gagal:", e);
  }
}
