/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Static assets - cache first
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style' || request.url.match(/\.woff2?$/),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
)

// Images - stale while revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

// Supabase API - network only
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkOnly()
)

// Navigation fallback
registerRoute(
  new NavigationRoute(async () => {
    const cache = await caches.open('workbox-precache-v2')
    const response = await cache.match('/')
    return response || fetch('/')
  })
)

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: 'Money Tracker',
    body: 'Jangan lupa catat pengeluaran dan pemasukanmu hari ini! 💰',
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: 'daily-reminder',
      requireInteraction: false,
    })
  )
})

// Tap notifikasi → buka app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow('/')
    })
  )
})
