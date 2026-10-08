import type { Listing } from "@/db/schema";

// Harte Kriterien: wer sie verletzt, wird in der Liste ausgegraut.
export const CRITERIA = {
  maxRentPw: 450, // AUD pro Woche
  type: "Zimmer",
  availableBy: "ab sofort",
};

export type Weights = {
  rent: number;
  commute: number;
  distCbd: number;
  size: number;
  rating: number;
};

export const DEFAULT_WEIGHTS: Weights = { rent: 3, commute: 3, distCbd: 1, size: 1, rating: 2 };

export const WEIGHT_LABELS: Record<keyof Weights, string> = {
  rent: "Miete",
  commute: "Fahrzeit",
  distCbd: "Entfernung CBD",
  size: "Zimmergröße",
  rating: "Eigene Note",
};

// Lineare Abbildung auf 0..1 (best → 1, worst → 0), außerhalb abgeschnitten.
function scale(value: number, worst: number, best: number) {
  const t = (value - worst) / (best - worst);
  return Math.max(0, Math.min(1, t));
}

export function violations(l: Listing, today = new Date().toISOString().slice(0, 10)): string[] {
  const v: string[] = [];
  if (l.rentPw != null && l.rentPw > CRITERIA.maxRentPw) v.push(`Miete > ${CRITERIA.maxRentPw} AUD/Woche`);
  // "ab sofort" mit etwas Puffer: Einzug innerhalb von 14 Tagen
  if (l.availableFrom) {
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 14);
    if (new Date(l.availableFrom) > limit) v.push("Einzug später als in 2 Wochen");
  }
  return v;
}

// Gewichteter Durchschnitt nur über vorhandene Werte; fehlende Werte zählen nicht als 0.
export function score(l: Listing, w: Weights): { score: number | null; covered: number; total: number } {
  const parts: [keyof Weights, number | null][] = [
    ["rent", l.rentPw != null ? scale(l.rentPw, CRITERIA.maxRentPw, 250) : null],
    ["commute", l.commuteMin != null ? scale(l.commuteMin, 60, 10) : null],
    ["distCbd", l.distCbdKm != null ? scale(l.distCbdKm, 20, 2) : null],
    ["size", l.roomSizeSqm != null ? scale(l.roomSizeSqm, 8, 18) : null],
    ["rating", l.rating != null ? scale(l.rating, 1, 5) : null],
  ];
  let sum = 0;
  let weight = 0;
  let covered = 0;
  for (const [key, value] of parts) {
    if (value == null || w[key] === 0) continue;
    sum += value * w[key];
    weight += w[key];
    covered++;
  }
  const total = parts.filter(([key]) => w[key] > 0).length;
  return { score: weight > 0 ? Math.round((sum / weight) * 100) : null, covered, total };
}
