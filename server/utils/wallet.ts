import { eq } from "drizzle-orm"
import { db } from "./db"
import { wallets } from "../database/schema"

export async function getWalletByUserId(userId: string) {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  })

  if (!wallet) {
    throw createError({ statusCode: 404, message: "Wallet not found" })
  }

  return wallet
}