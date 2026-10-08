import { pgTable, serial, text, integer, real, boolean, date, timestamp } from "drizzle-orm/pg-core";

// Ein Angebot = eine Zeile der Vergleichsliste. Alle Felder außer id/url sind optional,
// weil Inserate oft unvollständig sind und von Hand ergänzt werden.
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  url: text("url"),
  platform: text("platform"),
  title: text("title"),
  suburb: text("suburb"),
  rentPw: integer("rent_pw"),
  billsIncluded: boolean("bills_included"),
  bond: integer("bond"),
  roomSizeSqm: real("room_size_sqm"),
  flatmates: integer("flatmates"),
  ownBathroom: boolean("own_bathroom"),
  furnished: boolean("furnished"),
  availableFrom: date("available_from"),
  minTerm: text("min_term"),
  commuteMin: integer("commute_min"),
  distCbdKm: real("dist_cbd_km"),
  pros: text("pros"),
  cons: text("cons"),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
