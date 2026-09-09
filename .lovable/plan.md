# Hero v1 Cinematic Enhancement

## Scope
- Change only `Hero()` and `HeroBuktiVisual()` in `src/routes/index.tsx`.
- Preserve the locked headline, support copy, KALI bridge sentence, CTA label/route, trust line, and all sections outside the hero.
- Preview only; no production deployment.

## Visual implementation
- Replace the two-card proof with a single editorial learning canvas on a warm cream base.
- Center one shared `6/10` score and caption, then branch into Anak A and Anak B learning paths.
- Show mastery in green and strengthening needs in amber, with a small KALI Blue marker and “KALI nampak perbezaannya.” at the branch.
- Add integrated CSS-only green/amber atmospheric washes and a faint learning-map grid; avoid floating blur blobs, photos, heavy glass effects, and decorative particles.
- Keep the conclusion and example disclaimer unchanged.

## Responsive behavior
- Desktop: wide horizontal branch composition within an approximately `max-w-4xl` proof area while keeping headline width controlled.
- Mobile: centered score followed by a readable two-column comparison, falling back cleanly without horizontal scrolling.
- Maintain readable labels and a full-width mobile CTA.

## Motion and accessibility
- Use local SVG/CSS transitions for a one-time branch draw, node entrance, and single KALI Blue pulse.
- Disable nonessential motion under `prefers-reduced-motion`.
- Keep SSR-safe static markup with no browser-only render logic.

## Validation
- Run TypeScript typecheck.
- Inspect desktop and 390px mobile previews for layout, overflow, readability, and console errors.
- Report the exact changed file, visual summary, and preview URL; do not deploy.
