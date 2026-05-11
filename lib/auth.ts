import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../server/utils/db"
import * as schema from "../server/database/schema"
import { nanoid } from "nanoid"
import { eq } from "drizzle-orm"

const PRESET_CATEGORIES = [
  { name: "Gaji / Income", type: "income" as const },
  { name: "Bonus / Extra Income", type: "income" as const },
  { name: "Transportasi", type: "expense" as const },
  { name: "Makan & Minum", type: "expense" as const },
  { name: "Hiburan", type: "expense" as const },
  { name: "Belanja Kebutuhan", type: "expense" as const },
  { name: "Kesehatan", type: "expense" as const },
]

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (!ctx.path.startsWith("/sign-up/email")) return
      const userId = ctx.context.newSession?.user?.id
      if (!userId) return

      // Cek apakah wallet sudah ada (idempotent)
      const existingWallet = await db.query.wallets.findFirst({
        where: eq(schema.wallets.userId, userId),
      })
      if (existingWallet) return

      const walletId = nanoid()

      await db.transaction(async (tx) => {
        // 1. Buat wallet
        await tx.insert(schema.wallets).values({
          id: walletId,
          userId,
          name: "My Wallet",
          type: "personal",
        })

        // 2. Buat dua system categories — satu per type, sebagai fallback saat category dihapus
        await tx.insert(schema.categories).values([
          { id: nanoid(), walletId, name: "Uncategorized", type: "income", isPreset: false, isSystem: true },
          { id: nanoid(), walletId, name: "Uncategorized", type: "expense", isPreset: false, isSystem: true },
        ])

        // 3. Buat preset categories
        await tx.insert(schema.categories).values(
          PRESET_CATEGORIES.map((cat) => ({
            id: nanoid(),
            walletId,
            name: cat.name,
            type: cat.type,
            isPreset: true,
            isSystem: false,
          }))
        )
      })
    }),
  },
})