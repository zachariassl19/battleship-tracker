(function (global) {
  "use strict";

  const FLEET_LENGTHS = Object.freeze({
    carrier: 8, battleship: 5, cruiser: 4,
    sub1: 3, sub2: 3, destroyer1: 2, destroyer2: 2,
    patrol1: 1, patrol2: 1
  });
  const ITERATIONS = 600000;
  const AAD = new TextEncoder().encode("POWER-HALDEN-SHIPS-V1");

  function toBase64(bytes) {
    let chars = "";
    for (const byte of bytes) chars += String.fromCharCode(byte);
    return btoa(chars);
  }
  function fromBase64(value, expectedLength) {
    if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new Error("Ugyldig kryptert fil");
    }
    const chars = atob(value);
    if (expectedLength && chars.length !== expectedLength) throw new Error("Ugyldig kryptert fil");
    return Uint8Array.from(chars, c => c.charCodeAt(0));
  }
  function validateShips(value) {
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Ugyldige skip");
    const output = {};
    const occupied = new Set();
    for (const [key, cells] of Object.entries(value)) {
      const length = FLEET_LENGTHS[key];
      if (!length || !Array.isArray(cells) || cells.length !== length || new Set(cells).size !== cells.length) {
        throw new Error("Ugyldig skipsstørrelse eller duplikat");
      }
      const positions = cells.map(cell => {
        const m = typeof cell === "string" && /^([A-L])(10|[1-9])$/.exec(cell);
        if (!m) throw new Error("Skip utenfor brettet");
        if (occupied.has(cell)) throw new Error("Skipene kan ikke overlappe");
        occupied.add(cell);
        return [m[1].charCodeAt(0) - 65, Number(m[2]) - 1];
      });
      const horizontal = positions.every(([r]) => r === positions[0][0]);
      const vertical = positions.every(([, c]) => c === positions[0][1]);
      if (!horizontal && !vertical) throw new Error("Skip må ligge på en rett linje");
      const axis = positions.map(([r, c]) => horizontal ? c : r).sort((a, b) => a - b);
      if (!axis.every((n, index) => index === 0 || n === axis[index - 1] + 1)) throw new Error("Skipene må ligge sammenhengende");
      output[key] = cells.slice();
    }
    return output;
  }
  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {name:"PBKDF2", salt, iterations:ITERATIONS, hash:"SHA-256"},
      material, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]
    );
  }
  async function encrypt(placements, password) {
    if (typeof password !== "string" || password.length < 12) {
      throw new Error("Bruk et langt hemmelig passord på minst 12 tegn");
    }
    const valid = validateShips(placements);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const plaintext = new TextEncoder().encode(JSON.stringify({v:1,ships:valid}));
    const encrypted = await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:AAD},key,plaintext);
    return {
      version:1,algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",
      iterations:ITERATIONS,salt:toBase64(salt),iv:toBase64(iv),
      ciphertext:toBase64(new Uint8Array(encrypted))
    };
  }
  async function decrypt(envelope, password) {
    if (!envelope || envelope.version !== 1 ||
        envelope.algorithm !== "AES-256-GCM" || envelope.kdf !== "PBKDF2-SHA256" ||
        envelope.iterations !== ITERATIONS) {
      throw new Error("Ukjent krypteringsformat");
    }
    const salt = fromBase64(envelope.salt,16);
    const iv = fromBase64(envelope.iv,12);
    const cipher = fromBase64(envelope.ciphertext);
    if (cipher.length < 16 || cipher.length > 50000) throw new Error("Ugyldig kryptert fil");
    const key = await deriveKey(password,salt);
    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:AAD},key,cipher);
    } catch {
      throw new Error("Feil hemmelig passord eller skadet fil");
    }
    const parsed = JSON.parse(new TextDecoder().decode(plaintext));
    if (!parsed || parsed.v !== 1) throw new Error("Ukjent skipsformat");
    return validateShips(parsed.ships);
  }
  function generatePassword() {
    const entropy = crypto.getRandomValues(new Uint8Array(24));
    return toBase64(entropy).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  }
  const api = Object.freeze({encrypt,decrypt,validateShips,generatePassword});
  global.HaldenSecretSync = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
