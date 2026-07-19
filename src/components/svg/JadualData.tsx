interface Baris {
  label: string;
  nilai: string;
}

interface Props {
  tajuk?: string;
  lajur: [string, string];
  baris: Baris[];
}

export function JadualData({ tajuk, lajur, baris }: Props) {
  const list = Array.isArray(baris) ? baris : [];
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-slate-300 bg-slate-50 text-slate-800 shadow-sm">
      {tajuk && (
        <div className="whitespace-pre-line border-b border-slate-300 bg-slate-100 px-4 py-2 font-display text-sm font-extrabold">
          {tajuk}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-200/70 text-left">
            <th className="whitespace-pre-line border-b border-slate-300 px-4 py-2 font-bold">{lajur[0]}</th>
            <th className="whitespace-pre-line border-b border-slate-300 px-4 py-2 font-bold">{lajur[1]}</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-3 text-center italic text-slate-500">Tiada data</td>
            </tr>
          ) : (
            list.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="whitespace-pre-line border-b border-slate-200 px-4 py-2 font-semibold">{r.label}</td>
                <td className="whitespace-pre-line border-b border-slate-200 px-4 py-2">{r.nilai}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
