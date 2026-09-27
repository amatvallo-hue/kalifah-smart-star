import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const KEMPEN_ID = "kali-belum-bayar-2026-09";
export const CTA_URL = "https://kalifah.my/cuba-kali-web";
export const TEST_EMAIL = "amatvallo@gmail.com";
const SITE = "https://kalifah.my";

export type Segmen = "pending_order" | "pernah_latihan" | "lain";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOMAIN_DALAMAN = ["kalifah.my", "example.com", "example.org", "test.com", "mailinator.com", "kalifah.local"];
const POLA_UJIAN = /(^|[._+-])(test|ujian|demo|dummy|fake|tetamu|guest)([._+-]|\d|@)/i;

export function normalEmail(e: unknown): string | null {
  if (typeof e !== "string") return null;
  const v = e.trim().toLowerCase();
  if (!EMAIL_RE.test(v) || v.length > 254) return null;
  const domain = v.split("@")[1];
  if (DOMAIN_DALAMAN.some((d) => domain === d || domain.endsWith("." + d))) return null;
  if (POLA_UJIAN.test(v)) return null;
  return v;
}

// ---------- Unsubscribe token (HMAC, tiada jadual) ----------
function secret() {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET tidak ditetapkan");
  return s;
}
export function tokenBerhenti(email: string) {
  return createHmac("sha256", secret()).update(`unsub:${email}`).digest("base64url");
}
export function sahkanToken(email: string, token: string) {
  const a = Buffer.from(tokenBerhenti(email));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function urlBerhenti(email: string) {
  return `${SITE}/api/public/berhenti-langgan?e=${encodeURIComponent(email)}&t=${tokenBerhenti(email)}`;
}

// ---------- Template ----------
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]);

const INTRO: Record<Segmen, { subject: string; preheader: string; para: string }> = {
  pending_order: {
    subject: "Jom invest dalam pembelajaran anak hari ini",
    preheader: "Pesanan anda masih menunggu — cuba KALI percuma dahulu.",
    para: "Kami perasan anda pernah memulakan pesanan di Kalifah.my tetapi belum selesai. Tiada masalah — sebelum membuat keputusan, cuba dahulu KALI secara percuma dan lihat sendiri bagaimana KALI mengesan bahagian yang anak perlu fokus.",
  },
  pernah_latihan: {
    subject: "Jom invest dalam pembelajaran anak hari ini",
    preheader: "Anak dah mula berlatih — kini lihat apa yang KALI perasan.",
    para: "Anak anda pernah menjawab latihan di Kalifah.my. Langkah seterusnya: biar KALI kenal pasti corak jawapan anak supaya latihan lebih tepat, bukan sekadar lebih banyak.",
  },
  lain: {
    subject: "Jom invest dalam pembelajaran anak hari ini",
    preheader: "Cuba KALI percuma — tanpa pendaftaran untuk langkah pertama.",
    para: "Anak boleh buat banyak soalan, tetapi bahagian yang benar-benar perlu diperkukuhkan kadangkala masih tersembunyi. KALI membantu ibu bapa nampak di mana anak perlu fokus.",
  },
};

const CONTOH = [
  { nama: "Question Words: whose, why", dari: 30, ke: 93 },
  { nama: "Possessives: 's and s'", dari: 48, ke: 89 },
];

function bar(pct: number, warna: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE7D9;border-radius:6px"><tr><td width="${pct}%" style="background:${warna};height:8px;border-radius:6px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`;
}

export function renderEmel(segmen: Segmen, email: string) {
  const i = INTRO[segmen];
  const unsub = urlBerhenti(email);
  const perasan = CONTOH.map(
    (c) => `<tr><td style="padding:10px 0;border-top:1px solid #EFE9DC">
      <div style="font-size:14px;font-weight:700;color:#1f2937">📈 ${esc(c.nama)}</div>
      <div style="font-size:13px;color:#4b5563;margin-top:2px">Menunjukkan peningkatan yang konsisten sejak beberapa minggu lalu.</div></td></tr>`,
  ).join("");
  const perubahan = CONTOH.map(
    (c) => `<tr><td style="padding:10px 0;border-top:1px solid #EFE9DC">
      <table role="presentation" width="100%"><tr>
        <td style="font-size:14px;font-weight:700;color:#1f2937">${esc(c.nama)}</td>
        <td align="right" style="font-size:13px;font-weight:800;color:#1B8A5A;white-space:nowrap">${c.dari}% → ${c.ke}% (+${c.ke - c.dari})</td>
      </tr></table>
      <div style="margin-top:6px">${bar(c.dari, "#F5A623")}</div>
      <div style="margin-top:4px">${bar(c.ke, "#1B8A5A")}</div></td></tr>`,
  ).join("");

  const html = `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(i.subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden">${esc(i.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2937">
<tr><td style="font-size:18px;font-weight:800;color:#1B8A5A;padding-bottom:16px">Kalifah.my</td></tr>
<tr><td><h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#111827">Jom invest dalam pembelajaran anak hari ini</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151">${esc(i.para)}</p></td></tr>

<tr><td style="background:#FBF8F1;border:1px solid #EFE9DC;border-radius:16px;padding:18px">
<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#6b7280;text-transform:uppercase">Contoh paparan dashboard ibu bapa</div>
<div style="font-size:16px;font-weight:800;margin-top:10px;color:#111827">🔍 Apa Yang KALI Perasan</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${perasan}</table>
<div style="font-size:16px;font-weight:800;margin-top:18px;color:#111827">📊 Perubahan 30 Hari</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${perubahan}</table>
<p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#6b7280">Data contoh tanpa identiti anak. Paparan 30 hari ini ialah hasil penggunaan berterusan selama beberapa minggu — bukan janji hasil sejurus selepas mencuba demo. Setiap anak berkembang mengikut kadar masing-masing.</p>
</td></tr>

<tr><td align="center" style="padding:24px 0 8px">
<a href="${CTA_URL}" style="display:inline-block;background:#1B8A5A;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:12px">Cuba KALI Percuma</a>
<div style="font-size:12px;color:#6b7280;margin-top:8px">Langkah pertama tanpa pendaftaran.</div></td></tr>

<tr><td style="border-top:1px solid #EFE9DC;padding-top:16px;font-size:11px;line-height:1.6;color:#9ca3af">
Anda menerima e-mel ini kerana pernah berinteraksi dengan Kalifah.my.<br>
<a href="${unsub}" style="color:#6b7280">Berhenti langgan e-mel promosi</a> · Kalifah.my, Malaysia</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Jom invest dalam pembelajaran anak hari ini\n\n${i.para}\n\nContoh paparan dashboard (data contoh, tanpa identiti anak):\nApa Yang KALI Perasan / Perubahan 30 Hari\n${CONTOH.map((c) => `- ${c.nama}: ${c.dari}% → ${c.ke}% (+${c.ke - c.dari})`).join("\n")}\n\nPaparan 30 hari ialah hasil penggunaan berterusan, bukan janji hasil sejurus selepas demo.\n\nCuba KALI Percuma: ${CTA_URL}\n\nBerhenti langgan: ${unsub}`;
  return { subject: i.subject, html, text, unsub };
}

// ---------- Audiens ----------
type Row = Record<string, unknown>;
async function semua(admin: SupabaseClient, table: string, cols: string): Promise<{ rows: Row[]; ralat?: string }> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select(cols).range(from, from + 999);
    if (error) return { rows, ralat: `${table}: ${error.message}` };
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }
  return { rows };
}

async function semuaAuthUsers(admin: SupabaseClient) {
  const out: { id: string; email: string | null }[] = [];
  for (let page = 1; page < 200; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.users: ${error.message}`);
    out.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null })));
    if (data.users.length < 1000) break;
  }
  return out;
}

export type Penerima = { email: string; segmen: Segmen; userId: string | null };

export async function binaAudiens(admin: SupabaseClient) {
  const amaran: string[] = [];
  const [users, children, profiles, pesanan, suppress, progress, kuiz] = await Promise.all([
    semuaAuthUsers(admin),
    semua(admin, "child_profiles", "parent_id, child_user_id"),
    semua(admin, "profiles", "id, role"),
    semua(admin, "pesanan", "user_id, status"),
    semua(admin, "email_suppression", "email"),
    semua(admin, "user_progress", "user_id"),
    semua(admin, "kuiz_percuma_sesi", "email"),
  ]);
  for (const r of [children, profiles, pesanan, suppress, progress, kuiz]) if (r.ralat) amaran.push(r.ralat);
  // Jadual kritikal: gagal = hentikan (lebih selamat daripada tersalah hantar).
  for (const r of [children, profiles, pesanan, suppress]) if (r.ralat) throw new Error(`Audiens dibatalkan — ${r.ralat}`);

  const anak = new Set(children.rows.map((r) => r.child_user_id as string).filter(Boolean));
  const adminIds = new Set(profiles.rows.filter((r) => r.role === "admin").map((r) => r.id as string));
  const paidIds = new Set<string>();
  const pendingIds = new Set<string>();
  for (const p of pesanan.rows) {
    const s = String(p.status ?? "").toLowerCase();
    if (s === "paid" || s === "approved") paidIds.add(p.user_id as string);
    else if (s === "pending") pendingIds.add(p.user_id as string);
  }
  const suppressed = new Set(suppress.rows.map((r) => String(r.email).toLowerCase()));
  const adaProgress = new Set(progress.rows.map((r) => r.user_id as string));
  // Ibu bapa "pernah berlatih" jika akaun sendiri atau mana-mana anak ada rekod latihan.
  const berlatih = new Set(adaProgress);
  for (const c of children.rows) if (c.parent_id && adaProgress.has(c.child_user_id as string)) berlatih.add(c.parent_id as string);

  const keluar = { anak: 0, admin: 0, paid: 0, suppression: 0, tidak_sah: 0, pendua: 0 };
  const byEmail = new Map<string, Penerima>();
  const emelBerbayar = new Set<string>();
  const rank: Record<Segmen, number> = { pending_order: 0, pernah_latihan: 1, lain: 2 };

  const tambah = (p: Penerima) => {
    const ada = byEmail.get(p.email);
    if (ada) { keluar.pendua++; if (rank[p.segmen] < rank[ada.segmen]) byEmail.set(p.email, p); return; }
    byEmail.set(p.email, p);
  };

  for (const u of users) {
    if (anak.has(u.id)) { keluar.anak++; continue; }
    if (adminIds.has(u.id)) { keluar.admin++; continue; }
    const e = normalEmail(u.email);
    if (paidIds.has(u.id)) { keluar.paid++; if (e) emelBerbayar.add(e); continue; }
    if (!e) { keluar.tidak_sah++; continue; }
    if (suppressed.has(e)) { keluar.suppression++; continue; }
    const segmen: Segmen = pendingIds.has(u.id) ? "pending_order" : berlatih.has(u.id) ? "pernah_latihan" : "lain";
    tambah({ email: e, segmen, userId: u.id });
  }
  for (const k of kuiz.rows) {
    const e = normalEmail(k.email);
    if (!e) { keluar.tidak_sah++; continue; }
    if (suppressed.has(e)) { keluar.suppression++; continue; }
    tambah({ email: e, segmen: "lain", userId: null });
  }
  // Lead kuiz yang e-melnya sama dengan akaun berbayar juga dikecualikan.
  for (const e of emelBerbayar) if (byEmail.delete(e)) keluar.paid++;

  const senarai = [...byEmail.values()];
  const kiraan = { pending_order: 0, pernah_latihan: 0, lain: 0 } as Record<Segmen, number>;
  senarai.forEach((p) => kiraan[p.segmen]++);
  return { senarai, kiraan, jumlah: senarai.length, dikecualikan: keluar, amaran };
}

// Semakan bayaran tepat sebelum hantar (satu penerima).
export async function masihBelumBayar(admin: SupabaseClient, p: Penerima) {
  const { data: sup } = await admin.from("email_suppression").select("email").eq("email", p.email).maybeSingle();
  if (sup) return { ok: false, sebab: "suppression" };
  if (!p.userId) return { ok: true };
  const { data, error } = await admin.from("pesanan").select("status").eq("user_id", p.userId).in("status", ["paid", "approved"]).limit(1);
  if (error) return { ok: false, sebab: `semakan bayaran ralat: ${error.message}` };
  return data && data.length ? { ok: false, sebab: "sudah_bayar" } : { ok: true };
}

export async function hantarResend(to: string, e: ReturnType<typeof renderEmel>, idem: string) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("RESEND_API_KEY tidak ditetapkan dalam persekitaran app");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idem },
    body: JSON.stringify({
      from: "Kalifah.my <noreply@kalifah.my>",
      to: [to],
      subject: e.subject,
      html: e.html,
      text: e.text,
      headers: { "List-Unsubscribe": `<${e.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      tags: [{ name: "kempen", value: KEMPEN_ID.replace(/[^a-zA-Z0-9_-]/g, "_") }],
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend [${res.status}]: ${body}`);
  return (JSON.parse(body) as { id?: string }).id ?? null;
}
