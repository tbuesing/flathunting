import { z } from "zod";

// Felder, die in der Tabelle von Hand bearbeitet werden dürfen.
export const listingPatchSchema = z
  .object({
    url: z.string().nullable(),
    platform: z.string().nullable(),
    title: z.string().nullable(),
    suburb: z.string().nullable(),
    rentPw: z.number().int().nullable(),
    billsIncluded: z.boolean().nullable(),
    bond: z.number().int().nullable(),
    roomSizeSqm: z.number().nullable(),
    flatmates: z.number().int().nullable(),
    ownBathroom: z.boolean().nullable(),
    furnished: z.boolean().nullable(),
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    minTerm: z.string().nullable(),
    commuteMin: z.number().int().nullable(),
    distCbdKm: z.number().nullable(),
    pros: z.string().nullable(),
    cons: z.string().nullable(),
    rating: z.number().int().min(1).max(5).nullable(),
  })
  .partial()
  .strict();
