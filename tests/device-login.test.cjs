const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const {webcrypto} = require("node:crypto");

function fakeIndexedDB() {
  const entries=new Map();
  const db={
    objectStoreNames:{contains(name){return name==="remembered"}},
    createObjectStore(name){assert.equal(name,"remembered")},
    close(){},
    transaction(name, mode){
      assert.equal(name,"remembered");
      const tx={oncomplete:null,onerror:null,onabort:null};
      const run=(value,action)=>{
        const req={result:undefined,onsuccess:null,onerror:null};
        queueMicrotask(()=>{
          try{req.result=action();req.onsuccess?.({target:req});queueMicrotask(()=>tx.oncomplete?.())}
          catch(e){tx.error=e;tx.onerror?.()}
        });
        return req;
      };
      tx.objectStore=()=>({
        get(key){return run(key,()=>entries.get(key))},
        put(value,key){assert.equal(mode,"readwrite");return run(key,()=>{entries.set(key,value);return key})},
        delete(key){assert.equal(mode,"readwrite");return run(key,()=>{entries.delete(key);return undefined})}
      });
      return tx
    }
  };
  return {entries,open(name,version){
    assert.equal(version,1);
    const req={result:db,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};
    queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
    return req
  }}
}
test("trusted-device credentials can be saved, restored and forgotten",async()=>{
  const indexedDB=fakeIndexedDB();
  const context={window:{indexedDB,crypto:webcrypto},TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Date,JSON,Error,Promise};
  vm.runInNewContext(fs.readFileSync("device-login.js","utf8"),context);
  const api=context.window.BattleshipDeviceLogin;
  assert.equal(await api.load(),null);
  const original={token:"github_pat_example_not_a_real_token",secretPassword:"Min egen lengre hemmelig frase"};
  await api.save(original);
  const stored=indexedDB.entries.get("owner-credentials");
  assert.equal(stored.version,1);
  assert.equal(typeof stored.iv[0],"number");
  assert.equal(indexedDB.entries.get("local-key").extractable,false);
  assert.ok(!JSON.stringify(stored).includes(original.token),"token must not be plaintext in IndexedDB data");
  assert.deepEqual(JSON.parse(JSON.stringify(await api.load())),original);
  await api.clear();
  assert.equal(await api.load(),null);
});
test("remember-device option is explicit and never stores to localStorage",()=>{
  const html=fs.readFileSync("index.html","utf8");
  assert.match(html,/id="rememberDevice" type="checkbox"/);
  assert.match(html,/restoreRemembered\(\)/);
  assert.match(html,/async function saveRemembered/);
  assert.match(html,/await window.BattleshipDeviceLogin.clear\(\)/);
  assert.match(html,/id="secretPass"[^>]*minlength="12"/);
  assert.match(html,/id="toggleSecret"/);
  const device=fs.readFileSync("device-login.js","utf8");
  assert.doesNotMatch(device,/localStorage/);
});
