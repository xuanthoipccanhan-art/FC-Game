/* Lưu trữ: IndexedDB (dữ liệu sự nghiệp vài MB), dự phòng localStorage/bộ nhớ */
(function () {
  const FC = (window.FC = window.FC || {});
  const DB = "pitchboss27";
  const STORE = "saves";
  let dbp = null;
  const mem = {};

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (typeof indexedDB === "undefined") return rej(new Error("no idb"));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then((db) => new Promise((res, rej) => {
      const t = db.transaction(STORE, mode);
      const st = t.objectStore(STORE);
      const req = fn(st);
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    }));
  }

  FC.store = {
    async get(k) {
      try { return await tx("readonly", (st) => st.get(k)); }
      catch (e) { try { return localStorage.getItem("pb27_" + k); } catch (e2) { return mem[k]; } }
    },
    async set(k, v) {
      try { return await tx("readwrite", (st) => st.put(v, k)); }
      catch (e) { try { localStorage.setItem("pb27_" + k, v); } catch (e2) { mem[k] = v; } }
    },
    async del(k) {
      try { return await tx("readwrite", (st) => st.delete(k)); }
      catch (e) { try { localStorage.removeItem("pb27_" + k); } catch (e2) { delete mem[k]; } }
    },
  };
})();
