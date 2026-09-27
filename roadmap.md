# Roadmap

- [x] Implement Parent Dashboard V2 in `src/routes/dashboard.ibu-bapa.tsx`.
- [x] Derive paid status from `get_my_akses_status` for the active child's grade.
- [x] Preserve unpaid flow and all legacy detail sections.
- [x] Validate typecheck/build and public desktop/mobile route behavior.
- [x] Keep changes preview-only; do not deploy production.
- [ ] Manually verify paid, unpaid, and no-data parent states (blocked: no authenticated parent preview session or live policy inspection available).
- [x] KALI email campaign moved to Supabase plugin (direct migration + Edge Function); unused app-side campaign files removed.
- [x] Removed public `/api/debug-env` (publish needed to remove from live site).
