"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/db/schema";
import { DEFAULT_WEIGHTS, WEIGHT_LABELS, score, violations, type Weights } from "@/lib/criteria";

type Field = keyof Omit<Listing, "id" | "createdAt">;
type Kind = "text" | "int" | "num" | "bool" | "date" | "rating" | "longtext";

const COLUMNS: { key: Field; label: string; kind: Kind; width: string }[] = [
  { key: "title", label: "Titel", kind: "text", width: "w-48" },
  { key: "suburb", label: "Stadtteil", kind: "text", width: "w-32" },
  { key: "rentPw", label: "Miete/Wo", kind: "int", width: "w-20" },
  { key: "billsIncluded", label: "Bills inkl.", kind: "bool", width: "w-20" },
  { key: "bond", label: "Kaution", kind: "int", width: "w-20" },
  { key: "roomSizeSqm", label: "m²", kind: "num", width: "w-16" },
  { key: "flatmates", label: "Mitbew.", kind: "int", width: "w-16" },
  { key: "ownBathroom", label: "Eig. Bad", kind: "bool", width: "w-20" },
  { key: "furnished", label: "Möbliert", kind: "bool", width: "w-20" },
  { key: "availableFrom", label: "Frei ab", kind: "date", width: "w-36" },
  { key: "minTerm", label: "Mindestdauer", kind: "text", width: "w-28" },
  { key: "commuteMin", label: "Fahrzeit (min)", kind: "int", width: "w-20" },
  { key: "distCbdKm", label: "CBD (km)", kind: "num", width: "w-20" },
  { key: "pros", label: "Pro", kind: "longtext", width: "w-56" },
  { key: "cons", label: "Contra", kind: "longtext", width: "w-56" },
  { key: "rating", label: "Note", kind: "rating", width: "w-16" },
];

const WEIGHTS_KEY = "flathunting:weights";

function parseCell(kind: Kind, raw: string): string | number | boolean | null {
  if (raw.trim() === "") return null;
  switch (kind) {
    case "int":
    case "rating":
      return Number.isFinite(parseInt(raw, 10)) ? parseInt(raw, 10) : null;
    case "num":
      return Number.isFinite(parseFloat(raw.replace(",", "."))) ? parseFloat(raw.replace(",", ".")) : null;
    case "bool":
      return raw === "ja";
    default:
      return raw;
  }
}

function toRaw(value: unknown, kind: Kind): string {
  if (value == null) return "";
  if (kind === "bool") return value ? "ja" : "nein";
  return String(value);
}

function Cell({ row, col, onSave }: { row: Listing; col: (typeof COLUMNS)[number]; onSave: (field: Field, value: unknown) => void }) {
  const initial = toRaw(row[col.key], col.kind);
  const [raw, setRaw] = useState(initial);
  useEffect(() => setRaw(initial), [initial]);

  const commit = (next = raw) => {
    if (next !== initial) onSave(col.key, parseCell(col.kind, next));
  };
  const base = "w-full bg-transparent px-2 py-1.5 outline-none focus:bg-amber-50 dark:focus:bg-neutral-800";

  if (col.kind === "bool" || col.kind === "rating") {
    const options = col.kind === "bool" ? ["ja", "nein"] : ["1", "2", "3", "4", "5"];
    return (
      <select value={raw} onChange={(e) => { setRaw(e.target.value); commit(e.target.value); }} className={base}>
        <option value="">–</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (col.kind === "longtext") {
    return <textarea rows={1} value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={() => commit()} className={`${base} resize-y`} />;
  }
  return (
    <input
      type={col.kind === "date" ? "date" : "text"}
      inputMode={col.kind === "int" || col.kind === "num" ? "decimal" : undefined}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={`${base} ${col.kind === "int" || col.kind === "num" ? "text-right tabular-nums" : ""}`}
    />
  );
}

export function ListingsTable({ initialRows }: { initialRows: Listing[] }) {
  const [rows, setRows] = useState(initialRows);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [onlyMatching, setOnlyMatching] = useState(false);
  const [sort, setSort] = useState<{ key: Field | "score"; dir: 1 | -1 }>({ key: "score", dir: -1 });
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WEIGHTS_KEY);
      if (saved) setWeights({ ...DEFAULT_WEIGHTS, ...JSON.parse(saved) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
    } catch {}
  }, [weights]);

  const view = useMemo(() => {
    const enriched = rows.map((r) => ({ row: r, ...score(r, weights), issues: violations(r) }));
    const filtered = onlyMatching ? enriched.filter((e) => e.issues.length === 0) : enriched;
    return filtered.sort((a, b) => {
      const va = sort.key === "score" ? a.score : a.row[sort.key];
      const vb = sort.key === "score" ? b.score : b.row[sort.key];
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [rows, weights, onlyMatching, sort]);

  async function save(id: number, field: Field, value: unknown) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    const res = await fetch(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify({ [field]: value }) });
    if (!res.ok) setMessage(`Speichern fehlgeschlagen: ${await res.text()}`);
  }

  async function remove(id: number) {
    if (!confirm("Angebot aus der Liste löschen?")) return;
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/listings", { method: "POST", body: JSON.stringify({ url: url.trim() || undefined, text: text.trim() || undefined }) });
      if (!res.ok) throw new Error(await res.text());
      const { row, warning } = (await res.json()) as { row: Listing; warning: string | null };
      setRows((rs) => [row, ...rs]);
      setUrl("");
      setText("");
      setMessage(warning ? `Angelegt, aber nicht ausgelesen: ${warning}` : "Angelegt — bitte Werte prüfen.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  const toggleSort = (key: Field | "score") =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "score" ? -1 : 1 }));
  const arrow = (key: Field | "score") => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link zum Angebot (flatmates.com.au, domain.com.au, …)"
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="…oder Inseratstext einfügen (z. B. bei Facebook)"
          className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        <button disabled={busy} className="rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
          {busy ? "Lese aus…" : url || text ? "Hinzufügen" : "Leere Zeile"}
        </button>
        {message && <p className="text-sm text-neutral-600 dark:text-neutral-400 md:col-span-3">{message}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-medium">Gewichtung</span>
        {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((k) => (
          <label key={k} className="flex items-center gap-2">
            {WEIGHT_LABELS[k]}
            <input type="range" min={0} max={5} value={weights[k]} onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })} className="w-20" />
            <span className="w-3 tabular-nums">{weights[k]}</span>
          </label>
        ))}
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={onlyMatching} onChange={(e) => setOnlyMatching(e.target.checked)} />
          Nur passende Angebote
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
            <tr>
              <th className="sticky left-0 z-10 bg-neutral-50 px-2 py-2 dark:bg-neutral-900">
                <button onClick={() => toggleSort("score")}>Score{arrow("score")}</button>
              </th>
              <th className="px-2 py-2">Link</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className={`${c.width} px-2 py-2 font-medium`}>
                  <button onClick={() => toggleSort(c.key)}>{c.label}{arrow(c.key)}</button>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {view.map(({ row, score: s, covered, total, issues }) => (
              <tr key={row.id} className={`border-t border-neutral-200 align-top dark:border-neutral-800 ${issues.length ? "opacity-45" : ""}`}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 dark:bg-neutral-950" title={issues.join("\n") || `${covered}/${total} Kriterien bewertet`}>
                  <div className="font-semibold tabular-nums">{s ?? "–"}</div>
                  <div className="text-xs text-neutral-500">{issues.length ? "✕ " + issues[0] : `${covered}/${total}`}</div>
                </td>
                <td className="px-2 py-1.5">
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer" className="text-blue-600 underline dark:text-blue-400">
                      {row.platform ?? "Link"}
                    </a>
                  ) : (
                    "–"
                  )}
                </td>
                {COLUMNS.map((c) => (
                  <td key={c.key} className={`${c.width} p-0`}>
                    <Cell row={row} col={c} onSave={(field, value) => save(row.id, field, value)} />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <button onClick={() => remove(row.id)} className="text-neutral-400 hover:text-red-600" title="Löschen">✕</button>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 3} className="px-3 py-8 text-center text-neutral-500">
                  Noch keine Angebote — oben einen Link einfügen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        Score 0–100 = gewichteter Schnitt der ausgefüllten Kriterien. Fahrzeit und CBD-Entfernung bitte von Hand schätzen. Von Claude
        ausgelesene Werte vor der Entscheidung prüfen.
      </p>
    </div>
  );
}
