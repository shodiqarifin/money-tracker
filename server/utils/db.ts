import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import { resolve } from "node:path"
import * as schema from "../database/schema"

const dbPath = resolve(process.cwd(), "data/money-tracker.db")

const client = createClient({
  url: `file:${dbPath}`,
})

// SQLite doesn't enforce FK constraints by default — this enables cascades and violation checks
client.execute("PRAGMA foreign_keys = ON")

export const db = drizzle(client, { schema })