import { drizzle } from "drizzle-orm/d1";

export const createD1Store = (db: D1Database) => {
  if (!db) throw new Error("AmbiOS requires the DB D1 binding.");
  return drizzle(db);
};
