import { desc } from "drizzle-orm";
import { db } from "@/db";
import { listings, type NewListing } from "@/db/schema";
import { extractListing, platformFromUrl } from "@/lib/extract";

export async function GET() {
  const rows = await db.select().from(listings).orderBy(desc(listings.createdAt));
  return Response.json(rows);
}

// Neues Angebot: aus URL und/oder eingefügtem Text vorbefüllen. Schlägt das fehl,
// wird trotzdem eine Zeile mit dem Link angelegt und eine Warnung zurückgegeben.
export async function POST(req: Request) {
  const { url, text } = (await req.json()) as { url?: string; text?: string };
  if (url && !/^https?:\/\//i.test(url)) return new Response("Ungültige URL", { status: 400 });

  let values: NewListing = { url: url || null, platform: platformFromUrl(url) };
  let warning: string | null = null;
  if (url || text) {
    try {
      values = await extractListing({ url, text });
    } catch (err) {
      warning = err instanceof Error ? err.message : "Auslesen fehlgeschlagen";
    }
  }

  const [row] = await db.insert(listings).values(values).returning();
  return Response.json({ row, warning }, { status: 201 });
}
