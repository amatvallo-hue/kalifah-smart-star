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
  // Hanya untuk jenis "kuiz-cemerlang":
  subjekTitle?: string;
  topik?: string;
  darjahLabel?: string;
  subjekId?: string;
  bintangDiperoleh?: number;
  certificateUuid?: string;
}

export const SUBJEK_KOD: Record<string, string> = {
  "bahasa-melayu": "BM",
  matematik: "MT",
  "bahasa-inggeris": "BI",
  sains: "SC",
  "pendidikan-islam": "PI",
  jawi: "JW",
};

export function cosmeticCertId(
  darjahLabel: string,
  subjekId: string,
  _tarikh: string,
  uuid: string,
): string {
  const darjahNum = darjahLabel.match(/\d+/)?.[0] ?? darjahLabel;
  const kod = SUBJEK_KOD[subjekId] ?? subjekId.slice(0, 2).toUpperCase();
  const yy = new Date().getFullYear().toString().slice(-2);
  const suffix = uuid.replace(/-/g, "").slice(-6).toUpperCase();
  return `KLF-${yy}-D${darjahNum}-${kod}-${suffix}`;
}

/** Buang kod dalaman seperti "PH01 " di depan nama topik (paparan sahaja). */
export function bersihkanTopik(topik: string): string {
  return topik.replace(/^[A-Z]{1,4}\d{1,3}\s+/, "");
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
  // Kekalkan ratio sebenar logo (371:66) supaya tidak herot
  const w = 60;
  const h = (60 * 66) / 371; // ~10.7mm

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
    return await renderKuizCemerlang(doc, input, W, H, logo);
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
  drawLogo(doc, logo, W / 2, 22);
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

const DEEP = "#013E37";
const BUTTER = "#FFEEB3";
const GOLD = "#D4A017";
const KERTAS = "#FFFBF0";

async function buatQrDataUrl(url: string): Promise<string | null> {
  try {
    const QRCode = await import("qrcode");
    return await QRCode.toDataURL(url, { margin: 1, width: 240 });
  } catch (e) {
    console.warn("Gagal jana QR sijil:", e);
    return null;
  }
}

function drawTrophyBadge(doc: any, cx: number, cy: number) {
  // Cincin emas
  doc.setFillColor("#FFF6DC");
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1.4);
  doc.circle(cx, cy, 13, "FD");

  const { r, g, b } = hexToRgb(GOLD);
  doc.setFillColor(r, g, b);
  doc.setDrawColor(DEEP);
  doc.setLineWidth(0.4);
  // Cawan
  doc.circle(cx, cy - 3, 5, "FD");
  // Batang
  doc.circle(cx, cy + 3.5, 1.6, "FD");
  // Tapak
  doc.ellipse(cx, cy + 7, 5, 1.7, "FD");
  // Pemegang kiri & kanan
  doc.setLineWidth(0.7);
  doc.setDrawColor(GOLD);
  doc.circle(cx - 6.2, cy - 3, 1.8, "S");
  doc.circle(cx + 6.2, cy - 3, 1.8, "S");
}

function drawBookIcon(doc: any, x: number, y: number) {
  doc.setFillColor(...(Object.values(hexToRgb(DEEP)) as [number, number, number]));
  doc.roundedRect(x, y, 7, 8, 1, 1, "F");
  doc.setDrawColor("#FFFFFF");
  doc.setLineWidth(0.4);
  doc.line(x + 3.5, y + 1, x + 3.5, y + 7);
}

function drawChatIcon(doc: any, x: number, y: number) {
  const { r, g, b } = hexToRgb(GOLD);
  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, 8, 6, 1.5, 1.5, "F");
  doc.triangle(x + 2, y + 6, x + 5, y + 6, x + 2.5, y + 8.5, "F");
}

async function renderKuizCemerlang(
  doc: any,
  input: SijilInput,
  W: number,
  H: number,
  logo: string | null,
): Promise<Blob> {
  const subjekTitle = input.subjekTitle ?? "";
  const topikBersih = bersihkanTopik(input.topik ?? "");
  const darjahLabel = input.darjahLabel ?? "";
  const darjahNum = darjahLabel.match(/\d+/)?.[0] ?? darjahLabel;
  const bintang = input.bintangDiperoleh ?? 0;
  const certId = input.certificateUuid
    ? cosmeticCertId(darjahLabel, input.subjekId ?? subjekTitle, input.tarikh, input.certificateUuid)
    : input.kodSijil;

  // ── Latar kertas krim
  doc.setFillColor(KERTAS);
  doc.rect(0, 0, W, H, "F");

  // ── Bingkai: emas nipis di luar, hijau tua di dalam
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.8);
  doc.rect(6, 6, W - 12, H - 12);
  doc.setDrawColor(DEEP);
  doc.setLineWidth(2);
  doc.roundedRect(9, 9, W - 18, H - 18, 5, 5, "S");

  // ── Hiasan sudut emas
  const { r: gr, g: gg, b: gb } = hexToRgb(GOLD);
  doc.setFillColor(gr, gg, gb);
  ([[15, 15], [W - 15, 15], [15, H - 15], [W - 15, H - 15]] as [number, number][]).forEach(
    ([x, y]) => doc.circle(x, y, 2.2, "F"),
  );

  // ── Logo + tajuk
  drawLogo(doc, logo, W / 2, 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DEEP);
  doc.setFontSize(26);
  doc.text("SIJIL CEMERLANG", W / 2, 37, { align: "center" });

  // ── Band hero "100% SEMPURNA"
  const bandX = 72;
  const bandY = 43;
  const bandW = 155;
  const bandH = 29;
  const { r: dr, g: dg, b: db } = hexToRgb(DEEP);
  doc.setFillColor(dr, dg, db);
  doc.roundedRect(bandX, bandY, bandW, bandH, 8, 8, "F");

  doc.setTextColor(BUTTER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("100%", bandX + 38, bandY + 19, { align: "center" });

  doc.setFontSize(17);
  doc.text("SEMPURNA!", bandX + 110, bandY + 13, { align: "center" });

  doc.setFillColor(gr, gg, gb);
  doc.roundedRect(bandX + 76, bandY + 17, 68, 8, 4, 4, "F");
  doc.setTextColor(DEEP);
  doc.setFontSize(8);
  doc.text("SEMUA JAWAPAN BETUL", bandX + 110, bandY + 22.5, { align: "center" });

  // ── Trofi
  drawTrophyBadge(doc, 50, bandY + bandH / 2);

  // ── Penghargaan + nama
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#666666");
  doc.text("Diberikan dengan penuh penghargaan kepada", W / 2, 84, { align: "center" });

  doc.setFont("times", "bolditalic");
  doc.setFontSize(30);
  doc.setTextColor(DEEP);
  doc.text(input.namaMurid, W / 2, 97, { align: "center" });
  const namaW = Math.min(180, doc.getTextWidth(input.namaMurid) + 20);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - namaW / 2, 101, W / 2 + namaW / 2, 101);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#444444");
  doc.text("Tahniah kerana berjaya menjawab", W / 2, 110, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(DEEP);
  doc.text("SEMUA SOALAN DENGAN BETUL", W / 2, 117, { align: "center" });

  // ── Kad maklumat
  const kadX = 28;
  const kadY = 122;
  const kadW = W - 56;
  const kadH = 22;
  doc.setFillColor("#FFF6D6");
  doc.roundedRect(kadX, kadY, kadW, kadH, 4, 4, "F");
  doc.setDrawColor("#EFDCA0");
  doc.setLineWidth(0.5);
  doc.roundedRect(kadX, kadY, kadW, kadH, 4, 4, "S");

  drawBookIcon(doc, kadX + 8, kadY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DEEP);
  const barisSubjek = darjahNum ? `${subjekTitle} • DARJAH ${darjahNum}` : subjekTitle;
  doc.text(barisSubjek, kadX + 19, kadY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#333333");
  doc.text(doc.splitTextToSize(topikBersih, 150)[0] ?? "", kadX + 19, kadY + 16);

  drawChatIcon(doc, kadX + kadW - 70, kadY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#666666");
  doc.text("Tahap penguasaan yang", kadX + kadW - 58, kadY + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(GOLD);
  doc.text("CEMERLANG!", kadX + kadW - 58, kadY + 16);

  // ── Baris pencapaian
  const rowY = 155;
  const items: [string, string, string][] = [
    ["🏅", "PERFECT SCORE AWARD", "Pencapaian Hebat!"],
    ["⭐", `+${bintang} BINTANG`, "Ganjaran Diperoleh"],
    ["📅", "TARIKH", input.tarikh],
  ];
  items.forEach(([, tajuk, sub], idx) => {
    const x = 28 + idx * 58;
    doc.setFillColor(gr, gg, gb);
    doc.circle(x + 4, rowY, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(DEEP);
    doc.text(tajuk, x + 11, rowY - 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#666666");
    doc.text(sub, x + 11, rowY + 4);
  });

  // ── QR pengesahan
  if (input.certificateUuid) {
    const qr = await buatQrDataUrl(`https://kalifah.my/sijil/${input.certificateUuid}`);
    if (qr) {
      const qrX = 210;
      const qrY = rowY - 12;
      try {
        doc.addImage(qr, "PNG", qrX, qrY, 23, 23);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(DEEP);
        doc.text("Sahkan Sijil", qrX + 27, qrY + 9);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor("#666666");
        doc.text(
          doc.splitTextToSize("Imbas QR untuk sahkan keaslian sijil ini.", 32),
          qrX + 27,
          qrY + 14,
        );
      } catch (e) {
        console.warn("Gagal lukis QR:", e);
      }
    }
  }

  // ── Bar footer hijau tua
  const barX = 20;
  const barY = 176;
  const barW = W - 40;
  const barH = 20;
  doc.setFillColor(dr, dg, db);
  doc.roundedRect(barX, barY, barW, barH, 6, 6, "F");

  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(BUTTER);
  doc.text("Kalifah.my", barX + 12, barY + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#FFFFFF");
  doc.text("Tandatangan Digital — Pasukan Kalifah.my", barX + 12, barY + 16);

  doc.setFontSize(6.5);
  doc.setTextColor("#CFE0D8");
  doc.text("CERTIFICATE ID", barX + barW - 12, barY + 8, { align: "right" });
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BUTTER);
  doc.text(certId, barX + barW - 12, barY + 15.5, { align: "right" });

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
