// オフラインでも開けるようにするための Service Worker
// ビルド時に BUILD_ID と PRECACHE（配信する全ファイル）が書き込まれる。
// 初回に全ファイルを端末に保存するので、通信できなくても、まだ開いていない画面を含めてすべて使える。
// ただし漢字フォントの一部（よく使う順に分けた 01 以降）は、画面で使ったときに読み込んで保存する（PRECACHE に入れない）。
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

// あとから保存した漢字フォントは、ファイル名にハッシュが付いていて中身が変わらないので、新しいビルドにも引き継ぐ
const isFontChunk = (req) => /\/techo-mincho-kanji-\d+-[^/]*\.woff2$/.test(new URL(req.url).pathname);
const carryOverFonts = async (oldKey) => {
  const [oldCache, cache] = await Promise.all([caches.open(oldKey), caches.open(CACHE)]);
  const reqs = (await oldCache.keys()).filter(isFontChunk);
  await Promise.all(reqs.map(async (req) => {
    if (await cache.match(req)) return;
    const res = await oldCache.match(req);
    if (res) await cache.put(req, res);
  }));
};

// 古いビルドの保存データを削除する
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => carryOverFonts(k).catch(() => {}).then(() => caches.delete(k)))))
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

// 通知をタップしたら、開いているアプリに切り替える（無ければ開く）
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list.find((c) => 'focus' in c);
      return client ? client.focus() : self.clients.openWindow(self.registration.scope);
    }),
  );
});
