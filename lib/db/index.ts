import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { requireEnv } from "@/lib/env";

import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    db = drizzle(neon(requireEnv("DATABASE_URL")), { schema });
  }

  return db;
}

export { schema };
