/* ============================================================
   ZERO — STORAGE

   localStorage caps out around 5 MB and is synchronous, which
   makes it the wrong home for a growing archive of notes,
   memories and history. This layer moves the data into
   IndexedDB: hundreds of megabytes to gigabytes depending on
   free disk, asynchronous, and still entirely on this device.

   The vault is unchanged and still applies. What lands in the
   database is the same AES-GCM ciphertext that used to land in
   localStorage, so a bigger store does not mean a softer one.
   ============================================================ */

const Store = (() => {
  const DB = 'zero', VERSION = 1, SHELF = 'kv';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('no IndexedDB')); return; }
      const req = indexedDB.open(DB, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SHELF)) db.createObjectStore(SHELF);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('could not open the database'));
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(SHELF, mode);
      const req = fn(t.objectStore(SHELF));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  const get = k => tx('readonly', s => s.get(k));
  const set = (k, v) => tx('readwrite', s => s.put(v, k));
  const del = k => tx('readwrite', s => s.delete(k));
  const keys = () => tx('readonly', s => s.getAllKeys());
  const clear = () => tx('readwrite', s => s.clear());

  /* How much room this origin actually has, when the browser will say. */
  async function quota() {
    if (!navigator.storage?.estimate) return null;
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return { usage, quota, pct: quota ? (usage / quota) * 100 : 0 };
    } catch { return null; }
  }

  /* Ask the browser not to evict this data under disk pressure. */
  async function persistRequest() {
    if (!navigator.storage?.persist) return null;
    try {
      if (await navigator.storage.persisted?.()) return true;
      return await navigator.storage.persist();
    } catch { return null; }
  }

  /* One-time move of existing records out of localStorage. The old copy
     is only removed once the new one is confirmed written, so an
     interrupted migration loses nothing. */
  async function migrate(legacyKeys) {
    let moved = 0;
    for (const k of legacyKeys) {
      const v = localStorage.getItem(k);
      if (v === null) continue;
      await set(k, v);
      if (await get(k) === v) { localStorage.removeItem(k); moved++; }
    }
    return moved;
  }

  const fmtBytes = n => {
    if (!n && n !== 0) return '—';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(n < 10 && i > 0 ? 1 : 0) + ' ' + u[i];
  };

  return { get, set, del, keys, clear, quota, persistRequest, migrate, fmtBytes };
})();
