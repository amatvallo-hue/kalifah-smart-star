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
export type LInput = MCQInput | TextInput | FracInput | PctFracInput | Peratus2Input;

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
}

export interface FaField {
  lbl: string;
  ans: string;
  d?: string;
  unit?: string;
  markah?: number;
}

export interface LangkahBertingkat {
  id?: string;
  topik?: string;
  cari?: string;
  hint?: string;
  diberi?: { l: string; v: string }[];
  langkah: Langkah[];
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
  const nCols = dividend.length;
  const gridStyle = { gridTemplateColumns: `40px repeat(${nCols}, minmax(0, 1fr))` };
  const kCell = (col: number) => `l${lIdx}:${g.pfx}:q:${col}`;

  return (
    <div className="mx-auto max-w-md space-y-1">
      <div className="grid gap-1" style={gridStyle}>
        <div />
        {qAns.map((c, i) => {
          if (c === null) return <div key={i} />;
          return (
            <GalusCell key={i} cKey={kCell(i)} answers={answers} setAns={setAns} disabled={disabled} />
          );
        })}
      </div>

      <div className="grid items-center gap-1" style={gridStyle}>
        <div className="flex items-center justify-end gap-1 pr-1">
          <span className="font-display text-lg font-extrabold">{g.divisor}</span>
          <span className="font-display text-2xl font-extrabold leading-none">)</span>
        </div>
        {dividend.map((c, i) => (
          <div
            key={i}
            className="rounded-b-lg border-t-4 border-foreground bg-card py-2 text-center font-display text-lg font-extrabold"
          >
            {renderStatic(c)}
          </div>
        ))}
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Isi hasil bahagi (quotient) di atas.
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
  const ok = chk(s, inp.ans);
  const correct = "d" in inp && inp.d ? inp.d : inp.ans;
  return <StepLine label={inp.lbl} student={s || "—"} correct={correct} ok={ok} />;
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
