import { desc } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { ListingsTable } from "@/components/listings-table";
import { CRITERIA } from "@/lib/criteria";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db.select().from(listings).orderBy(desc(listings.createdAt));

  return (
    <main className="mx-auto max-w-[1800px] space-y-4 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">Flathunting Sydney</h1>
        <p className="text-sm text-neutral-500">
          Kriterien: {CRITERIA.type} · max. {CRITERIA.maxRentPw} AUD/Woche · {CRITERIA.availableBy}
        </p>
      </header>
      <ListingsTable initialRows={rows} />
    </main>
  );
}
