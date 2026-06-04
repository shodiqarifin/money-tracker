function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function localTimeToUtc(localTime: string): string {
  const [hours, minutes] = localTime.split(':').map(Number)
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  const utcHours = String(now.getUTCHours()).padStart(2, '0')
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0')
  return `${utcHours}:${utcMinutes}`
}

export function useNotifications() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  const notificationsEnabled = ref(false)
  const reminderTime = ref('20:00')
  const permission = ref<NotificationPermission>('default')
  const loading = ref(false)

  function loadSettings() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('notificationsEnabled')
    const savedTime = localStorage.getItem('reminderTime')
    if (saved !== null) notificationsEnabled.value = saved === 'true'
    if (savedTime) reminderTime.value = savedTime
    permission.value = Notification.permission
  }

  async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null
    try {
      return await navigator.serviceWorker.ready
    } catch {
      return null
    }
  }

  async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
      const vapidKey = config.public.vapidPublicKey as string
      const existing = await registration.pushManager.getSubscription()
      if (existing) return existing

      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    } catch (err) {
      console.error('Push subscribe failed:', err)
      return null
    }
  }

  async function savePushSubscription(sub: PushSubscription, utcTime: string) {
    if (!user.value) return
    const key = sub.getKey('p256dh')
    const auth = sub.getKey('auth')
    if (!key || !auth) return

    await supabase.from('push_subscriptions').upsert({
      user_id: user.value.id,
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
      reminder_time_utc: utcTime,
    }, { onConflict: 'user_id,endpoint' })
  }

  async function deletePushSubscription() {
    if (!user.value) return
    const reg = await getSwRegistration()
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }

  async function updateUtcTimeInDb(utcTime: string) {
    if (!user.value) return
    const reg = await getSwRegistration()
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await supabase
      .from('push_subscriptions')
      .update({ reminder_time_utc: utcTime })
      .eq('endpoint', sub.endpoint)
  }

  async function enableNotifications(time?: string): Promise<boolean> {
    if (!import.meta.client || !('Notification' in window)) return false

    loading.value = true
    try {
      const result = await Notification.requestPermission()
      permission.value = result
      if (result !== 'granted') return false

      const reg = await getSwRegistration()
      if (!reg) return false

      const sub = await subscribeToPush(reg)
      if (!sub) return false

      if (time) reminderTime.value = time
      const utcTime = localTimeToUtc(reminderTime.value)

      await savePushSubscription(sub, utcTime)

      notificationsEnabled.value = true
      localStorage.setItem('notificationsEnabled', 'true')
      localStorage.setItem('reminderTime', reminderTime.value)
      return true
    } finally {
      loading.value = false
    }
  }

  async function disableNotifications() {
    loading.value = true
    try {
      await deletePushSubscription()
      notificationsEnabled.value = false
      localStorage.setItem('notificationsEnabled', 'false')
    } finally {
      loading.value = false
    }
  }

  async function updateReminderTime(time: string) {
    reminderTime.value = time
    localStorage.setItem('reminderTime', time)
    if (notificationsEnabled.value) {
      const utcTime = localTimeToUtc(time)
      await updateUtcTimeInDb(utcTime)
    }
  }

  // Test notification - tampilkan notif langsung via SW
  async function sendTestNotification() {
    const reg = await getSwRegistration()
    if (!reg || Notification.permission !== 'granted') return
    await reg.showNotification('Money Tracker - Test', {
      body: 'Notifikasi kamu sudah aktif! 💰',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: 'test-notification',
    })
  }

  onMounted(() => {
    loadSettings()
  })

  return {
    notificationsEnabled,
    reminderTime,
    permission,
    loading,
    enableNotifications,
    disableNotifications,
    updateReminderTime,
    sendTestNotification,
  }
}
