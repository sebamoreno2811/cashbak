self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/img/logo_no_text.png",
      badge: "/img/logo_no_text.png",
      data: { url: data.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin) && "focus" in c)
      if (existing) return existing.focus().then((c) => c.navigate(url))
      return clients.openWindow(url)
    })
  )
})
