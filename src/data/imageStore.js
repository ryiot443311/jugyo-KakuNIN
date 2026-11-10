// マップ画像など大きなデータを IndexedDB に保存する（localStorage は 5MB 前後で上限になるため）
// IndexedDB が使えない環境（一部のプライベートモードなど）では localStorage に保存する
const DB_NAME = 'attendance-app';
const STORE = 'kv';

let dbPromise = null;
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB がありません')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB を開けません'));
    }).catch((e) => { dbPromise = null; throw e; });
  }
  return dbPromise;
}

function run(mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('保存を中止しました'));
  }));
}

const readLocal = (key) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
};

// 値を読む。以前のバージョンで localStorage に保存していた値は IndexedDB に移し、localStorage からは消す
export async function loadValue(key) {
  const legacy = readLocal(key);
  try {
    const value = await run('readonly', (s) => s.get(key));
    if (value !== undefined) return value;
    if (legacy === undefined) return undefined;
    await run('readwrite', (s) => s.put(legacy, key));
    try { localStorage.removeItem(key); } catch { /* 消せなくても読み込みは続ける */ }
    return legacy;
  } catch {
    return legacy; // IndexedDB が使えない
  }
}

// 値を保存する。IndexedDB 自体が使えないときだけ localStorage に保存する。保存に失敗したら例外を投げる
export async function saveValue(key, value) {
  let usable = true;
  try { await openDb(); } catch { usable = false; }
  if (!usable) { localStorage.setItem(key, JSON.stringify(value)); return; }
  await run('readwrite', (s) => s.put(value, key));
}
