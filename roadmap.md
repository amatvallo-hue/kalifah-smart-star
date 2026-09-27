# Roadmap

- [x] Implement Parent Dashboard V2 in `src/routes/dashboard.ibu-bapa.tsx`.
- [x] Derive paid status from `get_my_akses_status` for the active child's grade.
- [x] Preserve unpaid flow and all legacy detail sections.
- [x] Validate typecheck/build and public desktop/mobile route behavior.
- [x] Keep changes preview-only; do not deploy production.
- [ ] Manually verify paid, unpaid, and no-data parent states (blocked: no authenticated parent preview session or live policy inspection available).
- [x] KALI email campaign (unpaid parents): template 3 segments, dry-run/test endpoint (admin/secret, POST only), unsubscribe + suppression, idempotency log. Production blast disabled.
- [ ] Apply migration `20260927120000_kempen_email_kali.sql` (blocked: no database access from this project).
- [ ] Add RESEND_API_KEY + SUPABASE_SERVICE_ROLE_KEY to app secrets, then run dry-run + single test to amatvallo@gmail.com (blocked: keys missing).
- [ ] Confirm free-quiz lead table name `kuiz_sesi.email` (blocked: not in local migrations).
