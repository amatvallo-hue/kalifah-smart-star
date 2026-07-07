import { JamAnalog } from "@/components/svg/JamAnalog";
import { Bentuk2D } from "@/components/svg/Bentuk2D";
import { Bentuk3D } from "@/components/svg/Bentuk3D";
import { LabeledDiagram } from "@/components/svg/LabeledDiagram";
import { MagnetDiagram } from "@/components/svg/MagnetDiagram";
import { DacingScale } from "@/components/svg/DacingScale";
import { PecahanDiagram } from "@/components/svg/PecahanDiagram";
import { BarisanPanjang } from "@/components/svg/BarisanPanjang";
import { BekasAir } from "@/components/svg/BekasAir";
import { CahayaBayang } from "@/components/svg/CahayaBayang";
import { LitarElektrik } from "@/components/svg/LitarElektrik";
import { KetumpatanDiagram } from "@/components/svg/KetumpatanDiagram";
import { SistemSuria } from "@/components/svg/SistemSuria";
import { PerimeterLuas } from "@/components/svg/PerimeterLuas";
import { SudutGaris } from "@/components/svg/SudutGaris";
import { IsiPaduPepejal } from "@/components/svg/IsiPaduPepejal";
import { FasaBulan } from "@/components/svg/FasaBulan";
import { KeadaanJirim } from "@/components/svg/KeadaanJirim";
import { GerhanaDiagram } from "@/components/svg/GerhanaDiagram";
import { RajahDaya } from "@/components/svg/RajahDaya";
import { RajahKestabilan } from "@/components/svg/RajahKestabilan";
import { RantaiMakanan } from "@/components/svg/RantaiMakanan";
import { UjianLitmus } from "@/components/svg/UjianLitmus";
import { MesinRingkas } from "@/components/svg/MesinRingkas";
import { WangMalaysia } from "@/components/svg/WangMalaysia";
import { KiraObjek } from "@/components/svg/KiraObjek";
import { CartaGambarMudah } from "@/components/svg/CartaGambarMudah";
import { SenaraiHarga } from "@/components/svg/SenaraiHarga";
import { KoleksiBentuk2D } from "@/components/svg/KoleksiBentuk2D";
import { KoleksiBentuk3D } from "@/components/svg/KoleksiBentuk3D";
import { Kalendar } from "@/components/svg/Kalendar";
import { GridKedudukan } from "@/components/svg/GridKedudukan";
import { GrafPai } from "@/components/svg/GrafPai";
import { Piktograf } from "@/components/svg/Piktograf";
import { GrafBar } from "@/components/svg/GrafBar";
import { JamMulaTamat } from "@/components/svg/JamMulaTamat";
import { RajahJarak } from "@/components/svg/RajahJarak";
import { RajahGaris } from "@/components/svg/RajahGaris";
import { RajahSudut } from "@/components/svg/RajahSudut";
import { GridKoordinat } from "@/components/svg/GridKoordinat";



export function renderSoalanSvg(
  svg_type: string | null | undefined,
  svg_params: any,
  bahasa?: "bm" | "en",
): React.ReactNode {
  if (!svg_type) return null;
  const p = svg_params ?? {};
  try {
    if (svg_type === "jam") return <JamAnalog {...p} />;
    if (svg_type === "bentuk2d") return <Bentuk2D {...p} />;
    if (svg_type === "bentuk3d") return <Bentuk3D {...p} />;
    if (svg_type === "label_diagram") return <LabeledDiagram {...p} />;
    if (svg_type === "magnet") return <MagnetDiagram {...p} />;
    if (svg_type === "dacing") return <DacingScale {...p} />;
    if (svg_type === "pecahan") return <PecahanDiagram {...p} />;
    if (svg_type === "panjang") return <BarisanPanjang {...p} />;
    if (svg_type === "air") return <BekasAir {...p} />;
    if (svg_type === "cahaya") return <CahayaBayang {...p} />;
    if (svg_type === "litar") return <LitarElektrik {...p} />;
    if (svg_type === "ketumpatan") return <KetumpatanDiagram {...p} />;
    if (svg_type === "sistem_suria") return <SistemSuria />;
    if (svg_type === "perimeter_luas") return <PerimeterLuas {...p} />;
    if (svg_type === "sudut_garis") return <SudutGaris {...p} />;
    if (svg_type === "isi_padu_pepejal") return <IsiPaduPepejal {...p} />;
    if (svg_type === "fasa_bulan") return <FasaBulan {...p} />;
    if (svg_type === "keadaan_jirim") return <KeadaanJirim {...p} />;
    if (svg_type === "gerhana") return <GerhanaDiagram {...p} />;
    if (svg_type === "daya") return <RajahDaya {...p} />;
    if (svg_type === "kestabilan") return <RajahKestabilan {...p} />;
    if (svg_type === "rantai_makanan") return <RantaiMakanan {...p} />;
    if (svg_type === "litmus") return <UjianLitmus {...p} />;
    if (svg_type === "mesin") return <MesinRingkas {...p} />;
    if (svg_type === "wang") return <WangMalaysia {...p} bahasa={bahasa} />;
    if (svg_type === "kira") return <KiraObjek {...p} />;
    if (svg_type === "carta_gambar") return <CartaGambarMudah {...p} bahasa={bahasa} />;
    if (svg_type === "senarai_harga") return <SenaraiHarga {...p} bahasa={bahasa} />;
    if (svg_type === "bentuk2d_koleksi") return <KoleksiBentuk2D {...p} bahasa={bahasa} />;
    if (svg_type === "bentuk3d_koleksi") return <KoleksiBentuk3D {...p} bahasa={bahasa} />;
    if (svg_type === "kalendar") return <Kalendar {...p} bahasa={bahasa} />;
    if (svg_type === "grid_kedudukan") return <GridKedudukan {...p} />;
    if (svg_type === "grafpai") return <GrafPai {...p} />;
    if (svg_type === "piktograf") return <Piktograf {...p} />;
    if (svg_type === "grafbar") return <GrafBar {...p} />;
    if (svg_type === "jam_mula_tamat") return <JamMulaTamat {...p} bahasa={bahasa} />;
    if (svg_type === "rajah_jarak") return <RajahJarak {...p} />;
    if (svg_type === "rajah_garis") return <RajahGaris {...p} />;
    if (svg_type === "rajah_sudut") return <RajahSudut {...p} />;
    if (svg_type === "koordinat") return <GridKoordinat {...p} />;
  } catch {
    return null;
  }
  return null;
}
