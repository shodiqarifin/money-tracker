import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const id = getRouterParam(event, "id")
  if (!id) throw createError({ statusCode: 400, message: "Category ID wajib diisi" })

  const body = await readBody(event)
  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data: existing } = await client
    .from("categories")
    .select("id, is_system")
    .eq("id", id)
    .eq("wallet_id", wallet.id)
    .single()

  if (!existing) throw createError({ statusCode: 404, message: "Kategori tidak ditemukan" })
  if (existing.is_system) throw createError({ statusCode: 403, message: "Kategori sistem tidak bisa diubah" })

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })
  }

  const { error } = await client
    .from("categories")
    .update({ name: body.name.trim() })
    .eq("id", id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
