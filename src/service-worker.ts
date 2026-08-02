/// <reference lib="webworker" />

const sw = globalThis as unknown as ServiceWorkerGlobalScope

interface BackgroundSyncEvent extends ExtendableEvent {
  readonly tag: string
}

const CACHE_VERSION = "vicoba-pwa-v1"
const PRECACHE = `${CACHE_VERSION}-precache`
const PAGES = `${CACHE_VERSION}-pages`
const STATIC = `${CACHE_VERSION}-static`
const MEDIA = `${CACHE_VERSION}-media`
const API = `${CACHE_VERSION}-api`
const OWN_CACHES = new Set([PRECACHE, PAGES, STATIC, MEDIA, API])
const OFFLINE_URL = "/offline"

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-512x512.png",
]

function isAuthenticationUrl(url: URL) {
  return url.pathname.includes("/auth/") || url.pathname.includes("/me/auth/")
}

function isApiRequest(url: URL) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/api/proxy/")
}

function isCacheableResponse(response: Response) {
  const cacheControl = response.headers.get("cache-control") ?? ""
  return response.ok
    && !response.headers.has("set-cookie")
    && !/no-store|private/i.test(cacheControl)
}

async function cacheFirst(request: Request, cacheName: string) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (isCacheableResponse(response)) await cache.put(request, response.clone())
  return response
}

async function networkFirst(request: Request, cacheName: string, fallback?: string) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (isCacheableResponse(response)) await cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (fallback) {
      const fallbackResponse = await caches.match(fallback)
      if (fallbackResponse) return fallbackResponse
    }
    return new Response(JSON.stringify({ detail: "You are offline and no cached response is available." }), {
      status: 503,
      headers: { "content-type": "application/json" },
    })
  }
}

async function clearPrivateCaches() {
  await Promise.all([API, PAGES].map((cacheName) => caches.delete(cacheName)))
}

async function notifyClients(type: string, payload: Record<string, unknown> = {}) {
  const clients = await sw.clients.matchAll({ includeUncontrolled: true, type: "window" })
  clients.forEach((client) => client.postMessage({ type, ...payload }))
}

sw.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)))
})

sw.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith("vicoba-pwa-") && !OWN_CACHES.has(key)).map((key) => caches.delete(key)))
    await sw.clients.claim()
    await notifyClients("PWA_ACTIVATED")
  })())
})

sw.addEventListener("message", (event) => {
  const message = event.data as { type?: string } | undefined
  if (message?.type === "SKIP_WAITING") void sw.skipWaiting()
  if (message?.type === "CLEAR_PRIVATE_CACHES") event.waitUntil(clearPrivateCaches())
})

sw.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== sw.location.origin) return

  if (request.method !== "GET") {
    if (request.method === "POST" && url.pathname.includes("/logout")) {
      event.waitUntil(clearPrivateCaches())
    }
    return
  }

  // Never place credentials, authentication responses, or explicitly
  // authorized requests in Cache Storage.
  if (isAuthenticationUrl(url) || request.headers.has("authorization")) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES, OFFLINE_URL))
    return
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API))
    return
  }

  if (url.pathname.startsWith("/_next/static/") || ["style", "script", "font", "worker"].includes(request.destination)) {
    event.respondWith(cacheFirst(request, STATIC))
    return
  }

  if (["image", "audio", "video"].includes(request.destination) || /\.(?:png|jpe?g|gif|svg|webp|ico|pdf|docx?|xlsx?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, MEDIA))
  }
})

// Push and sync listeners establish the extension points without storing
// subscriptions, secrets, or offline mutations yet.
sw.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json() as { title?: string; body?: string; url?: string; icon?: string }
  event.waitUntil(sw.registration.showNotification(data.title ?? "VICOBA Community Hub", {
    body: data.body,
    icon: data.icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: { url: data.url ?? "/notifications" },
  }))
})

sw.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const destination = String((event.notification.data as { url?: string } | undefined)?.url ?? "/notifications")
  event.waitUntil((async () => {
    const clients = await sw.clients.matchAll({ type: "window", includeUncontrolled: true })
    const existing = clients.find((client) => "focus" in client)
    if (existing) {
      await existing.navigate(destination)
      await existing.focus()
      return
    }
    await sw.clients.openWindow(destination)
  })())
})

sw.addEventListener("sync", ((event: BackgroundSyncEvent) => {
  if (event.tag === "vicoba-pending-actions") {
    event.waitUntil(notifyClients("PWA_BACKGROUND_SYNC_REQUESTED"))
  }
}) as EventListener)
