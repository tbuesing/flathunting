import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { listingPatchSchema } from "@/lib/listing-input";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = listingPatchSchema.safeParse(await req.json());
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 });

  const [row] = await db.update(listings).set(parsed.data).where(eq(listings.id, Number(id))).returning();
  if (!row) return new Response("Not found", { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(listings).where(eq(listings.id, Number(id)));
  return new Response(null, { status: 204 });
}
