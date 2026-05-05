self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? '⏰ Timer!', {
      body: data.body ?? '',
      icon: '/favicon.ico',
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/timer'))
})
