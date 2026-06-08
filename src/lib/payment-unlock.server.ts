// Server-only helper: verify payment with ToyyibPay then unlock darjah_akses.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getBillTransactions } from "@/lib/toyyibpay";
import { darjahDibuka, type PakejId } from "@/lib/checkout";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://pgpkqbdyxoejwvubluqq.supabase.co";

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface UnlockInput {
  orderId?: string | null;
  billcode?: string | null;
  statusFromCallback?: string | null;
  txnId?: string | null;
  traceId: string;
  actorClient?: SupabaseClient;
  requireOwnerUserId?: string | null;
}

export interface UnlockResult {
  ok: boolean;
  reason: string;
  orderId?: string;
  userId?: string;
  darjahAkses?: number[];
  alreadyPaid?: boolean;
}

function log(id: string, step: string, data?: Record<string, unknown>) {
  console.log(`[unlock:${id}] ${step}`, data ?? {});
}
function warn(id: string, step: string, data?: Record<string, unknown>) {
  console.warn(`[unlock:${id}] ${step}`, data ?? {});
}
function err(id: string, step: string, data?: unknown) {
  console.error(`[unlock:${id}] ${step}`, data);
}

export async function verifyAndUnlock(
  input: UnlockInput,
): Promise<UnlockResult> {
  const { traceId: id } = input;
  log(id, "0/6 start", {
    orderId: input.orderId,
    billcode: input.billcode,
    statusFromCallback: input.statusFromCallback,
  });

  if (!input.orderId && !input.billcode) {
    warn(id, "0/6 tiada orderId/billcode");
    return { ok: false, reason: "missing-identifier" };
  }

  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  if (!secretKey) {
    err(id, "0/6 TOYYIBPAY_SECRET_KEY tiada");
    return { ok: false, reason: "no-secret-key" };
  }

  const adminClient = admin();
  const supa = adminClient ?? input.actorClient;
  log(id, "0/6 Supabase writer", {
    mode: adminClient
      ? "service_role"
      : input.actorClient
        ? "authenticated_user"
        : "missing",
  });
  if (!supa) {
    err(
      id,
      "0/6 SUPABASE_SERVICE_ROLE_KEY tiada dan tiada user client fallback",
    );
    return { ok: false, reason: "no-supabase-writer" };
  }

  log(id, "1/6 cari pesanan");
  const query = input.orderId
    ? supa.from("pesanan").select("*").eq("id", input.orderId).maybeSingle()
    : supa
        .from("pesanan")
        .select("*")
        .eq("billcode", input.billcode!)
        .maybeSingle();
  const { data: pesanan, error: pErr } = await query;
  if (pErr) {
    err(id, "1/6 query pesanan ralat", pErr);
    return { ok: false, reason: "query-error" };
  }
  if (!pesanan) {
    warn(id, "1/6 pesanan tidak dijumpai", {
      orderId: input.orderId,
      billcode: input.billcode,
    });
    return { ok: false, reason: "order-not-found" };
  }
  log(id, "1/6 pesanan dijumpai", {
    id: pesanan.id,
    user_id: pesanan.user_id,
    status: pesanan.status,
    billcode: pesanan.billcode,
    pakej: pesanan.pakej,
    darjah_dipilih: pesanan.darjah_dipilih,
  });

  if (
    input.requireOwnerUserId &&
    pesanan.user_id !== input.requireOwnerUserId
  ) {
    warn(id, "1/6 pesanan bukan milik user", {
      expected: input.requireOwnerUserId,
      actual: pesanan.user_id,
    });
    return { ok: false, reason: "unauthorized-order" };
  }
  if (pesanan.status === "paid") log(id, "1/6 pesanan sudah paid");

  const billcode = pesanan.billcode ?? input.billcode;
  if (!billcode) {
    warn(id, "2/6 tiada billcode untuk verify");
    return { ok: false, reason: "no-billcode" };
  }

  log(id, "2/6 verify ToyyibPay getBillTransactions", { billcode });
  let verified = pesanan.status === "paid";
  if (verified) log(id, "2/6 verify fallback: pesanan status=paid");
  try {
    const txs = await getBillTransactions(secretKey, billcode);
    log(id, "2/6 transactions diterima", {
      count: txs.length,
      statuses: txs.map((t) => t.billpaymentStatus),
    });
    verified = txs.some((t) => String(t.billpaymentStatus) === "1");
  } catch (e) {
    err(id, "2/6 getBillTransactions exception", e);
  }

  if (!verified && input.statusFromCallback === "1") {
    log(id, "2/6 verify fallback: callback status=1");
    verified = true;
  }

  if (!verified) {
    warn(id, "2/6 belum disahkan sebagai paid");
    return { ok: false, reason: "not-paid-yet", orderId: pesanan.id };
  }

  log(id, "3/6 ambil profile sedia ada", { userId: pesanan.user_id });
  const { data: profile, error: profErr } = await supa
    .from("profiles")
    .select("darjah_akses")
    .eq("id", pesanan.user_id)
    .maybeSingle();
  if (profErr) {
    err(id, "3/6 ralat baca profile", profErr);
  }
  const existing: number[] = Array.isArray(profile?.darjah_akses)
    ? (profile!.darjah_akses as number[])
    : [];
  const toAdd = darjahDibuka(
    pesanan.pakej as PakejId,
    (pesanan.darjah_dipilih as number[]) ?? [],
  );
  const merged = Array.from(new Set([...existing, ...toAdd])).sort(
    (a, b) => a - b,
  );
  log(id, "3/6 darjah_akses calc", { existing, toAdd, merged });

  log(id, "4/6 upsert profile darjah_akses");
  const { error: upErr } = await supa
    .from("profiles")
    .upsert(
      { id: pesanan.user_id, darjah_akses: merged },
      { onConflict: "id" },
    );
  if (upErr) {
    err(id, "4/6 upsert profile gagal", upErr);
    return { ok: false, reason: "profile-upsert-failed", orderId: pesanan.id };
  }
  log(id, "4/6 upsert profile berjaya");

  log(id, "5/6 tandakan pesanan paid");
  const { error: updErr } = await supa
    .from("pesanan")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      toyyib_transaction_id: input.txnId ?? null,
      billcode,
    })
    .eq("id", pesanan.id);
  if (updErr) {
    err(id, "5/6 update pesanan gagal (akses sudah dibuka)", updErr);
  } else {
    log(id, "5/6 pesanan ditanda paid");
  }

  log(id, "6/6 selesai", { merged });
  return {
    ok: true,
    reason: "unlocked",
    orderId: pesanan.id,
    userId: pesanan.user_id,
    darjahAkses: merged,
  };
}
