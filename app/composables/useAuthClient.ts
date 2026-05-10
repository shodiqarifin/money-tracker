import { signIn, signOut, signUp, useSession } from "~~/lib/auth-client"

export function useAuthClient() {
  const session = useSession()

  return {
    signIn,
    signUp,
    signOut,
    session,
    user: computed(() => session.value?.data?.user ?? null),
    isLoggedIn: computed(() => !!session.value?.data?.user),
  }
}