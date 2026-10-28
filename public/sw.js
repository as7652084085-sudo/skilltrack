/* SkillTrack service worker: offline app shell + runtime asset cache. */
/* The Vite build stamps this placeholder so every deployment installs a new worker. */
const CACHE_PREFIX = 'skilltrack'
const BUILD_VERSION = '__SKILLTRACK_BUILD_VERSION__'
const CACHE_NAME = `${CACHE_PREFIX}-${BUILD_VERSION}`
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
]

const isDevelopmentPath = (pathname) =>
  pathname.startsWith('/src/') ||
  pathname.startsWith('/@vite') ||
  pathname.startsWith('/node_modules/') ||
  pathname.startsWith('/@react-refresh')

const cacheBuildAssets = async (cache) => {
  try {
    const response = await fetch('/index.html', { cache: 'reload' })
    if (!response.ok) return

    await cache.put('/index.html', response.clone())
    const html = await response.text()
    const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
      .map((match) => match[1])
      .filter((path, index, list) => list.indexOf(path) === index)

    if (assetPaths.length) await cache.addAll(assetPaths)
  } catch {
    // The app shell still works if build assets cannot be discovered.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(APP_SHELL)
      await cacheBuildAssets(cache)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isDevelopmentPath(url.pathname)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        const offlineShell =
          (await cache.match('/index.html', { ignoreVary: true })) ||
          (await cache.match('/', { ignoreVary: true }))

        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.put('/index.html', response.clone())
            return response
          }
          return offlineShell || response
        } catch {
          return offlineShell || Response.error()
        }
      })(),
    )
    return
  }

  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  event.waitUntil(network.then(() => undefined))

  event.respondWith(
    (async () => {
      // Vite serves assets with Vary: Origin. Ignore that when replaying a
      // cached response offline so keyed JS/CSS still load without a network.
      const cached = await caches.match(request, { ignoreVary: true })
      if (cached) return cached
      return (
        (await network) ||
        new Response('Offline', { status: 503, statusText: 'Offline' })
      )
    })(),
  )
})
