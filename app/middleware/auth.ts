export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const user = useSupabaseUser()
  if (user.value) return

  // Session belum di-hydrate, await check langsung ke Supabase
  const client = useSupabaseClient()
  const { data: { session } } = await client.auth.getSession()

  if (!session) {
    return navigateTo("/login")
  }
})
