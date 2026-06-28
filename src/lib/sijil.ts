// Generator sijil PDF (client-side, guna jsPDF).
// Dynamic import jsPDF supaya tidak menambah bundle utama.

import logoUrl from "@/assets/kalifah-logo.png";

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

// Cache logo dataURL supaya tak fetch berulang kali
let logoDataUrlCache: string | null = null;
async function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache) return logoDataUrlCache;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    logoDataUrlCache = dataUrl;
    return dataUrl;
  } catch (e) {
    console.warn("Gagal muat logo sijil:", e);
    return null;
  }
}

function drawLogo(doc: any, dataUrl: string | null, cx: number, topY: number) {
  // Logo lebar 60mm, ratio dijaga ~3:2 → tinggi ~20mm
  const w = 60;
  const h = 20;
  if (dataUrl) {
    try {
      doc.addImage(dataUrl, "PNG", cx - w / 2, topY, w, h);
      return;
    } catch (e) {
      console.warn("addImage gagal, fallback ke wordmark:", e);
    }
  }
  // Fallback wordmark
  doc.setFont("helvetica", "bold");
  doc.setTextColor(HIJAU);
  doc.setFontSize(22);
  doc.text("Kalifah", cx - 2, topY + 12, { align: "right" });
  doc.setTextColor(EMAS);
  doc.text(".my", cx - 2, topY + 12, { align: "left" });
}

export async function buildSijilPDF(input: SijilInput): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  // Landscape A4: 297 x 210 mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;
  const logo = await loadLogoDataUrl();

  if (input.jenis === "kuiz-cemerlang") {
    return renderKuizCemerlang(doc, input, W, H, logo);
  }

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

  // ── Logo Kalifah.my (atas tengah)
  drawLogo(doc, logo, W / 2, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#666666");
  doc.text("Portal Pembelajaran Sekolah Rendah", W / 2, 42, { align: "center" });

  // ── Garis pemisah emas
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 40, 46, W / 2 + 40, 46);

  // ── Tajuk Sijil
  doc.setFont("helvetica", "bold");
  doc.setTextColor(HIJAU_GELAP);
  doc.setFontSize(32);
  doc.text("SIJIL PENGHARGAAN", W / 2, 62, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#444444");
  const subTajuk = input.jenis === "darjah" ? "Tamat Pengajian Darjah" : "Tamat Pengajian Subjek";
  doc.text(subTajuk, W / 2, 70, { align: "center" });

  // ── "Diberikan kepada"
  doc.setFontSize(12);
  doc.setTextColor("#555555");
  doc.text("Diberikan dengan penuh penghargaan kepada", W / 2, 86, { align: "center" });

  // ── Nama Murid
  doc.setFont("times", "bolditalic");
  doc.setFontSize(36);
  doc.setTextColor(HIJAU);
  doc.text(input.namaMurid, W / 2, 104, { align: "center" });

  // Garis bawah nama
  const namaTextWidth = Math.min(180, doc.getTextWidth(input.namaMurid) + 20);
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - namaTextWidth / 2, 109, W / 2 + namaTextWidth / 2, 109);

  // ── Naratif
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#333333");
  doc.text("kerana berjaya menyiapkan semua aktiviti pembelajaran untuk", W / 2, 122, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(HIJAU_GELAP);
  doc.text(input.tajuk, W / 2, 134, { align: "center" });

  // ── Markah & Tarikh (kad kecil)
  const kadY = 150;
  drawKad(doc, W / 2 - 70, kadY, 60, 22, "PURATA MARKAH", `${Math.round(input.purata)}%`, EMAS);
  drawKad(doc, W / 2 + 10, kadY, 60, 22, "TARIKH TAMAT", input.tarikh, HIJAU);

  // ── Tandatangan digital
  doc.setFont("times", "italic");
  doc.setFontSize(20);
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

function renderKuizCemerlang(
  doc: any,
  input: SijilInput,
  W: number,
  H: number,
  logo: string | null,
): Blob {
  // ── Latar kertas
  doc.setFillColor("#FFFDF7");
  doc.rect(0, 0, W, H, "F");

  // ── Bingkai berlapis (warna brand: hijau luar, emas dalam)
  doc.setDrawColor(HIJAU);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor(EMAS);
  doc.setLineWidth(1);
  doc.rect(12, 12, W - 24, H - 24);

  // ── Hiasan sudut (emas)
  const sudut: [number, number][] = [
    [16, 16],
    [W - 16, 16],
    [16, H - 16],
    [W - 16, H - 16],
  ];
  doc.setFillColor(EMAS);
  sudut.forEach(([x, y]) => doc.circle(x, y, 3, "F"));

  // ── Logo Kalifah.my di atas
  drawLogo(doc, logo, W / 2, 16);

  // ── Trofi emas kecil sebelah tajuk (di tengah, atas tajuk)
  const cx = W / 2;
  const { r, g, b } = hexToRgb(EMAS);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(HIJAU_GELAP);
  doc.setLineWidth(0.5);
  doc.circle(cx, 48, 5, "FD");
  doc.circle(cx, 55, 1.8, "FD");
  doc.ellipse(cx, 59, 5, 1.8, "FD");

  // ── Tajuk Sijil (hijau gelap — warna brand)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(HIJAU_GELAP);
  doc.setFontSize(38);
  doc.text("SIJIL CEMERLANG", W / 2, 78, { align: "center" });

  // ── Subtajuk (emas)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(EMAS);
  doc.text("100% Jawapan Betul", W / 2, 87, { align: "center" });

  // ── Garis pemisah emas
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 40, 93, W / 2 + 40, 93);

  // ── Diberikan kepada
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#555555");
  doc.text("Diberikan dengan penuh penghargaan kepada", W / 2, 103, { align: "center" });

  // ── Nama murid (hijau brand)
  doc.setFont("times", "bolditalic");
  doc.setFontSize(32);
  doc.setTextColor(HIJAU);
  doc.text(input.namaMurid, W / 2, 118, { align: "center" });

  const namaTextWidth = Math.min(180, doc.getTextWidth(input.namaMurid) + 20);
  doc.setDrawColor(EMAS);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - namaTextWidth / 2, 123, W / 2 + namaTextWidth / 2, 123);

  // ── Naratif
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#333333");
  doc.text("Tahniah kerana menjawab SEMUA soalan dengan betul untuk", W / 2, 133, { align: "center" });

  // ── Tajuk topik (hijau gelap)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(HIJAU_GELAP);
  doc.text(input.tajuk, W / 2, 144, { align: "center" });

  // ── Kad markah & tarikh
  const kadY = 156;
  drawKad(doc, W / 2 - 70, kadY, 60, 20, "MARKAH", "100%", EMAS);
  drawKad(doc, W / 2 + 10, kadY, 60, 20, "TARIKH", input.tarikh, HIJAU);

  // ── Tandatangan digital
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.setTextColor(HIJAU_GELAP);
  doc.text("Kalifah.my", W / 2, 187, { align: "center" });
  doc.setDrawColor("#999999");
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 30, 189, W / 2 + 30, 189);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#666666");
  doc.text("Tandatangan Digital — Pasukan Kalifah.my", W / 2, 194, { align: "center" });

  // ── Kod sijil
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
  await downloadSijil(input, namafile);
  return false;
}
