import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { simpanProgress } from "@/lib/progress";
import { useAward } from "@/hooks/use-award";

type Jawapan = number | string;
type Soalan = { soalan: string; jawapan: Jawapan; pilihan: Jawapan[] };

const TOPICS: Record<string, Record<string, Soalan[]>> = {
  "4": {
    "Nombor Bulat": [
      { soalan: "3 456 + 2 123 = ?", jawapan: 5579, pilihan: [5577, 5578, 5579, 5580] },
      { soalan: "7 890 - 3 456 = ?", jawapan: 4434, pilihan: [4432, 4433, 4434, 4435] },
      { soalan: "245 × 3 = ?", jawapan: 735, pilihan: [733, 734, 735, 736] },
      { soalan: "648 ÷ 4 = ?", jawapan: 162, pilihan: [160, 161, 162, 163] },
      { soalan: "5 000 - 1 234 = ?", jawapan: 3766, pilihan: [3764, 3765, 3766, 3767] },
      { soalan: "123 × 4 = ?", jawapan: 492, pilihan: [490, 491, 492, 493] },
      { soalan: "720 ÷ 6 = ?", jawapan: 120, pilihan: [118, 119, 120, 121] },
      { soalan: "2 345 + 3 678 = ?", jawapan: 6023, pilihan: [6021, 6022, 6023, 6024] },
      { soalan: "9 000 - 4 567 = ?", jawapan: 4433, pilihan: [4431, 4432, 4433, 4434] },
      { soalan: "312 × 3 = ?", jawapan: 936, pilihan: [934, 935, 936, 937] },
    ],
    "Pecahan": [
      { soalan: "1/2 + 1/4 = ?", jawapan: "3/4", pilihan: ["1/4", "2/4", "3/4", "4/4"] },
      { soalan: "3/4 - 1/4 = ?", jawapan: "2/4", pilihan: ["1/4", "2/4", "3/4", "4/4"] },
      { soalan: "1/3 + 1/3 = ?", jawapan: "2/3", pilihan: ["1/3", "2/3", "3/3", "4/3"] },
      { soalan: "5/6 - 1/6 = ?", jawapan: "4/6", pilihan: ["2/6", "3/6", "4/6", "5/6"] },
      { soalan: "1/2 + 1/6 = ?", jawapan: "4/6", pilihan: ["2/6", "3/6", "4/6", "5/6"] },
      { soalan: "3/5 - 1/5 = ?", jawapan: "2/5", pilihan: ["1/5", "2/5", "3/5", "4/5"] },
      { soalan: "2/3 + 1/6 = ?", jawapan: "5/6", pilihan: ["3/6", "4/6", "5/6", "6/6"] },
      { soalan: "7/8 - 3/8 = ?", jawapan: "4/8", pilihan: ["2/8", "3/8", "4/8", "5/8"] },
      { soalan: "1/4 + 2/4 = ?", jawapan: "3/4", pilihan: ["1/4", "2/4", "3/4", "4/4"] },
      { soalan: "5/6 - 2/6 = ?", jawapan: "3/6", pilihan: ["1/6", "2/6", "3/6", "4/6"] },
    ],
    "Perpuluhan": [
      { soalan: "2.5 + 1.3 = ?", jawapan: 3.8, pilihan: [3.6, 3.7, 3.8, 3.9] },
      { soalan: "5.7 - 2.3 = ?", jawapan: 3.4, pilihan: [3.2, 3.3, 3.4, 3.5] },
      { soalan: "4.2 + 3.5 = ?", jawapan: 7.7, pilihan: [7.5, 7.6, 7.7, 7.8] },
      { soalan: "8.9 - 4.4 = ?", jawapan: 4.5, pilihan: [4.3, 4.4, 4.5, 4.6] },
      { soalan: "3.6 + 2.8 = ?", jawapan: 6.4, pilihan: [6.2, 6.3, 6.4, 6.5] },
      { soalan: "7.5 - 3.2 = ?", jawapan: 4.3, pilihan: [4.1, 4.2, 4.3, 4.4] },
      { soalan: "1.8 + 4.6 = ?", jawapan: 6.4, pilihan: [6.2, 6.3, 6.4, 6.5] },
      { soalan: "9.3 - 5.1 = ?", jawapan: 4.2, pilihan: [4.0, 4.1, 4.2, 4.3] },
      { soalan: "2.7 + 5.4 = ?", jawapan: 8.1, pilihan: [7.9, 8.0, 8.1, 8.2] },
      { soalan: "6.8 - 2.5 = ?", jawapan: 4.3, pilihan: [4.1, 4.2, 4.3, 4.4] },
    ],
    "Wang": [
      { soalan: "RM 5.50 + RM 3.20 = ?", jawapan: "RM 8.70", pilihan: ["RM 8.50", "RM 8.60", "RM 8.70", "RM 8.80"] },
      { soalan: "RM 10.00 - RM 4.50 = ?", jawapan: "RM 5.50", pilihan: ["RM 5.30", "RM 5.40", "RM 5.50", "RM 5.60"] },
      { soalan: "RM 7.30 + RM 2.40 = ?", jawapan: "RM 9.70", pilihan: ["RM 9.50", "RM 9.60", "RM 9.70", "RM 9.80"] },
      { soalan: "RM 15.00 - RM 6.75 = ?", jawapan: "RM 8.25", pilihan: ["RM 8.05", "RM 8.15", "RM 8.25", "RM 8.35"] },
      { soalan: "RM 3.60 × 3 = ?", jawapan: "RM 10.80", pilihan: ["RM 10.60", "RM 10.70", "RM 10.80", "RM 10.90"] },
      { soalan: "RM 12.00 ÷ 4 = ?", jawapan: "RM 3.00", pilihan: ["RM 2.80", "RM 2.90", "RM 3.00", "RM 3.10"] },
      { soalan: "RM 8.45 + RM 4.30 = ?", jawapan: "RM 12.75", pilihan: ["RM 12.55", "RM 12.65", "RM 12.75", "RM 12.85"] },
      { soalan: "RM 20.00 - RM 13.50 = ?", jawapan: "RM 6.50", pilihan: ["RM 6.30", "RM 6.40", "RM 6.50", "RM 6.60"] },
      { soalan: "RM 4.25 × 4 = ?", jawapan: "RM 17.00", pilihan: ["RM 16.80", "RM 16.90", "RM 17.00", "RM 17.10"] },
      { soalan: "RM 18.00 ÷ 3 = ?", jawapan: "RM 6.00", pilihan: ["RM 5.80", "RM 5.90", "RM 6.00", "RM 6.10"] },
    ],
    "Masa": [
      { soalan: "2 jam + 45 minit = ? minit", jawapan: 165, pilihan: [163, 164, 165, 166] },
      { soalan: "3 jam 20 minit - 1 jam 10 minit = ?", jawapan: "2 jam 10 minit", pilihan: ["1 jam 50 minit", "2 jam 00 minit", "2 jam 10 minit", "2 jam 20 minit"] },
      { soalan: "90 minit = ? jam ? minit", jawapan: "1 jam 30 minit", pilihan: ["1 jam 10 minit", "1 jam 20 minit", "1 jam 30 minit", "1 jam 40 minit"] },
      { soalan: "4 jam 15 minit + 2 jam 30 minit = ?", jawapan: "6 jam 45 minit", pilihan: ["6 jam 25 minit", "6 jam 35 minit", "6 jam 45 minit", "6 jam 55 minit"] },
      { soalan: "150 minit = ? jam ? minit", jawapan: "2 jam 30 minit", pilihan: ["2 jam 10 minit", "2 jam 20 minit", "2 jam 30 minit", "2 jam 40 minit"] },
      { soalan: "5 jam - 2 jam 45 minit = ?", jawapan: "2 jam 15 minit", pilihan: ["1 jam 55 minit", "2 jam 05 minit", "2 jam 15 minit", "2 jam 25 minit"] },
      { soalan: "1 jam 40 minit + 1 jam 35 minit = ?", jawapan: "3 jam 15 minit", pilihan: ["2 jam 55 minit", "3 jam 05 minit", "3 jam 15 minit", "3 jam 25 minit"] },
      { soalan: "210 minit = ? jam ? minit", jawapan: "3 jam 30 minit", pilihan: ["3 jam 10 minit", "3 jam 20 minit", "3 jam 30 minit", "3 jam 40 minit"] },
      { soalan: "6 jam 50 minit - 3 jam 20 minit = ?", jawapan: "3 jam 30 minit", pilihan: ["3 jam 10 minit", "3 jam 20 minit", "3 jam 30 minit", "3 jam 40 minit"] },
      { soalan: "2 jam 55 minit + 1 jam 20 minit = ?", jawapan: "4 jam 15 minit", pilihan: ["3 jam 55 minit", "4 jam 05 minit", "4 jam 15 minit", "4 jam 25 minit"] },
    ],
  },
  "5": {
    "Pecahan": [
      { soalan: "2/3 + 1/6 = ?", jawapan: "5/6", pilihan: ["3/6", "4/6", "5/6", "6/6"] },
      { soalan: "3/4 - 1/8 = ?", jawapan: "5/8", pilihan: ["3/8", "4/8", "5/8", "6/8"] },
      { soalan: "1/2 × 3/4 = ?", jawapan: "3/8", pilihan: ["1/8", "2/8", "3/8", "4/8"] },
      { soalan: "2/3 × 3/5 = ?", jawapan: "6/15", pilihan: ["4/15", "5/15", "6/15", "7/15"] },
      { soalan: "3/4 ÷ 3 = ?", jawapan: "1/4", pilihan: ["1/8", "1/6", "1/4", "1/3"] },
      { soalan: "5/6 - 1/3 = ?", jawapan: "3/6", pilihan: ["1/6", "2/6", "3/6", "4/6"] },
      { soalan: "1/4 + 3/8 = ?", jawapan: "5/8", pilihan: ["3/8", "4/8", "5/8", "6/8"] },
      { soalan: "4/5 × 1/2 = ?", jawapan: "4/10", pilihan: ["2/10", "3/10", "4/10", "5/10"] },
      { soalan: "7/8 - 1/4 = ?", jawapan: "5/8", pilihan: ["3/8", "4/8", "5/8", "6/8"] },
      { soalan: "2/3 ÷ 2 = ?", jawapan: "1/3", pilihan: ["1/6", "1/4", "1/3", "1/2"] },
    ],
    "Perpuluhan": [
      { soalan: "3.45 + 2.78 = ?", jawapan: 6.23, pilihan: [6.21, 6.22, 6.23, 6.24] },
      { soalan: "8.90 - 3.45 = ?", jawapan: 5.45, pilihan: [5.43, 5.44, 5.45, 5.46] },
      { soalan: "2.5 × 4 = ?", jawapan: 10.0, pilihan: [9.8, 9.9, 10.0, 10.1] },
      { soalan: "7.2 ÷ 3 = ?", jawapan: 2.4, pilihan: [2.2, 2.3, 2.4, 2.5] },
      { soalan: "4.56 + 3.78 = ?", jawapan: 8.34, pilihan: [8.32, 8.33, 8.34, 8.35] },
      { soalan: "9.75 - 4.25 = ?", jawapan: 5.5, pilihan: [5.48, 5.49, 5.5, 5.51] },
      { soalan: "3.6 × 5 = ?", jawapan: 18.0, pilihan: [17.8, 17.9, 18.0, 18.1] },
      { soalan: "8.4 ÷ 4 = ?", jawapan: 2.1, pilihan: [1.9, 2.0, 2.1, 2.2] },
      { soalan: "5.67 + 4.33 = ?", jawapan: 10.0, pilihan: [9.8, 9.9, 10.0, 10.1] },
      { soalan: "7.35 - 2.15 = ?", jawapan: 5.2, pilihan: [5.18, 5.19, 5.2, 5.21] },
    ],
    "Peratusan": [
      { soalan: "50% daripada 80 = ?", jawapan: 40, pilihan: [38, 39, 40, 41] },
      { soalan: "25% daripada 120 = ?", jawapan: 30, pilihan: [28, 29, 30, 31] },
      { soalan: "10% daripada 250 = ?", jawapan: 25, pilihan: [23, 24, 25, 26] },
      { soalan: "75% daripada 200 = ?", jawapan: 150, pilihan: [148, 149, 150, 151] },
      { soalan: "20% daripada 150 = ?", jawapan: 30, pilihan: [28, 29, 30, 31] },
      { soalan: "30% daripada 90 = ?", jawapan: 27, pilihan: [25, 26, 27, 28] },
      { soalan: "40% daripada 50 = ?", jawapan: 20, pilihan: [18, 19, 20, 21] },
      { soalan: "15% daripada 60 = ?", jawapan: 9, pilihan: [7, 8, 9, 10] },
      { soalan: "60% daripada 300 = ?", jawapan: 180, pilihan: [178, 179, 180, 181] },
      { soalan: "5% daripada 400 = ?", jawapan: 20, pilihan: [18, 19, 20, 21] },
    ],
    "Nisbah": [
      { soalan: "Nisbah 2:3, jumlah = 20. Bahagian pertama = ?", jawapan: 8, pilihan: [6, 7, 8, 9] },
      { soalan: "Nisbah 1:4, jumlah = 25. Bahagian pertama = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "Nisbah 3:5, jumlah = 40. Bahagian kedua = ?", jawapan: 25, pilihan: [23, 24, 25, 26] },
      { soalan: "Nisbah 2:3 = 8:?", jawapan: 12, pilihan: [10, 11, 12, 13] },
      { soalan: "Nisbah 3:4 = 9:?", jawapan: 12, pilihan: [10, 11, 12, 13] },
      { soalan: "Nisbah 1:3 = ?:12", jawapan: 4, pilihan: [2, 3, 4, 5] },
      { soalan: "Nisbah 5:2, jumlah = 35. Bahagian pertama = ?", jawapan: 25, pilihan: [23, 24, 25, 26] },
      { soalan: "Nisbah 2:5 = 6:?", jawapan: 15, pilihan: [13, 14, 15, 16] },
      { soalan: "Nisbah 4:3 = 12:?", jawapan: 9, pilihan: [7, 8, 9, 10] },
      { soalan: "Nisbah 3:7, jumlah = 50. Bahagian kedua = ?", jawapan: 35, pilihan: [33, 34, 35, 36] },
    ],
    "Integer": [
      { soalan: "-3 + 5 = ?", jawapan: 2, pilihan: [0, 1, 2, 3] },
      { soalan: "4 + (-6) = ?", jawapan: -2, pilihan: [-4, -3, -2, -1] },
      { soalan: "-8 + 3 = ?", jawapan: -5, pilihan: [-7, -6, -5, -4] },
      { soalan: "7 - (-3) = ?", jawapan: 10, pilihan: [8, 9, 10, 11] },
      { soalan: "-5 - (-2) = ?", jawapan: -3, pilihan: [-5, -4, -3, -2] },
      { soalan: "-4 + (-3) = ?", jawapan: -7, pilihan: [-9, -8, -7, -6] },
      { soalan: "6 - 9 = ?", jawapan: -3, pilihan: [-5, -4, -3, -2] },
      { soalan: "-2 + 8 = ?", jawapan: 6, pilihan: [4, 5, 6, 7] },
      { soalan: "3 - (-5) = ?", jawapan: 8, pilihan: [6, 7, 8, 9] },
      { soalan: "-6 - 4 = ?", jawapan: -10, pilihan: [-12, -11, -10, -9] },
    ],
  },
  "6": {
    "Integer": [
      { soalan: "-12 + 7 = ?", jawapan: -5, pilihan: [-7, -6, -5, -4] },
      { soalan: "(-3) × 4 = ?", jawapan: -12, pilihan: [-14, -13, -12, -11] },
      { soalan: "(-24) ÷ (-6) = ?", jawapan: 4, pilihan: [2, 3, 4, 5] },
      { soalan: "(-5) × (-3) = ?", jawapan: 15, pilihan: [13, 14, 15, 16] },
      { soalan: "18 ÷ (-3) = ?", jawapan: -6, pilihan: [-8, -7, -6, -5] },
      { soalan: "-9 + (-8) = ?", jawapan: -17, pilihan: [-19, -18, -17, -16] },
      { soalan: "(-7) × 5 = ?", jawapan: -35, pilihan: [-37, -36, -35, -34] },
      { soalan: "(-36) ÷ 4 = ?", jawapan: -9, pilihan: [-11, -10, -9, -8] },
      { soalan: "15 - (-8) = ?", jawapan: 23, pilihan: [21, 22, 23, 24] },
      { soalan: "(-4) × (-6) = ?", jawapan: 24, pilihan: [22, 23, 24, 25] },
    ],
    "Algebra": [
      { soalan: "2x + 3 = 11, x = ?", jawapan: 4, pilihan: [2, 3, 4, 5] },
      { soalan: "3x - 5 = 10, x = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "x/2 + 3 = 7, x = ?", jawapan: 8, pilihan: [6, 7, 8, 9] },
      { soalan: "4x = 28, x = ?", jawapan: 7, pilihan: [5, 6, 7, 8] },
      { soalan: "x + 9 = 15, x = ?", jawapan: 6, pilihan: [4, 5, 6, 7] },
      { soalan: "2x - 4 = 8, x = ?", jawapan: 6, pilihan: [4, 5, 6, 7] },
      { soalan: "3x + 6 = 18, x = ?", jawapan: 4, pilihan: [2, 3, 4, 5] },
      { soalan: "x/3 = 5, x = ?", jawapan: 15, pilihan: [13, 14, 15, 16] },
      { soalan: "5x - 10 = 15, x = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "2x + 7 = 19, x = ?", jawapan: 6, pilihan: [4, 5, 6, 7] },
    ],
    "Koordinat": [
      { soalan: "Titik (3, 5) — nilai x = ?", jawapan: 3, pilihan: [1, 2, 3, 4] },
      { soalan: "Titik (7, 2) — nilai y = ?", jawapan: 2, pilihan: [0, 1, 2, 3] },
      { soalan: "Titik (-4, 6) — nilai x = ?", jawapan: -4, pilihan: [-6, -5, -4, -3] },
      { soalan: "Titik (0, -3) — nilai y = ?", jawapan: -3, pilihan: [-5, -4, -3, -2] },
      { soalan: "Jarak antara (0,0) dan (3,4) = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "Titik (2, -5) — nilai y = ?", jawapan: -5, pilihan: [-7, -6, -5, -4] },
      { soalan: "Titik (-3, -3) berada di kuadran ke = ?", jawapan: 3, pilihan: [1, 2, 3, 4] },
      { soalan: "Titik (5, 0) — nilai y = ?", jawapan: 0, pilihan: [-2, -1, 0, 1] },
      { soalan: "Titik (-2, 4) berada di kuadran ke = ?", jawapan: 2, pilihan: [1, 2, 3, 4] },
      { soalan: "Titik (4, -3) berada di kuadran ke = ?", jawapan: 4, pilihan: [1, 2, 3, 4] },
    ],
    "Statistik": [
      { soalan: "Data: 3,5,7,9,11 — Min = ?", jawapan: 7, pilihan: [5, 6, 7, 8] },
      { soalan: "Data: 2,4,6,8,10 — Min = ?", jawapan: 6, pilihan: [4, 5, 6, 7] },
      { soalan: "Data: 1,3,5,7,9 — Median = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "Data: 4,4,6,8,8 — Mod = ?", jawapan: "4 dan 8", pilihan: ["4", "8", "4 dan 8", "6"] },
      { soalan: "Data: 10,20,30,40 — Min = ?", jawapan: 25, pilihan: [23, 24, 25, 26] },
      { soalan: "Data: 5,5,5,7,8 — Mod = ?", jawapan: 5, pilihan: [3, 4, 5, 6] },
      { soalan: "Data: 2,3,4,5,6 — Median = ?", jawapan: 4, pilihan: [2, 3, 4, 5] },
      { soalan: "Data: 6,8,10,12,14 — Min = ?", jawapan: 10, pilihan: [8, 9, 10, 11] },
      { soalan: "Data: 1,2,3,4,5,6 — Median = ?", jawapan: 3.5, pilihan: [2.5, 3.0, 3.5, 4.0] },
      { soalan: "Data: 7,7,8,9,9 — Mod = ?", jawapan: "7 dan 9", pilihan: ["7", "9", "7 dan 9", "8"] },
    ],
    "Geometri": [
      { soalan: "Luas segi empat sama sisi 6cm = ?", jawapan: 36, pilihan: [34, 35, 36, 37] },
      { soalan: "Perimeter segi tiga sama sisi 5cm = ?", jawapan: 15, pilihan: [13, 14, 15, 16] },
      { soalan: "Luas segi empat tepat 8cm × 5cm = ?", jawapan: 40, pilihan: [38, 39, 40, 41] },
      { soalan: "Perimeter segi empat tepat 6cm × 4cm = ?", jawapan: 20, pilihan: [18, 19, 20, 21] },
      { soalan: "Luas segi tiga alas 10cm tinggi 6cm = ?", jawapan: 30, pilihan: [28, 29, 30, 31] },
      { soalan: "Lilitan bulatan jejari 7cm (π=22/7) = ?", jawapan: 44, pilihan: [42, 43, 44, 45] },
      { soalan: "Luas bulatan jejari 7cm (π=22/7) = ?", jawapan: 154, pilihan: [152, 153, 154, 155] },
      { soalan: "Perimeter segi empat sama sisi 9cm = ?", jawapan: 36, pilihan: [34, 35, 36, 37] },
      { soalan: "Luas segi empat tepat 12cm × 7cm = ?", jawapan: 84, pilihan: [82, 83, 84, 85] },
      { soalan: "Luas segi tiga alas 8cm tinggi 9cm = ?", jawapan: 36, pilihan: [34, 35, 36, 37] },
    ],
  },
};

function Confetti() {
  const bits = Array.from({ length: 30 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 0.9 + Math.random() * 0.6;
        const colors = ["#06b6d4", "#a855f7", "#22d3ee", "#f0abfc", "#facc15"];
        const bg = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute top-0 h-2 w-2 rounded-sm"
            style={{
              left: `${left}%`,
              background: bg,
              boxShadow: `0 0 10px ${bg}`,
              animation: `nfall ${dur}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`@keyframes nfall { to { transform: translateY(480px) rotate(540deg); opacity: 0;} }`}</style>
    </div>
  );
}

const TIME_PER_Q = 20;

export function MatikNeonGame({ darjah, subjekId }: { darjah: string; subjekId: string }) {
  const award = useAward();
  const topics = useMemo(() => TOPICS[darjah] ?? {}, [darjah]);
  const topicNames = useMemo(() => Object.keys(topics), [topics]);
  const [topic, setTopic] = useState<string | null>(null);

  const soalan = useMemo<Soalan[]>(() => (topic ? topics[topic] ?? [] : []), [topic, topics]);
  const [idx, setIdx] = useState(0);
  const [markah, setMarkah] = useState(0);
  const [feedback, setFeedback] = useState<null | "ok" | "no">(null);
  const [habis, setHabis] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [picked, setPicked] = useState<Jawapan | null>(null);
  const [timer, setTimer] = useState(TIME_PER_Q);
  const lockRef = useRef(false);

  const q = soalan[idx];
  const progress = soalan.length ? (idx / soalan.length) * 100 : 0;

  useEffect(() => {
    if (!topic || habis) return;
    setTimer(TIME_PER_Q);
  }, [idx, topic, habis]);

  useEffect(() => {
    if (!topic || habis || feedback) return;
    if (timer <= 0) {
      handleAnswer(null);
      return;
    }
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, topic, habis, feedback]);

  useEffect(() => {
    if (habis && topic) {
      simpanProgress({
        darjah,
        subjek: subjekId,
        aktiviti: "game-matik-neon",
        markah,
        jumlahSoalan: soalan.length,
        masaAmbil: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habis]);

  function handleAnswer(pilihan: Jawapan | null) {
    if (lockRef.current) return;
    lockRef.current = true;
    setPicked(pilihan);
    const betul = pilihan !== null && pilihan === q.jawapan;
    if (betul) {
      setMarkah((m) => m + 1);
      setFeedback("ok");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1000);
      award({ sumber: "game-matik-neon", darjah, subjek: subjekId });
    } else {
      setFeedback("no");
    }
    setTimeout(() => {
      setFeedback(null);
      setPicked(null);
      lockRef.current = false;
      if (idx + 1 >= soalan.length) setHabis(true);
      else setIdx((i) => i + 1);
    }, 900);
  }

  function reset() {
    setIdx(0);
    setMarkah(0);
    setHabis(false);
    setFeedback(null);
    setPicked(null);
    setTimer(TIME_PER_Q);
    lockRef.current = false;
  }

  function pilihTopik(t: string) {
    setTopic(t);
    reset();
  }

  if (!topicNames.length) {
    return <p className="mt-6 text-center text-muted-foreground">Set ini hanya untuk Darjah 4, 5 dan 6.</p>;
  }

  const gridBg = {
    backgroundColor: "#080818",
    backgroundImage:
      "linear-gradient(rgba(6,182,212,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.12) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
  } as const;

  if (!topic) {
    return (
      <div className="relative mt-6 overflow-hidden rounded-3xl p-6 sm:p-8" style={gridBg}>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-cyan-300">
            <Zap className="h-3 w-3" /> Set 2 • Neon
          </div>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] sm:text-4xl">
            Pilih Topik
          </h2>
          <p className="mt-1 text-sm text-cyan-200/80">Darjah {darjah} • Matematik</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          {topicNames.map((t) => (
            <button
              key={t}
              onClick={() => pilihTopik(t)}
              className="group rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 px-5 py-5 text-left font-display text-lg font-extrabold text-white shadow-[0_0_25px_rgba(168,85,247,0.25)] transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.45)]"
            >
              <span className="block text-cyan-300 text-xs uppercase tracking-widest">Topik</span>
              <span className="mt-1 block">{t}</span>
              <span className="mt-2 inline-block text-xs font-bold text-purple-200/90 group-hover:text-cyan-200">
                {topics[t].length} soalan →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (habis) {
    return (
      <div className="relative mt-6 overflow-hidden rounded-3xl p-8 text-center" style={gridBg}>
        <Sparkles className="mx-auto h-12 w-12 text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
        <h2 className="mt-3 font-display text-3xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">
          Misi Selesai!
        </h2>
        <p className="mt-2 text-cyan-200">
          Topik: <span className="font-extrabold text-white">{topic}</span>
        </p>
        <p className="mt-1 text-cyan-200">
          Markah: <span className="font-extrabold text-white">{markah}</span> / {soalan.length}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-cyan-400 px-5 py-2 font-display font-extrabold text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          >
            Main Lagi
          </button>
          <button
            onClick={() => setTopic(null)}
            className="rounded-full border border-purple-400 px-5 py-2 font-display font-extrabold text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Tukar Topik
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl p-5 shadow-card sm:p-8" style={gridBg}>
      {confetti && <Confetti />}
      {feedback && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-5xl font-extrabold ${
            feedback === "ok"
              ? "bg-cyan-500/20 text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.9)]"
              : "bg-fuchsia-600/20 text-fuchsia-200 drop-shadow-[0_0_18px_rgba(217,70,239,0.9)]"
          }`}
        >
          {feedback === "ok" ? "✓ Tepat!" : "✗ Salah"}
        </div>
      )}

      {/* Topic selector bar */}
      <div className="flex flex-wrap gap-2">
        {topicNames.map((t) => (
          <button
            key={t}
            onClick={() => pilihTopik(t)}
            className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider transition ${
              t === topic
                ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                : "border-purple-400/40 text-purple-200/80 hover:border-cyan-300 hover:text-cyan-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-bold text-cyan-200">
        <span className="rounded-full border border-cyan-400/40 bg-black/30 px-3 py-1">
          Soalan {idx + 1} / {soalan.length}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-black/30 px-3 py-1 text-amber-200">
          <Trophy className="h-4 w-4" /> {markah}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
          style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(34,211,238,0.7)" }}
        />
      </div>

      {/* Timer bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all"
          style={{ width: `${(timer / TIME_PER_Q) * 100}%` }}
        />
      </div>

      <h2 className="mt-8 text-center font-display text-4xl font-extrabold text-white drop-shadow-[0_0_14px_rgba(34,211,238,0.7)] sm:text-5xl">
        {q.soalan}
      </h2>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-2">
        {q.pilihan.map((p, i) => {
          const isPicked = picked === p;
          const correct = feedback && p === q.jawapan;
          const wrong = isPicked && feedback === "no";
          return (
            <button
              key={`${String(p)}-${i}`}
              onClick={() => handleAnswer(p)}
              disabled={!!feedback}
              className={`rounded-2xl border px-4 py-5 text-center font-display text-2xl font-extrabold transition active:scale-95 ${
                correct
                  ? "border-cyan-300 bg-cyan-400/30 text-white shadow-[0_0_25px_rgba(34,211,238,0.7)]"
                  : wrong
                  ? "border-fuchsia-400 bg-fuchsia-500/30 text-white shadow-[0_0_25px_rgba(217,70,239,0.7)]"
                  : "border-purple-400/40 bg-white/5 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              }`}
            >
              {String(p)}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[11px] uppercase tracking-widest text-purple-200/70">
        Ketik pilihan jawapan • {timer}s
      </p>
    </div>
  );
}
