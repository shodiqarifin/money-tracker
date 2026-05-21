export function useAuthClient() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const displayName = computed(() => user.value?.user_metadata?.name || user.value?.email || "")
  const isLoggedIn = computed(() => !!user.value)

  async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email: string, password: string, name: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, displayName, isLoggedIn, signIn, signUp, signOut }
}
