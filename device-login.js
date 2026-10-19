(function (global) {
  "use strict";

  // Credentials are stored only on a device the user explicitly trusts.
  // The non-extractable key makes accidental raw-token disclosure harder.
  // It does NOT protect against malicious scripts running on this origin,
  // physical access to an unlocked browser, or theft of the user's device.
  const DB_NAME = "power-battleship-private-device-v1";
  const STORE = "remembered";
  const KEY_ID = "local-key";
  const CREDS_ID = "owner-credentials";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB || !global.crypto || !global.crypto.subtle) {
        reject(new Error("Nettleseren støtter ikke sikker lokal lagring"));
        return;
      }
      const request = global.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onerror = () => reject(request.error || new Error("Kunne ikke åpne lokal lagring"));
      request.onsuccess = () => resolve(request.result);
      request.onblocked = () => reject(new Error("Lokal lagring er låst av en annen fane"));
    });
  }

  function transaction(db, mode, work) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("Lokal lagring feilet"));
      tx.onabort = () => reject(tx.error || new Error("Lokal lagring ble avbrutt"));
      try {
        const request = work(tx.objectStore(STORE));
        if (request) {
          request.onsuccess = () => {result = request.result;};
          request.onerror = () => { /* transaction.onerror handles it */ };
        }
      } catch (err) {
        try { tx.abort(); } catch (_) {}
        reject(err);
      }
    });
  }

  async function withDb(callback) {
    const db = await openDatabase();
    try { return await callback(db); }
    finally { db.close(); }
  }

  async function getKey(db) {
    const existing = await transaction(db, "readonly", store => store.get(KEY_ID));
    if (existing) return existing;
    const key = await global.crypto.subtle.generateKey(
      {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]
    );
    // The key is non-extractable but persists in this browser through structured clone.
    await transaction(db, "readwrite", store => store.put(key, KEY_ID));
    return key;
  }

  async function save(data) {
    if (!data || typeof data.token !== "string" || !data.token.trim()) {
      throw new Error("Mangler GitHub-nøkkel");
    }
    if (data.secretPassword && typeof data.secretPassword !== "string") {
      throw new Error("Ugyldig skipskart-passord");
    }
    await withDb(async db => {
      const key = await getKey(db);
      const iv = global.crypto.getRandomValues(new Uint8Array(12));
      const encoded = encoder.encode(JSON.stringify({
        token: data.token.trim(),
        secretPassword: data.secretPassword || "",
        savedAt: new Date().toISOString()
      }));
      const ciphertext = await global.crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoded);
      await transaction(db, "readwrite", store => store.put({
        iv: Array.from(iv), ciphertext: ciphertext, version:1
      }, CREDS_ID));
    });
  }

  async function load() {
    return withDb(async db => {
      const record = await transaction(db, "readonly", store => store.get(CREDS_ID));
      if (!record) return null;
      if (record.version !== 1 || !Array.isArray(record.iv) || record.iv.length !== 12 ||
          !(record.ciphertext instanceof ArrayBuffer)) {
        throw new Error("Ukjent format for lagret innlogging");
      }
      const key = await transaction(db, "readonly", store => store.get(KEY_ID));
      if (!key) throw new Error("Krypteringsnøkkelen er borte");
      const plain = await global.crypto.subtle.decrypt(
        {name:"AES-GCM",iv:new Uint8Array(record.iv)},key,record.ciphertext
      );
      const value = JSON.parse(decoder.decode(plain));
      if (!value || typeof value.token !== "string" || !value.token) {
        throw new Error("Ugyldig lagret innlogging");
      }
      return {token:value.token,secretPassword:typeof value.secretPassword==="string"?value.secretPassword:""};
    });
  }

  async function clear() {
    return withDb(async db => {
      await transaction(db,"readwrite",store => store.delete(CREDS_ID));
    });
  }

  global.BattleshipDeviceLogin = Object.freeze({save,load,clear});
})(window);
