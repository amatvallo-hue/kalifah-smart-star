// Auto-grading untuk soalan Isi Tempat Kosong.
// Strategi: exact match → substring match → fuzzy typo match (Levenshtein ≤ 2).

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()\[\]]/g, "")
    .replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export interface SoalanIsiKosong {
  jawapan_utama: string;
  jawapan_alternatif: string;
  keyword_haram: string | null;
  feedback_betul: string;
  feedback_salah: string;
}

export interface GradeResult {
  betul: boolean;
  feedback: string;
}

export function gradeAnswer(userInput: string, soalan: SoalanIsiKosong): GradeResult {
  const normalized = normalize(userInput);

  if (!normalized) {
    return { betul: false, feedback: soalan.feedback_salah };
  }

  // 1. Keyword haram — kalau ada, terus salah
  if (soalan.keyword_haram) {
    const haramList = soalan.keyword_haram.split("|").map((k) => normalize(k));
    for (const haram of haramList) {
      if (haram && normalized.includes(haram)) {
        return { betul: false, feedback: soalan.feedback_salah };
      }
    }
  }

  const acceptedList = (soalan.jawapan_alternatif || soalan.jawapan_utama)
    .split("|")
    .map((a) => normalize(a))
    .filter(Boolean);

  // 2. Exact match
  for (const accepted of acceptedList) {
    if (normalized === accepted) {
      return { betul: true, feedback: soalan.feedback_betul };
    }
  }

  // 3. Substring match
  for (const accepted of acceptedList) {
    if (accepted && normalized.includes(accepted)) {
      return { betul: true, feedback: soalan.feedback_betul };
    }
  }

  // 4. Fuzzy typo match — hanya untuk perkataan ≥ 4 huruf
  for (const accepted of acceptedList) {
    if (accepted.length >= 4) {
      const distance = levenshtein(normalized, accepted);
      if (distance <= 2) {
        return { betul: true, feedback: soalan.feedback_betul };
      }
    }
  }

  return { betul: false, feedback: soalan.feedback_salah };
}
