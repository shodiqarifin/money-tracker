import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.id) throw createError({ statusCode: 401, message: "Unauthorized" })

  const body = await readBody(event)

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw createError({ statusCode: 400, message: "Nama kategori wajib diisi" })
  }
  if (!body.type || !["income", "expense"].includes(body.type)) {
    throw createError({ statusCode: 400, message: "Type harus income atau expense" })
  }

  const client = await serverSupabaseClient(event)
  const wallet = await getWalletByUserId(event, user.id)

  const { data, error } = await client
    .from("categories")
    .insert({
      wallet_id: wallet.id,
      name: body.name.trim(),
      type: body.type as "income" | "expense",
      is_preset: false,
      is_system: false,
    })
    .select("id")
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true, id: data.id }
})
