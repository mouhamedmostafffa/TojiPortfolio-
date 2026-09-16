// ============================================================
// TOJI Service Worker — v29.24.854
// ✅ Network-First for HTML/JS (يجيب من الشبكة أول)
//    Cache-First for assets only (صور، icons)
// ============================================================
const CACHE_NAME = 'toji-site-v40';

// فقط الأصول الثابتة اللي بتتكاش (مش HTML أو JS)
const STATIC_ASSETS = [
    './assets/profile.webp',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/social-preview.png',
    './vendor/lucide.min.js',
    './vendor/qrcode.min.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // تجاهل أي طلب مش GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // ❌ مش بنتدخل في API calls أبدًا
    if (!url.hostname.includes(self.location.hostname)) return;
    if (url.pathname.startsWith('/api/')) return;

    // ✅ الصور والأيقونات: Cache-First (بتتغيرش كتير)
    if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico|woff2?)$/) &&
        (url.pathname.includes('/assets/') || url.pathname.includes('/vendor/'))) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(request, copy));
                    }
                    return response;
                }).catch(() => cached);
            })
        );
        return;
    }

    // ✅ HTML, JS, CSS — Network-First (يجيب من الشبكة دايمًا، fallback للكاش)
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// ==================== Web Push — تنبيهات المتصفح ====================
self.addEventListener('push', (event) => {
    let data = { title: 'TOJI', body: 'عندك تنبيه جديد', url: '/' };
    try { data = { ...data, ...event.data.json() }; } catch {}
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: './assets/icon-192.png',
            badge: './assets/icon-192.png',
            data: { url: data.url || '/' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientsList) => {
            for (const client of clientsList) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
