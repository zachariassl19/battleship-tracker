const test = require("node:test");
const assert = require("node:assert/strict");
const {webcrypto} = require("node:crypto");
global.crypto = webcrypto;
global.btoa = x => Buffer.from(x, "binary").toString("base64");
global.atob = x => Buffer.from(x, "base64").toString("binary");
const {encrypt, decrypt, validateShips, generatePassword} = require("../secret-sync.js");

const ships = {
  carrier:["A1","A2","A3","A4","A5","A6","A7","A8"],
  battleship:["D3","E3","F3","G3","H3"],
  cruiser:["J1","J2","J3","J4"],
  sub1:["C5","C6","C7"]
};
test("a full or partial legal fleet is valid", () => {
  assert.deepEqual(validateShips(ships), ships);
  assert.deepEqual(validateShips({}), {});
});
test("overlaps and invalid placements are rejected", () => {
  assert.throws(() => validateShips({patrol1:["A1"],patrol2:["A1"]}), /overlap/);
  assert.throws(() => validateShips({carrier:["A1"]}), /skipsstørrelse/);
  assert.throws(() => validateShips({sub1:["A1","A2","A4"]}), /sammenhengende/);
  assert.throws(() => validateShips({sub1:["A1","B2","C3"]}), /rett linje/);
  assert.throws(() => validateShips({destroyer1:["L10","M10"]}), /utenfor/);
});
test("secret data roundtrips through authenticated AES-GCM", async () => {
  const password = generatePassword();
  assert.ok(password.length >= 20);
  const cipher = await encrypt(ships,password);
  assert.equal(cipher.algorithm,"AES-256-GCM");
  assert.equal(cipher.kdf,"PBKDF2-SHA256");
  assert.equal(cipher.iterations,600000);
  const serialized=JSON.stringify(cipher);
  assert.ok(!serialized.includes("A1"),"never publish plaintext positions");
  assert.deepEqual(await decrypt(cipher,password),ships);
  const other=await encrypt(ships,password);
  assert.notEqual(other.ciphertext,cipher.ciphertext,"nonce and salt must be fresh");
  await assert.rejects(decrypt(cipher,generatePassword()),/Feil hemmelig passord/);
  const modified={...cipher,ciphertext:cipher.ciphertext.slice(0,-3)+"AAAA"};
  await assert.rejects(decrypt(modified,password),/Feil hemmelig passord|Ugyldig kryptert fil/);
});
test("password too short cannot encrypt", async () => {
  await assert.rejects(encrypt(ships,"1234"),/12 tegn/);
  await assert.rejects(encrypt(ships,"abcdefghijk"),/12 tegn/);
  const ownPassphrase="Min egen 12!";
  const encrypted=await encrypt(ships,ownPassphrase);
  assert.deepEqual(await decrypt(encrypted,ownPassphrase),ships);
});
