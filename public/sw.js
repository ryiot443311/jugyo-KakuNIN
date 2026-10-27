// オフラインでも開けるようにするための Service Worker
// 一度オンラインで開くと、読み込んだファイルを端末に保存し、以降は通信できなくても表示できる
const CACHE = 'jugyo-kakunin-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // ページ本体: 通信できるときは最新を取得し、できないときは保存済みを使う
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match(self.registration.scope))),
    );
    return;
  }

  // 画像・スクリプトなど: 保存済みがあればすぐ返し、裏で更新する
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});
