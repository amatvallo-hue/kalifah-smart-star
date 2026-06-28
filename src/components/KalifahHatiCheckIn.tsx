import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X } from "lucide-react";

type Emotion = "gembira" | "sedih" | "marah" | "takut" | "tenang";
type Situation = "kawan" | "study" | "guru" | "rumah" | "parents" | "aktiviti" | "lain";

const EMOTIONS: { id: Emotion; label: string; emoji: string; color: string; bg: string }[] = [
  { id: "gembira",  label: "Gembira",  emoji: "😊", color: "#1A7A4A", bg: "#E8F5EE" },
  { id: "sedih",    label: "Sedih",    emoji: "😢", color: "#185FA5", bg: "#E8F0FB" },
  { id: "marah",    label: "Marah",    emoji: "😡", color: "#A32D2D", bg: "#FDECEA" },
  { id: "takut",    label: "Takut",    emoji: "😨", color: "#7A5000", bg: "#FEF6E4" },
  { id: "tenang",   label: "Tenang",   emoji: "😌", color: "#0F6E56", bg: "#E1F5EE" },
];

const INTENSITIES = [
  { val: 1, label: "Sedikit" },
  { val: 3, label: "Ringan" },
  { val: 5, label: "Biasa" },
  { val: 7, label: "Sangat" },
  { val: 9, label: "Teramat" },
];

const SITUATIONS: { id: Situation; label: string; emoji: string }[] = [
  { id: "kawan",    label: "Kawan",     emoji: "👫" },
  { id: "study",    label: "Study",     emoji: "📚" },
  { id: "guru",     label: "Guru",      emoji: "👩‍🏫" },
  { id: "rumah",    label: "Rumah",     emoji: "🏠" },
  { id: "parents",  label: "Parents",   emoji: "👨‍👩‍👧" },
  { id: "aktiviti", label: "Aktiviti",  emoji: "🎮" },
  { id: "lain",     label: "Lain-lain", emoji: "💭" },
];

interface Props {
  userId: string;
  onDone: () => void;
}

export function KalifahHatiCheckIn({ userId, onDone }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedEmotion = EMOTIONS.find((e) => e.id === emotion);

  async function handleSave() {
    if (!emotion || !situation) return;
    setSaving(true);
    await supabase.from("emotion_checkins").insert({
      user_id: userId,
      emotion,
      intensity,
      situation,
    });
    // Notify parent if triggered
    try {
      const { data: cp } = await supabase
        .from("child_profiles")
        .select("child_name")
        .eq("child_user_id", userId)
        .maybeSingle();

      await fetch(
        "https://pgpkqbdyxoejwvubluqq.supabase.co/functions/v1/notify-hati-parent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            child_user_id: userId,
            emotion,
            intensity,
            situation,
            child_name: cp?.child_name ?? "Anak anda",
          }),
        }
      );
    } catch (_) {
      // Silent fail — jangan block UX kalau email gagal
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
            <h2 className="text-lg font-bold text-gray-800">Kalifah Hati</h2>
          </div>
          <button
            onClick={onDone}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          {/* STEP 1 — Pilih emosi */}
          {step === 1 && (
            <>
              <p className="mb-4 text-center text-base font-semibold text-gray-700">
                Macam mana perasaan awak hari ni?
              </p>

              <div className="mb-4 grid grid-cols-5 gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEmotion(e.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-all"
                    style={{
                      background: emotion === e.id ? e.bg : "#F9FAFB",
                      borderColor: emotion === e.id ? e.color : "#E5E7EB",
                      borderWidth: emotion === e.id ? 2 : 1,
                    }}
                  >
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: emotion === e.id ? e.color : "#6B7280" }}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>

              {emotion && (
                <div className="mb-4">
                  <p className="mb-2 text-center text-sm text-gray-600">
                    Berapa kuat? —{" "}
                    <span className="font-bold" style={{ color: selectedEmotion?.color }}>
                      {INTENSITIES.find((i) => i.val === intensity)?.label}
                    </span>
                  </p>

                  <div className="flex justify-center gap-2">
                    {INTENSITIES.map((i) => (
                      <button
                        key={i.val}
                        onClick={() => setIntensity(i.val)}
                        className="h-9 w-9 rounded-full border text-sm font-bold transition-all"
                        style={{
                          background: intensity === i.val ? selectedEmotion?.color : "#F3F4F6",
                          color: intensity === i.val ? "#fff" : "#9CA3AF",
                          borderColor: intensity === i.val ? selectedEmotion?.color : "#E5E7EB",
                        }}
                      >
                        {i.val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!emotion}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "#1A7A4A" }}
              >
                Seterusnya →
              </button>
            </>
          )}

          {/* STEP 2 — Pilih situasi */}
          {step === 2 && (
            <>
              <p className="mb-1 text-center text-base font-semibold text-gray-700">
                Kenapa rasa macam tu?
              </p>
              <p className="mb-4 text-center text-xs text-gray-400">Pilih yang paling dekat</p>

              <div className="mb-6 grid grid-cols-4 gap-2">
                {SITUATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSituation(s.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-all"
                    style={{
                      background: situation === s.id ? "#E8F5EE" : "#F9FAFB",
                      borderColor: situation === s.id ? "#1A7A4A" : "#E5E7EB",
                      borderWidth: situation === s.id ? 2 : 1,
                    }}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: situation === s.id ? "#1A7A4A" : "#6B7280" }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  ← Balik
                </button>
                <button
                  onClick={handleSave}
                  disabled={!situation || saving}
                  className="flex-1 rounded-xl bg-green-700 py-3 text-sm font-bold text-white transition-all hover:bg-green-800 disabled:opacity-40"
                >
                  {saving ? "Menyimpan..." : "Simpan ✓"}
                </button>
              </div>
            </>
          )}

          <button
            onClick={onDone}
            className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Langkau buat masa ini
          </button>
        </div>
      </div>
    </div>
  );
}
