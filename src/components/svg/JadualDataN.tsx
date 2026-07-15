interface Props {
  tajuk?: string;
  lajur: string[];
  baris: string[][];
}

export function JadualDataN({ tajuk, lajur, baris }: Props) {
  const kolum = Array.isArray(lajur) ? lajur : [];
  const list = Array.isArray(baris) ? baris : [];
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-slate-300 bg-slate-50 text-slate-800 shadow-sm">
      {tajuk && (
        <div className="border-b border-slate-300 bg-slate-100 px-4 py-2 font-display text-sm font-extrabold">
          {tajuk}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-200/70 text-left">
            {kolum.map((h, i) => (
              <th key={i} className="border-b border-slate-300 px-3 py-2 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={kolum.length || 1} className="px-4 py-3 text-center italic text-slate-500">Tiada data</td>
            </tr>
          ) : (
            list.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {row.map((cell, j) => (
                  <td key={j} className={`border-b border-slate-200 px-3 py-2 ${j === 0 ? "font-semibold" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
