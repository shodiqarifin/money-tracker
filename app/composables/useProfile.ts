export function useProfile() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function updateName(name: string) {
    const { error } = await supabase.auth.updateUser({ data: { name } })
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return { user, updateName, updatePassword }
}
