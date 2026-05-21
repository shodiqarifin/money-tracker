export default defineNuxtPlugin(() => {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (redirect) {
    const router = useRouter()
    history.replaceState(null, '', '/money-tracker' + redirect)
    router.replace(redirect)
  }
})
