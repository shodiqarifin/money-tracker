export default defineNuxtPlugin(() => {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (redirect) {
    const router = useRouter()
    history.replaceState(null, '', redirect)
    router.replace(redirect)
  }
})
