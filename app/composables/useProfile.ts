export function useProfile() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function updateName(name: string) {
    const { error } = await supabase.auth.updateUser({ data: { name } })
    if (error) throw error
    await supabase.from('profiles').update({ name, updated_at: new Date().toISOString() }).eq('id', user.value?.id ?? '')
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return { user, updateName, updatePassword }
}
