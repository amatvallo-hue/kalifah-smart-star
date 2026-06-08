// ToyyibPay API helpers (server-only)
export const TOYYIBPAY_BASE = "https://toyyibpay.com";
export const TOYYIBPAY_CATEGORY_CODE = "dzg6ok1y";

export interface CreateBillInput {
  secretKey: string;
  billName: string;          // max 30 chars
  billDescription: string;   // max 100 chars
  amountSen: number;         // dalam sen (mis. RM29 = 2900)
  externalRef: string;       // order_id kita
  returnUrl: string;
  callbackUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export async function createBill(input: CreateBillInput): Promise<string> {
  const form = new URLSearchParams();
  form.set("userSecretKey", input.secretKey);
  form.set("categoryCode", TOYYIBPAY_CATEGORY_CODE);
  form.set("billName", input.billName.slice(0, 30));
  form.set("billDescription", input.billDescription.slice(0, 100));
  form.set("billPriceSetting", "1");      // tetap
  form.set("billPayorInfo", "1");
  form.set("billAmount", String(input.amountSen));
  form.set("billReturnUrl", input.returnUrl);
  form.set("billCallbackUrl", input.callbackUrl);
  form.set("billExternalReferenceNo", input.externalRef);
  form.set("billTo", input.customerName);
  form.set("billEmail", input.customerEmail);
  form.set("billPhone", input.customerPhone ?? "0000000000");
  form.set("billPaymentChannel", "2");    // 0=FPX, 1=Card, 2=both
  form.set("billContentEmail", "Terima kasih kerana melanggan Kalifah.my!");
  form.set("billChargeToCustomer", "2");  // both charged to customer

  const res = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createBill`, {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`ToyyibPay createBill ralat: ${text}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`ToyyibPay createBill respons tidak dijangka: ${text}`);
  }
  const first = parsed[0] as { BillCode?: string; status?: string; msg?: string };
  if (!first.BillCode) {
    throw new Error(`ToyyibPay createBill gagal: ${first.msg ?? text}`);
  }
  return first.BillCode;
}

export interface BillTransaction {
  billpaymentStatus: string; // "1" = success, "2" = pending, "3" = fail
  billpaymentInvoiceNo?: string;
  billExternalReferenceNo?: string;
}

export async function getBillTransactions(
  secretKey: string,
  billCode: string,
): Promise<BillTransaction[]> {
  const form = new URLSearchParams();
  form.set("userSecretKey", secretKey);
  form.set("billCode", billCode);
  const res = await fetch(
    `${TOYYIBPAY_BASE}/index.php/api/getBillTransactions`,
    { method: "POST", body: form },
  );
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as BillTransaction[]) : [];
  } catch {
    return [];
  }
}
