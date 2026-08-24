/** Format nilai sen (integer) ke paparan RM. 0 → "Percuma". */
export function formatRM(sen: number): string {
  const nilai = Number(sen) || 0;
  if (nilai <= 0) return "Percuma";
  return `RM ${(nilai / 100).toFixed(2)}`;
}
