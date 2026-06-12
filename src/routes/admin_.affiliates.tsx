import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin_/affiliates")({
  head: () => ({ meta: [{ title: "Admin Affiliates — Kalifah.my" }] }),
  ssr: false,
  component: AdminAffiliates,
});

type AffRow = {
  id: string;
  nama: string;
  email: string;
  ref_code: string;
  nama_bank: string;
  no_akaun_bank: string;
  total_klik: number;
  total_jualan: number;
  total_komisyen: number;
  total_dibayar: number;
};

function AdminAffiliates() {
  const [rows, setRows] = useState<AffRow[]>([]);

  useEffect(() => {
    fetch("https://pgpkqbdyxoejwvubluqq.supabase.co/functions/v1/get-affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => setRows(json.data ?? []));
  }, []);

  const markPaid = async (row: AffRow) => {
    console.log('markPaid called', row.id);
    await supabase
      .from("affiliates")
      .update({
        total_dibayar: row.total_dibayar + row.total_komisyen,
        total_komisyen: 0,
      })
      .eq("id", row.id);
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, total_dibayar: Number(r.total_dibayar || 0) + Number(r.total_komisyen || 0), total_komisyen: 0 }
          : r,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-extrabold">Admin — Affiliates</h1>
      <p className="mt-1 text-muted-foreground">Senarai semua affiliate dan komisyen mereka.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Kod</th>
              <th className="px-3 py-2 text-left">Bank</th>
              <th className="px-3 py-2 text-right">Komisyen</th>
              <th className="px-3 py-2 text-right">Dibayar</th>
              <th className="px-3 py-2 text-left">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Tiada affiliate berdaftar lagi.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-bold">{r.nama}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2 font-mono">{r.ref_code}</td>
                  <td className="px-3 py-2">
                    {r.nama_bank} {r.no_akaun_bank}
                  </td>
                  <td className="px-3 py-2 text-right">RM {Number(r.total_komisyen).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">RM {Number(r.total_dibayar).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => markPaid(r)}
                      className="rounded bg-green-600 px-3 py-1 text-white"
                    >
                      Tandakan Dibayar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
