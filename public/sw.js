// オフラインでも開けるようにするための Service Worker
// ビルド時に BUILD_ID と PRECACHE（配信する全ファイル）が書き込まれる。
// 初回に全ファイルを端末に保存するので、通信できなくても、まだ開いていない画面を含めてすべて使える。
const BUILD_ID = '__BUILD_ID__';
const PRECACHE = /*__PRECACHE__*/ [];
const CACHE = `jugyo-kakunin-${BUILD_ID}`;
const url = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((path) => cache.add(url(path)))))
      .then(() => self.skipWaiting()),
  );
});

// 古いビルドの保存データを削除する
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

  // ページ本体: 通信できるときは最新を取得し、できないときは保存済みの index.html を使う
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url('index.html'), copy)); }
          return res;
        })
        .catch(() => caches.match(url('index.html'))),
    );
    return;
  }

  // 画像・スクリプトなど: 保存済みを優先し、無ければ通信して保存する
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
