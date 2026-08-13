import { createRoot } from "react-dom/client";
import { SijilCemerlangTemplate } from "@/components/SijilCemerlangTemplate";

export async function previewSijil() {
  const c = document.createElement("div");
  c.id = "cert-preview";
  c.style.cssText = "position:absolute;left:0;top:0;z-index:9999";
  document.body.appendChild(c);
  createRoot(c).render(
    <SijilCemerlangTemplate
      namaPelajar="Adam Safwan"
      subjekTitle="Bahasa Inggeris"
      darjahLabel="Darjah 2"
      skillName="Consonant Digraphs"
      skillDetail="sh • ch • th"
      bintang={8}
      tarikh="8 OGOS 2026"
      certificateId="KLF-26-D2-BI-BB22CC"
      qrDataUrl=""
    />,
  );
  await new Promise((r) => setTimeout(r, 1500));
  const img = c.querySelector("img.logo-official") as HTMLImageElement | null;
  return img
    ? [img.src.slice(0, 90), img.naturalWidth, img.complete, img.getBoundingClientRect().width]
    : "no img";
}

export async function capturePreview() {
  const mod: any = await import("html2canvas-pro");
  const h2c = mod.default ?? mod;
  const el = document.querySelector("#cert-preview > *") as HTMLElement;
  const canvas = await h2c(el, { scale: 1, useCORS: true, backgroundColor: "#013E37", logging: false });
  return canvas.toDataURL("image/png");
}
