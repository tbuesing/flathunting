import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { NewListing } from "@/db/schema";

const extractedSchema = z.object({
  title: z.string().nullable(),
  suburb: z.string().nullable().describe("Sydney suburb, e.g. 'Newtown'"),
  rentPw: z.number().int().nullable().describe("Rent in AUD per week (convert from per month if needed: pm * 12 / 52)"),
  billsIncluded: z.boolean().nullable(),
  bond: z.number().int().nullable().describe("Bond in AUD"),
  roomSizeSqm: z.number().nullable(),
  flatmates: z.number().int().nullable().describe("Number of other people living in the flat"),
  ownBathroom: z.boolean().nullable(),
  furnished: z.boolean().nullable(),
  availableFrom: z.string().nullable().describe("ISO date YYYY-MM-DD; today's date if 'now'/'immediately'"),
  minTerm: z.string().nullable().describe("Minimum stay, e.g. '3 months'"),
});

const SYSTEM = `You extract facts from a Sydney room/flatshare listing into JSON.
Only use information that is explicitly stated. If a value is not stated, return null — never guess.
Do not include names, phone numbers or email addresses of landlords or flatmates.`;

const MAX_CHARS = 20_000;

// Grobe HTML→Text-Umwandlung; reicht, damit Claude das Inserat lesen kann.
function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchListingText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Seite antwortet mit ${res.status}`);
  return htmlToText(await res.text());
}

export function platformFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Liest ein Inserat (per URL oder eingefügtem Text) und gibt vorbefüllte Felder zurück.
 * Wenn die Seite den Abruf blockiert, wirft die Funktion — der Nutzer fügt dann den Text ein.
 */
export async function extractListing({ url, text }: { url?: string; text?: string }): Promise<NewListing> {
  const source = text?.trim() || (url ? await fetchListingText(url) : "");
  if (source.length < 50) throw new Error("Zu wenig Text gefunden — bitte den Inseratstext einfügen.");

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today = new Date().toISOString().slice(0, 10);
  const { output } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    system: SYSTEM,
    prompt: `Today is ${today}.\n\nListing:\n${source.slice(0, MAX_CHARS)}`,
    output: Output.object({ schema: extractedSchema }),
  });

  const availableFrom = output.availableFrom && /^\d{4}-\d{2}-\d{2}$/.test(output.availableFrom) ? output.availableFrom : null;
  return { ...output, availableFrom, url: url || null, platform: platformFromUrl(url) };
}
