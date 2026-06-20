// Generator sijil PDF (client-side, guna jsPDF).
// Dynamic import jsPDF supaya tidak menambah bundle utama.

const HIJAU = "#1B8A5A";
const EMAS = "#F5A623";
const HIJAU_GELAP = "#0F5E3D";

export interface SijilInput {
  jenis: "subjek" | "darjah" | "kuiz-cemerlang";
  namaMurid: string;
  tajuk: string; // cth "Matematik Darjah 3" atau "Darjah 3"
  tarikh: string; // formatted MS-MY
  purata: number; // 0-100
  kodSijil: string; // unik
}

export async function buildSijilPDF(input: SijilInput): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // ── Latar kertas
  doc.setFillColor("#FFFDF7");
  doc.rect(0, 0, W, H, "F");

  // ── Bingkai berlapis
  doc.setDrawColor(HIJAU);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(EMAS);
  doc.setLineWidth(1);
  doc.rect(12, 12, W - 24, H - 24);

  // ── Hiasan sudut (bulatan)
  const sudut: [number, number][] = [
    [16, 16],
    [W - 16, 16],
    [16, H - 16],
    [W - 16, H - 16],
  ];
  doc.setFillColor(EMAS);
  sudut.forEach(([x, y]) => doc.circle(x, y, 3, "F"));

  // ── "Logo" wordmark
  doc.setFont("helvetica", "bold");
  doc.setTextColor(HIJAU);
  doc.setFontSize(20);
  doc.text("Kalifah.my", W / 2, 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#666666");
  doc.text("Portal Pembelajaran Sekolah Rendah", W / 2, 36, { align: "center" });

  // ── Garis pemisah emas
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 40, 40, W / 2 + 40, 40);

  // ── Tajuk Sijil
  doc.setFont("helvetica", "bold");
  doc.setTextColor(HIJAU_GELAP);
  doc.setFontSize(34);
  doc.text("SIJIL PENGHARGAAN", W / 2, 58, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#444444");
  const subTajuk = input.jenis === "darjah" ? "Tamat Pengajian Darjah" : "Tamat Pengajian Subjek";
  doc.text(subTajuk, W / 2, 67, { align: "center" });

  // ── "Diberikan kepada"
  doc.setFontSize(12);
  doc.setTextColor("#555555");
  doc.text("Diberikan dengan penuh penghargaan kepada", W / 2, 84, { align: "center" });

  // ── Nama Murid
  doc.setFont("times", "bolditalic");
  doc.setFontSize(38);
  doc.setTextColor(HIJAU);
  doc.text(input.namaMurid, W / 2, 102, { align: "center" });

  // Garis bawah nama
  const namaTextWidth = Math.min(180, doc.getTextWidth(input.namaMurid) + 20);
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - namaTextWidth / 2, 107, W / 2 + namaTextWidth / 2, 107);

  // ── Naratif
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#333333");
  doc.text("kerana berjaya menyiapkan semua aktiviti pembelajaran untuk", W / 2, 120, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(HIJAU_GELAP);
  doc.text(input.tajuk, W / 2, 132, { align: "center" });

  // ── Markah & Tarikh (kad kecil)
  const kadY = 148;
  drawKad(doc, W / 2 - 70, kadY, 60, 22, "PURATA MARKAH", `${Math.round(input.purata)}%`, EMAS);
  drawKad(doc, W / 2 + 10, kadY, 60, 22, "TARIKH TAMAT", input.tarikh, HIJAU);

  // ── Tandatangan digital
  doc.setFont("times", "italic");
  doc.setFontSize(22);
  doc.setTextColor(HIJAU_GELAP);
  doc.text("Kalifah.my", W / 2, 184, { align: "center" });
  doc.setDrawColor("#999999");
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 30, 186, W / 2 + 30, 186);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#666666");
  doc.text("Tandatangan Digital — Pasukan Kalifah.my", W / 2, 191, { align: "center" });

  // ── Kod sijil (footer)
  doc.setFontSize(7);
  doc.setTextColor("#999999");
  doc.text(`Kod Sijil: ${input.kodSijil}`, W - 16, H - 14, { align: "right" });

  return doc.output("blob");
}

function drawKad(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  nilai: string,
  warna: string,
) {
  doc.setFillColor(warna + "1f"); // jsPDF doesn't accept #hex+alpha directly — fallback below
  // Safer: parse hex to RGB and use setFillColor(r,g,b)
  const { r, g, b } = hexToRgb(warna);
  doc.setFillColor(r, g, b, 0.12);
  doc.roundedRect(x, y, w, h, 3, 3, "F");
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor("#666666");
  doc.text(label, x + w / 2, y + 7, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(warna);
  doc.text(nilai, x + w / 2, y + 16, { align: "center" });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export async function downloadSijil(input: SijilInput, namafile: string): Promise<void> {
  const blob = await buildSijilPDF(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namafile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareSijil(input: SijilInput, namafile: string): Promise<boolean> {
  try {
    const blob = await buildSijilPDF(input);
    const file = new File([blob], namafile, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Sijil Kalifah.my", text: input.tajuk });
      return true;
    }
  } catch (e) {
    console.warn("shareSijil gagal:", e);
  }
  // Fallback: muat turun
  await downloadSijil(input, namafile);
  return false;
}
