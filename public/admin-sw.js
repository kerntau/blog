const cacheName = 'cotovo-admin-shell-v1'
const appShell = ['/admin/dashboard', '/admin/manifest.webmanifest', '/android-chrome-192x192.png']
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(appShell)).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET' || !new URL(event.request.url).pathname.startsWith('/admin')) return
	event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
		const copy = response.clone()
		caches.open(cacheName).then(cache => cache.put(event.request, copy))
		return response
	}).catch(() => caches.match('/admin/dashboard'))))
})
