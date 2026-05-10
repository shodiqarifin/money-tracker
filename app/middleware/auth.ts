import { until } from "@vueuse/core"

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { session } = useAuthClient()

  await until(session).toMatch((s) => !!s && !s.isPending, { timeout: 5000, throwOnTimeout: false })

  if (!session.value?.data?.user) {
    return navigateTo("/login")
  }
})