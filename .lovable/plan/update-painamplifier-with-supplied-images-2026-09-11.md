# Update PainAmplifier with supplied images

## Scope
- Modify only the `PainAmplifier()` presentation and helpers used exclusively by it in `src/routes/index.tsx`.
- Add the three uploaded PNGs as Lovable CDN asset pointers; do not redraw or regenerate them.
- Preserve the existing section heading, titles, and supporting paragraphs exactly.

## Layout
- Desktop: three alternating editorial rows — image left/text right, text left/image right, image left/text right.
- Mobile: image first, then text, one full-width pain point per row.
- Use restrained rounded framing, a soft border/shadow, generous image visibility, and the existing Kalifah palette.

## Image mapping
1. `ChatGPT_Image_Sep_11_2026_12_59_47_PM.png` → “Tuisyen Tiada Report”
2. `ChatGPT_Image_Sep_11_2026_01_01_45_PM.png` → “Banyak Latihan Tak Semestinya Tepat”
3. `ChatGPT_Image_Sep_11_2026_01_03_36_PM.png` → “Baru Tahu Lepas Exam”

## Validation
- Run `bunx tsc --noEmit`.
- Inspect at 1280px and 390px for image readability, intended alternation/stacking, horizontal overflow, and console errors.
- Confirm the diff changes only the PainAmplifier section and its three new asset pointer files.
- Keep the work preview-only; do not deploy.
