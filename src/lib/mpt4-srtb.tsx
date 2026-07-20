import { Check, X } from "lucide-react";
import { useMemo } from "react";

// ============================================================
// Types — struktur `langkah_bertingkat` (jsonb) di mpt4_soalan
// ============================================================
export type Cell = number | string | null;

export interface MCQInput {
  id: string;
  lbl: string;
  ans: string;
  type: "mcq4" | "mcq3";
  pilihan: string[];
}
export interface TextInput {
  id: string;
  lbl: string;
  ans: string;
  d?: string;
  type?: undefined;
}
export interface FracInput {
  id: string;
  lbl: string;
  src?: string;
  ans_n: string;
  ans_d: string;
  type: "frac2";
}
export interface PctFracInput {
  id: string;
  lbl: string;
  pct: string;
  ans_n: string;
  ans_d: string;
  type: "pct-frac";
}
export interface Peratus2Input {
  id: string;
  lbl: string;
  ans: string;
  d?: string;
  type: "peratus2";
}
export interface FracOpInput {
  id: string;
  lbl?: string;
  type: "frac-op";
  op_pilihan?: string[];
  samakecil_pilihan?: string[];
  op_ans: string;
  f1n_ans: string;
  f1d_ans: string;
  f2n_ans: string;
  f2d_ans: string;
  sama_ans?: string;
  kgd_ans?: string;
  f1eq_n_ans?: string;
  f1eq_d_ans?: string;
  f2eq_n_ans?: string;
  f2eq_d_ans?: string;
  f2flip_n_ans?: string;
  f2flip_d_ans?: string;
  res_n_ans: string;
  res_d_ans: string;
  kecil_ans?: string;
  gcd_simp_ans?: string;
  fin_n_ans?: string;
  fin_d_ans?: string;
}
export interface Cara2Input {
  id: string;
  type: "cara2";
  pilihan: [string, string];
}
export type LInput = MCQInput | TextInput | FracInput | PctFracInput | Peratus2Input | FracOpInput | Cara2Input;

const DEFAULT_OP_PILIHAN = [
  "Tambah (+) / Addition (+)",
  "Tolak (−) / Subtraction (−)",
  "Darab (×) / Multiplication (×)",
  "Bahagi (÷) / Division (÷)",
];
const DEFAULT_YESNO = ["Ya / Yes", "Tidak / No"];

function opSymOf(label: string | undefined | null): "+" | "−" | "×" | "÷" | null {
  if (!label) return null;
  if (label.includes("÷")) return "÷";
  if (label.includes("×")) return "×";
  if (label.includes("−") || label.includes("-")) return "−";
  if (label.includes("+")) return "+";
  return null;
}
function isYes(label: string | undefined | null): boolean {
  if (!label) return false;
  return /ya|yes/i.test(label);
}

export interface Galus {
  type: "tambah" | "tolak" | "darab" | "bahagi";
  pfx: string;
  cols?: string[];
  r1?: Cell[];
  r2?: Cell[];
  r1fill?: boolean;
  r2fill?: boolean;
  pAns?: Cell[];
  rAns?: Cell[];
  bAns?: Cell[];
  divisor?: number;
  dividend?: Cell[];
  dividendFill?: boolean;
  qAns?: Cell[];
  cellLen?: number;
}

export interface Langkah {
  n: string;
  ar: string;
  inputs?: LInput[];
  galus?: Galus;
  caraGrp?: "A" | "B";
  caraRef?: string;
}

export interface FracSetup {
  num: string;
  den: string;
  times: string;
}


export interface FaField {
  lbl: string;
  ans: string;
  d?: string;
  unit?: string;
  markah?: number;
}

export interface UnitConvert {
  checkQ: string;
  checkPilihan?: string[];
  checkAns: string;
  ar: string;
  factorLabel: string;
  galus: Galus;
}

export interface LangkahBertingkat {
  id?: string;
  topik?: string;
  cari?: string;
  fracSetup?: FracSetup;
  hint?: string;
  diberi?: { l: string; v: string }[];
  langkah: Langkah[];
  unitConvert?: UnitConvert;
  fa: FaField;
  fa2?: FaField;
}

// ============================================================
// chk() — semakan jawapan toleran
// ============================================================
export function norm(s: string) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
}
export function chk(student: string | undefined | null, correct: string): boolean {
  if (student == null || String(student).trim() === "") return false;
  const s = norm(String(student));
  const c = norm(correct);
  if (s === c) return true;
  const sn = s.replace(/[^\d.]/g, "");
  const cn = c.replace(/[^\d.]/g, "");
  if (sn && cn && sn === cn) return true;
  const sf = parseFloat(sn);
  const cf = parseFloat(cn);
  if (!isNaN(sf) && !isNaN(cf) && Math.abs(sf - cf) < 0.01) return true;
  if (cn && s.includes(cn)) return true;
  return false;
}

// ============================================================
// Answer store helpers — flat Record<string,string> serialized as JSON
// ============================================================
export type AnswerMap = Record<string, string>;

export function parseAnswers(json: string | null | undefined): AnswerMap {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? (v as AnswerMap) : {};
  } catch {
    return {};
  }
}

// ============================================================
// Grading — returns marks earned for one SRTb question
// ============================================================
export function gradeSrtb(lb: LangkahBertingkat | null | undefined, valueJson: string | null | undefined, soalanMarkah: number): number {
  if (!lb) return 0;
  const ans = parseAnswers(valueJson);
  const fa1Ok = chk(ans["final"], lb.fa.ans);
  if (!lb.fa2) {
    return fa1Ok ? soalanMarkah : 0;
  }
  const fa2Ok = chk(ans["final2"], lb.fa2.ans);
  const m1 = lb.fa.markah;
  const m2 = lb.fa2.markah;
  if (typeof m1 === "number" && typeof m2 === "number") {
    return (fa1Ok ? m1 : 0) + (fa2Ok ? m2 : 0);
  }
  // fallback: split evenly
  const half = soalanMarkah / 2;
  return (fa1Ok ? half : 0) + (fa2Ok ? half : 0);
}

// ============================================================
// Answer mode — SrtbBlock
// ============================================================
function HTML({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SrtbBlock({
  lb,
  value,
  onChange,
  disabled = false,
}: {
  lb: LangkahBertingkat;
  value: string;
  onChange: (nextJson: string) => void;
  disabled?: boolean;
}) {
  const answers = useMemo(() => parseAnswers(value), [value]);

  function setAns(key: string, v: string) {
    if (disabled) return;
    const next = { ...answers, [key]: v };
    onChange(JSON.stringify(next));
  }

  return (
    <div className="space-y-4">
      {/* Diberi + Cari */}
      {lb.diberi && lb.diberi.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {lb.diberi.map((d, i) => (
            <div key={i} className="rounded-2xl bg-muted/40 px-4 py-2 text-sm font-semibold">
              <span className="text-muted-foreground">{d.l}: </span>
              <HTML html={d.v} className="font-extrabold text-foreground" />
            </div>
          ))}
        </div>
      )}
      {lb.cari && (
        <div className="rounded-2xl border-2 border-green-500 bg-green-50 px-4 py-2 text-sm font-semibold text-green-900">
          Cari: <span className="font-extrabold">{lb.cari}</span>
        </div>
      )}

      {/* Langkah */}
      {lb.langkah.map((lg, li) => (
        <LangkahBlock key={li} langkah={lg} lIdx={li} answers={answers} setAns={setAns} disabled={disabled} />
      ))}

      {/* Semak Unit (opsyenal) */}
      {lb.unitConvert && (
        <UnitConvertBlock uc={lb.unitConvert} answers={answers} setAns={setAns} disabled={disabled} />
      )}

      {/* Jawapan Akhir */}
      <FinalAnswerRow
        fa={lb.fa}
        aKey="final"
        answers={answers}
        setAns={setAns}
        disabled={disabled}
      />
      {lb.fa2 && (
        <FinalAnswerRow
          fa={lb.fa2}
          aKey="final2"
          answers={answers}
          setAns={setAns}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function FinalAnswerRow({
  fa,
  aKey,
  answers,
  setAns,
  disabled,
}: {
  fa: FaField;
  aKey: string;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Jawapan Akhir</p>
      <label className="mt-2 flex flex-wrap items-center gap-2 text-base font-semibold">
        <HTML html={fa.lbl} />
        <input
          type="text"
          value={answers[aKey] ?? ""}
          onChange={(e) => setAns(aKey, e.target.value)}
          disabled={disabled}
          placeholder="?"
          className="w-32 rounded-xl border-2 border-border bg-card px-3 py-2 text-center font-display text-lg font-extrabold outline-none focus:border-primary"
        />
        {fa.unit && <span>{fa.unit}</span>}
      </label>
    </div>
  );
}

function LangkahBlock({
  langkah,
  lIdx,
  answers,
  setAns,
  disabled,
}: {
  langkah: Langkah;
  lIdx: number;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const opInput = langkah.inputs?.find(
    (i): i is MCQInput => "type" in i && (i.type === "mcq4" || i.type === "mcq3"),
  );
  const opKey = opInput ? `l${lIdx}:${opInput.id}` : null;
  const opChosen = opKey ? answers[opKey] : undefined;
  const showGalus = langkah.galus && (!opInput || !!opChosen);

  return (
    <section className="rounded-2xl border-2 border-primary/20 bg-card p-4">
      <h3 className="font-display text-base font-extrabold text-foreground">{langkah.n}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{langkah.ar}</p>

      {langkah.inputs && (
        <div className="mt-3 space-y-3">
          {langkah.inputs.map((inp) => (
            <InputRow key={inp.id} inp={inp} lIdx={lIdx} answers={answers} setAns={setAns} disabled={disabled} />
          ))}
        </div>
      )}

      {showGalus && langkah.galus && (
        <div className="mt-4">
          <GalusGrid g={langkah.galus} lIdx={lIdx} answers={answers} setAns={setAns} disabled={disabled} />
        </div>
      )}
    </section>
  );
}

function InputRow({
  inp,
  lIdx,
  answers,
  setAns,
  disabled,
}: {
  inp: LInput;
  lIdx: number;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const baseKey = `l${lIdx}:${inp.id}`;

  if ("type" in inp && inp.type === "frac-op") {
    return <FracOpBlock inp={inp} baseKey={baseKey} answers={answers} setAns={setAns} disabled={disabled} />;
  }

  if ("type" in inp && inp.type === "cara2") {
    const chosen = answers[baseKey];
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">Pilih cara pengiraan / Choose calculation method:</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {inp.pilihan.map((p) => {
            const isChosen = chosen === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAns(baseKey, p)}
                disabled={disabled}
                className={`rounded-2xl border-2 px-4 py-3 text-left font-display text-sm font-extrabold shadow-soft transition ${
                  isChosen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if ("type" in inp && (inp.type === "mcq4" || inp.type === "mcq3")) {
    const chosen = answers[baseKey];
    const cols = inp.pilihan.length >= 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3";
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">
          <HTML html={inp.lbl} />
        </p>
        <div className={`grid gap-2 ${cols}`}>
          {inp.pilihan.map((p) => {
            const isChosen = chosen === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAns(baseKey, p)}
                disabled={disabled}
                className={`rounded-2xl border-2 px-4 py-3 font-display font-extrabold shadow-soft transition ${
                  isChosen
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if ("type" in inp && (inp.type === "frac2" || inp.type === "pct-frac")) {
    const nKey = `${baseKey}_n`;
    const dKey = `${baseKey}_d`;
    const prefix = inp.type === "frac2" ? (inp as FracInput).src ?? "" : `${(inp as PctFracInput).pct}%`;
    return (
      <div>
        <p className="mb-2 text-sm font-bold text-foreground">
          <HTML html={inp.lbl} />
        </p>
        <div className="flex items-center gap-3">
          {prefix && (
            <span className="font-display text-lg font-extrabold text-muted-foreground">{prefix} =</span>
          )}
          <div className="inline-flex flex-col items-center">
            <input
              type="text"
              value={answers[nKey] ?? ""}
              onChange={(e) => setAns(nKey, e.target.value)}
              disabled={disabled}
              placeholder="?"
              className="w-16 rounded-xl border-2 border-border bg-card px-2 py-1.5 text-center font-display text-lg font-extrabold outline-none focus:border-primary"
            />
            <div className="my-1 h-0.5 w-20 rounded bg-foreground" />
            <input
              type="text"
              value={answers[dKey] ?? ""}
              onChange={(e) => setAns(dKey, e.target.value)}
              disabled={disabled}
              placeholder="?"
              className="w-16 rounded-xl border-2 border-border bg-card px-2 py-1.5 text-center font-display text-lg font-extrabold outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  // text / peratus2
  const val = answers[baseKey] ?? "";
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-foreground">
        <HTML html={inp.lbl} />
      </label>
      <input
        type="text"
        value={val}
        onChange={(e) => setAns(baseKey, e.target.value)}
        disabled={disabled}
        placeholder="?"
        className="w-40 rounded-xl border-2 border-border bg-card px-3 py-2 font-display text-lg font-extrabold outline-none focus:border-primary"
      />
    </div>
  );
}

// ============================================================
// GalusGrid (dinamik ikut operasi)
// ============================================================
function GalusGrid({
  g,
  lIdx,
  answers,
  setAns,
  disabled,
}: {
  g: Galus;
  lIdx: number;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  if (g.type === "bahagi") {
    return <LongDivGrid g={g} lIdx={lIdx} answers={answers} setAns={setAns} disabled={disabled} />;
  }
  return <ColumnFormGrid g={g} lIdx={lIdx} answers={answers} setAns={setAns} disabled={disabled} />;
}

function renderStatic(c: Cell): string {
  if (c === null || c === undefined) return "";
  return String(c);
}

function GalusCell({
  cKey,
  answers,
  setAns,
  disabled,
  maxLen = 1,
  className = "",
}: {
  cKey: string;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
  maxLen?: number;
  className?: string;
}) {
  const val = answers[cKey] ?? "";
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={maxLen}
      value={val}
      onChange={(e) => setAns(cKey, e.target.value)}
      disabled={disabled}
      placeholder="?"
      className={`w-full rounded-lg border-2 border-border bg-card py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary ${className}`}
    />
  );
}

function ColumnFormGrid({
  g,
  lIdx,
  answers,
  setAns,
  disabled,
}: {
  g: Galus;
  lIdx: number;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const cols = g.cols ?? [];
  const nCols = cols.length;
  const opSym = g.type === "tambah" ? "+" : g.type === "tolak" ? "−" : "×";
  const cellLen = g.cellLen ?? 1;
  const carryRow = g.type === "darab" ? g.bAns : g.pAns;
  const gridStyle = { gridTemplateColumns: `28px repeat(${nCols}, minmax(0, 1fr))` };
  const kCell = (row: string, col: number) => `l${lIdx}:${g.pfx}:${row}:${col}`;

  const hasCarry = carryRow && carryRow.some((c) => c !== null && c !== 0 && c !== ".");

  return (
    <div className="mx-auto max-w-md space-y-1">
      <div className="grid gap-1" style={gridStyle}>
        <div />
        {cols.map((h, i) => (
          <div key={i} className="rounded bg-muted/60 py-1 text-center text-[10px] font-bold uppercase">
            {h}
          </div>
        ))}
      </div>

      {hasCarry && carryRow && (
        <div className="grid gap-1" style={gridStyle}>
          <div className="pt-1 text-center text-[10px] font-bold text-muted-foreground">
            {g.type === "tolak" ? "pinjam" : "simpan"}
          </div>
          {carryRow.map((c, i) => {
            if (c === null || c === 0 || c === ".") return <div key={i} />;
            return (
              <div key={i} className="text-xs">
                <GalusCell
                  cKey={kCell("carry", i)}
                  answers={answers}
                  setAns={setAns}
                  disabled={disabled}
                  maxLen={cellLen}
                  className="!py-0.5 !text-xs bg-amber-50/50"
                />
              </div>
            );
          })}
        </div>
      )}

      {g.r1 && (
        <div className="grid gap-1" style={gridStyle}>
          <div />
          {g.r1.map((c, i) => {
            if (g.r1fill && c !== null && c !== ".") {
              return (
                <GalusCell
                  key={i}
                  cKey={`l${lIdx}:${g.pfx}:r1:${i}`}
                  answers={answers}
                  setAns={setAns}
                  disabled={disabled}
                  maxLen={cellLen}
                />
              );
            }
            return (
              <div key={i} className="rounded-lg bg-card py-2 text-center font-display text-lg font-extrabold">
                {renderStatic(c)}
              </div>
            );
          })}
        </div>
      )}

      {g.r2 && (
        <div className="grid gap-1 border-b-4 border-foreground pb-1" style={gridStyle}>
          <div className="pt-2 text-center font-display text-lg font-extrabold">{opSym}</div>
          {g.r2.map((c, i) => {
            if (g.r2fill && c !== null && c !== ".") {
              return (
                <GalusCell
                  key={i}
                  cKey={`l${lIdx}:${g.pfx}:r2:${i}`}
                  answers={answers}
                  setAns={setAns}
                  disabled={disabled}
                  maxLen={cellLen}
                />
              );
            }
            return (
              <div key={i} className="rounded-lg bg-card py-2 text-center font-display text-lg font-extrabold">
                {renderStatic(c)}
              </div>
            );
          })}
        </div>
      )}

      {g.rAns && (
        <div className="grid gap-1 pt-1" style={gridStyle}>
          <div />
          {g.rAns.map((c, i) => {
            if (c === null) return <div key={i} />;
            if (c === ".") {
              return (
                <div key={i} className="py-2 text-center font-display text-lg font-extrabold">
                  .
                </div>
              );
            }
            return (
              <GalusCell
                key={i}
                cKey={kCell("res", i)}
                answers={answers}
                setAns={setAns}
                disabled={disabled}
                maxLen={cellLen}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function LongDivGrid({
  g,
  lIdx,
  answers,
  setAns,
  disabled,
}: {
  g: Galus;
  lIdx: number;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const dividend = g.dividend ?? [];
  const qAns = g.qAns ?? [];
  const n = dividend.length;
  const dividendFill = g.dividendFill !== false;
  // Grid: 1 gutter col + n dividend cols. Each cell occupies 1 grid col.
  const gridStyle = { gridTemplateColumns: `48px repeat(${n}, minmax(0, 1fr))` };
  const pfx = g.pfx;
  const kQ = (i: number) => `l${lIdx}:${pfx}:q:${i}`;
  const kD = (i: number) => `l${lIdx}:${pfx}:d:${i}`;
  const kDiv = `l${lIdx}:${pfx}:div`;
  const kM = (i: number, j: number) => `l${lIdx}:${pfx}:m:${i}_${j}`;
  const kR = (i: number, j: number) => `l${lIdx}:${pfx}:r:${i}_${j}`;
  const kRf = `l${lIdx}:${pfx}:rf`;

  // Helper: cell wrapper positioned in a specific column via gridColumn.
  const posCell = (col1based: number, span: number, node: React.ReactNode, key: string) => (
    <div key={key} style={{ gridColumn: `${col1based} / span ${span}` }}>
      {node}
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-1">
      {/* Quotient row */}
      <div className="grid gap-1" style={gridStyle}>
        <div />
        {qAns.map((c, i) => {
          if (c === null) return <div key={i} />;
          return (
            <GalusCell key={i} cKey={kQ(i)} answers={answers} setAns={setAns} disabled={disabled} />
          );
        })}
      </div>

      {/* Divisor ) Dividend */}
      <div className="grid items-center gap-1" style={gridStyle}>
        <div className="flex items-center justify-end gap-1 pr-1">
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={answers[kDiv] ?? ""}
            onChange={(e) => setAns(kDiv, e.target.value)}
            disabled={disabled}
            placeholder="?"
            className="w-10 rounded-lg border-2 border-border bg-card py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary"
          />
          <span className="font-display text-2xl font-extrabold leading-none">)</span>
        </div>
        {dividend.map((c, i) => {
          if (dividendFill) {
            return (
              <div key={i} className="border-t-4 border-foreground pt-1">
                <GalusCell cKey={kD(i)} answers={answers} setAns={setAns} disabled={disabled} />
              </div>
            );
          }
          return (
            <div
              key={i}
              className="rounded-b-lg border-t-4 border-foreground bg-card py-2 text-center font-display text-lg font-extrabold"
            >
              {renderStatic(c)}
            </div>
          );
        })}
      </div>

      {/* Per-step work rows: multiply row + remainder/bring-down row */}
      {qAns.map((_, i) => {
        // multiply row: step 0 = 1 cell at col (i+1); other steps = 2 cells at cols (i..i+1) i.e. grid cols i+1..i+2
        const isLast = i === qAns.length - 1;
        return (
          <div key={`step-${i}`} className="space-y-1">
            <div className="grid gap-1" style={gridStyle}>
              {i === 0 ? (
                posCell(
                  2 + i,
                  1,
                  <GalusCell cKey={kM(i, 0)} answers={answers} setAns={setAns} disabled={disabled} />,
                  `m-${i}-0`,
                )
              ) : (
                <>
                  {posCell(
                    1 + i,
                    1,
                    <GalusCell cKey={kM(i, 0)} answers={answers} setAns={setAns} disabled={disabled} />,
                    `m-${i}-0`,
                  )}
                  {posCell(
                    2 + i,
                    1,
                    <GalusCell cKey={kM(i, 1)} answers={answers} setAns={setAns} disabled={disabled} />,
                    `m-${i}-1`,
                  )}
                </>
              )}
            </div>
            {/* underline under the multiply cells */}
            <div className="grid gap-1" style={gridStyle}>
              {posCell(
                i === 0 ? 2 + i : 1 + i,
                i === 0 ? 1 : 2,
                <div className="h-0.5 rounded bg-foreground" />,
                `u-${i}`,
              )}
            </div>
            {/* remainder + bring-down row */}
            <div className="grid gap-1" style={gridStyle}>
              {isLast ? (
                posCell(
                  2 + i,
                  1,
                  <GalusCell
                    cKey={kRf}
                    answers={answers}
                    setAns={setAns}
                    disabled={disabled}
                    className="bg-amber-50/50"
                  />,
                  `rf`,
                )
              ) : (
                <>
                  {posCell(
                    1 + i,
                    1,
                    <GalusCell cKey={kR(i, 0)} answers={answers} setAns={setAns} disabled={disabled} />,
                    `r-${i}-0`,
                  )}
                  {posCell(
                    2 + i,
                    1,
                    <GalusCell cKey={kR(i, 1)} answers={answers} setAns={setAns} disabled={disabled} />,
                    `r-${i}-1`,
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Isi hasil bahagi (quotient) di atas. Tunjuk jalan kerja darab &amp; baki di bawah.
      </p>
    </div>
  );
}

// ============================================================
// Review mode — SrtbReview
// ============================================================
export function SrtbReview({
  lb,
  valueJson,
}: {
  lb: LangkahBertingkat;
  valueJson: string | null | undefined;
}) {
  const answers = parseAnswers(valueJson);

  const fa1Ok = chk(answers["final"], lb.fa.ans);
  const fa2Ok = lb.fa2 ? chk(answers["final2"], lb.fa2.ans) : true;

  return (
    <div className="space-y-3">
      {lb.diberi && lb.diberi.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {lb.diberi.map((d, i) => (
            <div key={i} className="rounded-2xl bg-muted/40 px-3 py-1.5 text-xs font-semibold">
              <span className="text-muted-foreground">{d.l}: </span>
              <HTML html={d.v} className="font-extrabold text-foreground" />
            </div>
          ))}
        </div>
      )}

      {lb.langkah.map((lg, li) => (
        <ReviewLangkah key={li} langkah={lg} lIdx={li} answers={answers} />
      ))}

      {lb.unitConvert && <UnitConvertReviewBlock uc={lb.unitConvert} answers={answers} />}
      <FinalReviewRow fa={lb.fa} aKey="final" answers={answers} ok={fa1Ok} />
      {lb.fa2 && <FinalReviewRow fa={lb.fa2} aKey="final2" answers={answers} ok={fa2Ok} />}

      {(!fa1Ok || !fa2Ok) && lb.hint && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          💡 <span className="font-semibold">Panduan:</span> {lb.hint}
        </div>
      )}
    </div>
  );
}

function FinalReviewRow({
  fa,
  aKey,
  answers,
  ok,
}: {
  fa: FaField;
  aKey: string;
  answers: AnswerMap;
  ok: boolean;
}) {
  const student = answers[aKey] ?? "";
  return (
    <div className={`rounded-2xl border-2 p-3 ${ok ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Jawapan Akhir</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
        {ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
        <HTML html={fa.lbl} />{" "}
        <span className={`font-extrabold ${ok ? "text-green-900" : "text-red-900"}`}>
          {student || "—"} {fa.unit ?? ""}
        </span>
      </p>
      {!ok && (
        <p className="mt-1 text-xs font-semibold text-red-800">
          Betul: <span className="font-extrabold">{fa.d ?? fa.ans} {fa.unit ?? ""}</span>
        </p>
      )}
    </div>
  );
}

function ReviewLangkah({
  langkah,
  lIdx,
  answers,
}: {
  langkah: Langkah;
  lIdx: number;
  answers: AnswerMap;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
      <p className="text-xs font-bold text-foreground">{langkah.n}</p>
      {langkah.inputs?.map((inp) => (
        <ReviewInputLine key={inp.id} inp={inp} lIdx={lIdx} answers={answers} />
      ))}
      {langkah.galus?.rAns && <ReviewGalusRes g={langkah.galus} lIdx={lIdx} answers={answers} />}
      {langkah.galus?.qAns && <ReviewGalusQ g={langkah.galus} lIdx={lIdx} answers={answers} />}
    </div>
  );
}

function StepLine({
  label,
  student,
  correct,
  ok,
}: {
  label: string;
  student: string;
  correct: string;
  ok: boolean;
}) {
  return (
    <div className="mt-2 flex items-start gap-2 text-xs">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={3} />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" strokeWidth={3} />
      )}
      <div className="flex-1">
        <p className="font-semibold text-foreground">
          <HTML html={label} />
        </p>
        <p className={ok ? "text-green-800" : "text-red-800"}>
          Jawapan anda: <span className="font-extrabold">{student || "—"}</span>
          {!ok && (
            <>
              {" · "}Betul: <span className="font-extrabold">{correct}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function ReviewInputLine({ inp, lIdx, answers }: { inp: LInput; lIdx: number; answers: AnswerMap }) {
  const baseKey = `l${lIdx}:${inp.id}`;

  if ("type" in inp && inp.type === "frac-op") {
    return <FracOpReviewBlock inp={inp} baseKey={baseKey} answers={answers} />;
  }
  if ("type" in inp && (inp.type === "frac2" || inp.type === "pct-frac")) {
    const s = `${answers[`${baseKey}_n`] ?? "?"} / ${answers[`${baseKey}_d`] ?? "?"}`;
    const ok = chk(answers[`${baseKey}_n`], inp.ans_n) && chk(answers[`${baseKey}_d`], inp.ans_d);
    return <StepLine label={inp.lbl} student={s} correct={`${inp.ans_n}/${inp.ans_d}`} ok={ok} />;
  }
  if ("type" in inp && (inp.type === "mcq4" || inp.type === "mcq3")) {
    const s = answers[baseKey] ?? "";
    const ok = chk(s, inp.ans);
    return <StepLine label={inp.lbl} student={s || "—"} correct={inp.ans} ok={ok} />;
  }
  const s = answers[baseKey] ?? "";
  const ans = (inp as TextInput | Peratus2Input).ans;
  const ok = chk(s, ans);
  const correct = "d" in inp && inp.d ? inp.d : ans;
  const lbl = inp.lbl ?? "";
  return <StepLine label={lbl} student={s || "—"} correct={correct} ok={ok} />;
}

function ReviewGalusRes({ g, lIdx, answers }: { g: Galus; lIdx: number; answers: AnswerMap }) {
  const rAns = g.rAns ?? [];
  const student = rAns
    .map((c, i) => {
      if (c === null) return "";
      if (c === ".") return ".";
      return answers[`l${lIdx}:${g.pfx}:res:${i}`] ?? "?";
    })
    .join("");
  const correct = rAns.map((c) => (c === null ? "" : String(c))).join("");
  const ok = rAns.every((c, i) => {
    if (c === null || c === ".") return true;
    return chk(answers[`l${lIdx}:${g.pfx}:res:${i}`], String(c));
  });
  return <StepLine label="Hasil pengiraan (bentuk lazim)" student={student} correct={correct} ok={ok} />;
}

function ReviewGalusQ({ g, lIdx, answers }: { g: Galus; lIdx: number; answers: AnswerMap }) {
  const qAns = g.qAns ?? [];
  const student = qAns
    .map((c, i) => (c === null ? "" : answers[`l${lIdx}:${g.pfx}:q:${i}`] ?? "?"))
    .join("");
  const correct = qAns.map((c) => (c === null ? "" : String(c))).join("");
  const ok = qAns.every((c, i) => {
    if (c === null) return true;
    return chk(answers[`l${lIdx}:${g.pfx}:q:${i}`], String(c));
  });
  return <StepLine label="Hasil bahagi (quotient)" student={student} correct={correct} ok={ok} />;
}

// ============================================================
// frac-op — self-contained multi-step fraction operation widget
// ============================================================
function FracField({
  nKey,
  dKey,
  answers,
  setAns,
  disabled,
}: {
  nKey: string;
  dKey: string;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="inline-flex flex-col items-center">
      <input
        type="text"
        value={answers[nKey] ?? ""}
        onChange={(e) => setAns(nKey, e.target.value)}
        disabled={disabled}
        placeholder="?"
        className="w-14 rounded-lg border-2 border-border bg-card px-1 py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary"
      />
      <div className="my-0.5 h-0.5 w-16 rounded bg-foreground" />
      <input
        type="text"
        value={answers[dKey] ?? ""}
        onChange={(e) => setAns(dKey, e.target.value)}
        disabled={disabled}
        placeholder="?"
        className="w-14 rounded-lg border-2 border-border bg-card px-1 py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary"
      />
    </div>
  );
}

function FracStatic({ n, d }: { n: string; d: string }) {
  return (
    <div className="inline-flex flex-col items-center">
      <span className="font-display text-base font-extrabold">{n || "?"}</span>
      <div className="my-0.5 h-0.5 w-14 rounded bg-foreground" />
      <span className="font-display text-base font-extrabold">{d || "?"}</span>
    </div>
  );
}

const UC_DEFAULT_PILIHAN = ["Ya, unit sama / Yes, same unit", "Tidak, unit berbeza / No, different units"];

function UnitConvertBlock({
  uc,
  answers,
  setAns,
  disabled,
}: {
  uc: UnitConvert;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const checkKey = "uc:check";
  const chosen = answers[checkKey];
  const pilihan = uc.checkPilihan ?? UC_DEFAULT_PILIHAN;
  const berbeza = chosen ? /tidak|no/i.test(chosen) : false;

  return (
    <div className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Semak Unit</p>
      <p className="whitespace-pre-line text-sm font-semibold text-foreground">{uc.checkQ}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {pilihan.map((p) => {
          const isChosen = chosen === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setAns(checkKey, p)}
              disabled={disabled}
              className={`rounded-2xl border-2 px-3 py-2 font-display text-sm font-extrabold shadow-soft transition ${
                isChosen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {berbeza && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-white/70 p-3">
          <p className="whitespace-pre-line text-sm font-semibold text-foreground">{uc.ar}</p>
          <div className="inline-flex rounded-full border-2 border-amber-400 bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
            {uc.factorLabel}
          </div>
          <GalusGrid g={uc.galus} lIdx={-1} answers={answers} setAns={setAns} disabled={disabled} />
        </div>
      )}
    </div>
  );
}

function UnitConvertReviewBlock({ uc, answers }: { uc: UnitConvert; answers: AnswerMap }) {
  const student = answers["uc:check"] ?? "";
  const ok = chk(student, uc.checkAns);
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
      <p className="text-xs font-bold text-foreground">Semak Unit</p>
      <StepLine label="Adakah unit sama?" student={student || "—"} correct={uc.checkAns} ok={ok} />
      {uc.galus.rAns && <ReviewGalusRes g={uc.galus} lIdx={-1} answers={answers} />}
    </div>
  );
}


function YesNoButtons({
  cKey,
  pilihan,
  answers,
  setAns,
  disabled,
}: {
  cKey: string;
  pilihan: string[];
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const chosen = answers[cKey];
  return (
    <div className="grid grid-cols-2 gap-2">
      {pilihan.map((p) => {
        const isChosen = chosen === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => setAns(cKey, p)}
            disabled={disabled}
            className={`rounded-2xl border-2 px-3 py-2 font-display text-sm font-extrabold shadow-soft transition ${
              isChosen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

function FracOpBlock({
  inp,
  baseKey,
  answers,
  setAns,
  disabled,
}: {
  inp: FracOpInput;
  baseKey: string;
  answers: AnswerMap;
  setAns: (k: string, v: string) => void;
  disabled: boolean;
}) {
  const K = {
    op: `${baseKey}_op`,
    f1n: `${baseKey}_f1n`, f1d: `${baseKey}_f1d`,
    f2n: `${baseKey}_f2n`, f2d: `${baseKey}_f2d`,
    sama: `${baseKey}_sama`,
    kgd: `${baseKey}_kgd`,
    f1eq_n: `${baseKey}_f1eq_n`, f1eq_d: `${baseKey}_f1eq_d`,
    f2eq_n: `${baseKey}_f2eq_n`, f2eq_d: `${baseKey}_f2eq_d`,
    f2flip_n: `${baseKey}_f2flip_n`, f2flip_d: `${baseKey}_f2flip_d`,
    res_n: `${baseKey}_res_n`, res_d: `${baseKey}_res_d`,
    kecil: `${baseKey}_kecil`,
    gcd_simp: `${baseKey}_gcd_simp`,
    fin_n: `${baseKey}_fin_n`, fin_d: `${baseKey}_fin_d`,
  };

  const opPilihan = inp.op_pilihan ?? DEFAULT_OP_PILIHAN;
  const yesNo = inp.samakecil_pilihan ?? DEFAULT_YESNO;
  const opChosen = answers[K.op];
  const sym = opSymOf(opChosen);
  const f1n = answers[K.f1n], f1d = answers[K.f1d];
  const f2n = answers[K.f2n], f2d = answers[K.f2d];
  const fractionsFilled = !!(f1n && f1d && f2n && f2d);

  const isAddSub = sym === "+" || sym === "−";
  const isDiv = sym === "÷";
  const isMulOrDiv = sym === "×" || sym === "÷";

  const samaVal = answers[K.sama];
  const samaNeeded = isYes(samaVal);
  const denomStepDone = isMulOrDiv
    ? fractionsFilled
    : isAddSub
      ? (samaVal ? (samaNeeded ? !!(answers[K.kgd] && answers[K.f1eq_n] && answers[K.f1eq_d] && answers[K.f2eq_n] && answers[K.f2eq_d]) : true) : false)
      : false;

  const flipDone = isDiv ? !!(answers[K.f2flip_n] && answers[K.f2flip_d]) : true;

  // Working fractions to display before "="
  let workA_n = f1n ?? "", workA_d = f1d ?? "";
  let workB_n = f2n ?? "", workB_d = f2d ?? "";
  let workSym: string = sym ?? "";
  if (isAddSub && samaNeeded) {
    workA_n = answers[K.f1eq_n] ?? workA_n;
    workA_d = answers[K.f1eq_d] ?? workA_d;
    workB_n = answers[K.f2eq_n] ?? workB_n;
    workB_d = answers[K.f2eq_d] ?? workB_d;
  } else if (isDiv) {
    workB_n = answers[K.f2flip_n] ?? "";
    workB_d = answers[K.f2flip_d] ?? "";
    workSym = "×";
  }

  const resFilled = !!(answers[K.res_n] && answers[K.res_d]);
  const kecilVal = answers[K.kecil];

  return (
    <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
      {inp.lbl && (
        <p className="text-sm font-bold text-foreground">
          <HTML html={inp.lbl} />
        </p>
      )}

      {/* Step 1: choose operation */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          ① Pilih operasi / Choose operation
        </p>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          {opPilihan.map((p) => {
            const chosen = opChosen === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAns(K.op, p)}
                disabled={disabled}
                className={`rounded-2xl border-2 px-3 py-2 font-display text-sm font-extrabold shadow-soft transition ${
                  chosen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: write both fractions */}
      {opChosen && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ② Tulis kedua-dua pecahan / Write both fractions
          </p>
          <div className="flex items-center justify-center gap-3">
            <FracField nKey={K.f1n} dKey={K.f1d} answers={answers} setAns={setAns} disabled={disabled} />
            <span className="font-display text-2xl font-extrabold">{sym ?? "?"}</span>
            <FracField nKey={K.f2n} dKey={K.f2d} answers={answers} setAns={setAns} disabled={disabled} />
          </div>
        </div>
      )}

      {/* Step 3: denominators */}
      {opChosen && fractionsFilled && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ③ Penyebut / Denominators
          </p>
          {isMulOrDiv ? (
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
              ℹ️ Untuk operasi {sym}, tidak perlu samakan penyebut. / For {sym}, no need to equalize denominators.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Perlu samakan penyebut? / Need to equalize denominators?
              </p>
              <YesNoButtons cKey={K.sama} pilihan={yesNo} answers={answers} setAns={setAns} disabled={disabled} />
              {samaVal && samaNeeded && (
                <div className="space-y-3 rounded-xl bg-card/60 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <span>LCM ({f1d}, {f2d}) =</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={answers[K.kgd] ?? ""}
                      onChange={(e) => setAns(K.kgd, e.target.value)}
                      disabled={disabled}
                      placeholder="?"
                      className="w-20 rounded-lg border-2 border-border bg-card px-2 py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <FracStatic n={f1n ?? ""} d={f1d ?? ""} />
                    <span className="text-lg font-extrabold">=</span>
                    <FracField nKey={K.f1eq_n} dKey={K.f1eq_d} answers={answers} setAns={setAns} disabled={disabled} />
                    <span className="w-4" />
                    <FracStatic n={f2n ?? ""} d={f2d ?? ""} />
                    <span className="text-lg font-extrabold">=</span>
                    <FracField nKey={K.f2eq_n} dKey={K.f2eq_d} answers={answers} setAns={setAns} disabled={disabled} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: invert (÷ only) */}
      {isDiv && denomStepDone && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ④ Songsangkan pecahan kedua / Invert the second fraction
          </p>
          <div className="flex items-center justify-center gap-3">
            <FracStatic n={f1n ?? ""} d={f1d ?? ""} />
            <span className="font-display text-2xl font-extrabold">÷</span>
            <FracStatic n={f2n ?? ""} d={f2d ?? ""} />
            <span className="text-xl font-extrabold">=</span>
            <FracStatic n={f1n ?? ""} d={f1d ?? ""} />
            <span className="font-display text-2xl font-extrabold">×</span>
            <FracField nKey={K.f2flip_n} dKey={K.f2flip_d} answers={answers} setAns={setAns} disabled={disabled} />
          </div>
        </div>
      )}

      {/* Step 5: compute result */}
      {opChosen && denomStepDone && flipDone && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {isDiv ? "⑤" : "④"} Kira hasil / Compute the result
          </p>
          <div className="flex items-center justify-center gap-3">
            <FracStatic n={workA_n} d={workA_d} />
            <span className="font-display text-2xl font-extrabold">{workSym}</span>
            <FracStatic n={workB_n} d={workB_d} />
            <span className="text-xl font-extrabold">=</span>
            <FracField nKey={K.res_n} dKey={K.res_d} answers={answers} setAns={setAns} disabled={disabled} />
          </div>
        </div>
      )}

      {/* Step 6: simplify */}
      {opChosen && denomStepDone && flipDone && resFilled && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {isDiv ? "⑥" : "⑤"} Permudahkan / Simplify
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span>Hasil / Result =</span>
              <FracStatic n={answers[K.res_n] ?? ""} d={answers[K.res_d] ?? ""} />
              <span className="ml-4">Boleh permudahkan? / Can simplify?</span>
            </div>
            <YesNoButtons cKey={K.kecil} pilihan={yesNo} answers={answers} setAns={setAns} disabled={disabled} />
            {isYes(kecilVal) && (
              <div className="space-y-3 rounded-xl bg-card/60 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span>GCD =</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={answers[K.gcd_simp] ?? ""}
                    onChange={(e) => setAns(K.gcd_simp, e.target.value)}
                    disabled={disabled}
                    placeholder="?"
                    className="w-20 rounded-lg border-2 border-border bg-card px-2 py-1 text-center font-display text-base font-extrabold outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <FracStatic n={answers[K.res_n] ?? ""} d={answers[K.res_d] ?? ""} />
                  <span className="text-xl font-extrabold">=</span>
                  <FracField nKey={K.fin_n} dKey={K.fin_d} answers={answers} setAns={setAns} disabled={disabled} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCell({ label, student, correct }: { label: string; student: string; correct: string }) {
  const ok = chk(student, correct);
  return (
    <div className="flex items-start gap-2 text-xs">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={3} />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" strokeWidth={3} />
      )}
      <div className="flex-1">
        <span className="font-semibold text-foreground">{label}: </span>
        <span className={ok ? "font-extrabold text-green-800" : "font-extrabold text-red-800"}>{student || "—"}</span>
        {!ok && (
          <span className="text-red-800"> · Betul: <span className="font-extrabold">{correct}</span></span>
        )}
      </div>
    </div>
  );
}

function FracOpReviewBlock({
  inp,
  baseKey,
  answers,
}: {
  inp: FracOpInput;
  baseKey: string;
  answers: AnswerMap;
}) {
  const K = {
    op: `${baseKey}_op`,
    f1n: `${baseKey}_f1n`, f1d: `${baseKey}_f1d`,
    f2n: `${baseKey}_f2n`, f2d: `${baseKey}_f2d`,
    sama: `${baseKey}_sama`,
    kgd: `${baseKey}_kgd`,
    f1eq_n: `${baseKey}_f1eq_n`, f1eq_d: `${baseKey}_f1eq_d`,
    f2eq_n: `${baseKey}_f2eq_n`, f2eq_d: `${baseKey}_f2eq_d`,
    f2flip_n: `${baseKey}_f2flip_n`, f2flip_d: `${baseKey}_f2flip_d`,
    res_n: `${baseKey}_res_n`, res_d: `${baseKey}_res_d`,
    kecil: `${baseKey}_kecil`,
    gcd_simp: `${baseKey}_gcd_simp`,
    fin_n: `${baseKey}_fin_n`, fin_d: `${baseKey}_fin_d`,
  };
  const sym = opSymOf(inp.op_ans);
  const isAddSub = sym === "+" || sym === "−";
  const isDiv = sym === "÷";
  const equalized = isAddSub && isYes(inp.sama_ans);
  const simplified = isYes(inp.kecil_ans);

  const rows: { label: string; student: string; correct: string }[] = [
    { label: "Operasi / Operation", student: answers[K.op] ?? "", correct: inp.op_ans },
    { label: "Pecahan 1 / Fraction 1", student: `${answers[K.f1n] ?? "?"}/${answers[K.f1d] ?? "?"}`, correct: `${inp.f1n_ans}/${inp.f1d_ans}` },
    { label: "Pecahan 2 / Fraction 2", student: `${answers[K.f2n] ?? "?"}/${answers[K.f2d] ?? "?"}`, correct: `${inp.f2n_ans}/${inp.f2d_ans}` },
  ];

  if (isAddSub && inp.sama_ans !== undefined) {
    rows.push({ label: "Samakan penyebut? / Equalize?", student: answers[K.sama] ?? "", correct: inp.sama_ans });
  }
  if (equalized) {
    if (inp.kgd_ans !== undefined) rows.push({ label: "LCM", student: answers[K.kgd] ?? "", correct: inp.kgd_ans });
    if (inp.f1eq_n_ans && inp.f1eq_d_ans)
      rows.push({ label: "Pecahan 1 setara / Fraction 1 equiv", student: `${answers[K.f1eq_n] ?? "?"}/${answers[K.f1eq_d] ?? "?"}`, correct: `${inp.f1eq_n_ans}/${inp.f1eq_d_ans}` });
    if (inp.f2eq_n_ans && inp.f2eq_d_ans)
      rows.push({ label: "Pecahan 2 setara / Fraction 2 equiv", student: `${answers[K.f2eq_n] ?? "?"}/${answers[K.f2eq_d] ?? "?"}`, correct: `${inp.f2eq_n_ans}/${inp.f2eq_d_ans}` });
  }
  if (isDiv && inp.f2flip_n_ans && inp.f2flip_d_ans) {
    rows.push({ label: "Pecahan 2 songsang / Inverted fraction 2", student: `${answers[K.f2flip_n] ?? "?"}/${answers[K.f2flip_d] ?? "?"}`, correct: `${inp.f2flip_n_ans}/${inp.f2flip_d_ans}` });
  }
  rows.push({ label: "Hasil / Result", student: `${answers[K.res_n] ?? "?"}/${answers[K.res_d] ?? "?"}`, correct: `${inp.res_n_ans}/${inp.res_d_ans}` });
  if (inp.kecil_ans !== undefined) {
    rows.push({ label: "Boleh permudahkan? / Can simplify?", student: answers[K.kecil] ?? "", correct: inp.kecil_ans });
  }
  if (simplified) {
    if (inp.gcd_simp_ans !== undefined) rows.push({ label: "GCD", student: answers[K.gcd_simp] ?? "", correct: inp.gcd_simp_ans });
    if (inp.fin_n_ans && inp.fin_d_ans)
      rows.push({ label: "Bentuk termudah / Simplest form", student: `${answers[K.fin_n] ?? "?"}/${answers[K.fin_d] ?? "?"}`, correct: `${inp.fin_n_ans}/${inp.fin_d_ans}` });
  }

  return (
    <div className="mt-2 space-y-1 rounded-xl border border-border/60 bg-card/40 p-2">
      {inp.lbl && (
        <p className="mb-1 text-xs font-bold text-foreground">
          <HTML html={inp.lbl} />
        </p>
      )}
      {rows.map((r, i) => (
        <ReviewCell key={i} label={r.label} student={r.student} correct={r.correct} />
      ))}
    </div>
  );
}
