/* ============================================================
   ZERO — VAULT
   Encryption at rest for everything Zero stores.

   Without this, tasks and notes sit in localStorage as plain
   text: readable by anyone with the device, the browser profile,
   or a backup of either. With it, localStorage holds only
   AES-GCM ciphertext, and the key exists solely in memory for
   as long as the vault is unlocked.

   Scheme: PBKDF2-SHA256 (310k iterations) over the passphrase to
   derive a 256-bit AES-GCM key. Random 16-byte salt per vault,
   random 12-byte IV per record. Salt and IVs are not secret and
   are stored alongside the ciphertext; the passphrase is never
   stored anywhere, in any form.

   Consequence, stated plainly: lose the passphrase and the data
   is gone. There is no recovery path, and that is the property
   that makes it worth having.
   ============================================================ */

const Vault = (() => {
  const SALT = 'zero.vault.salt';
  const CHECK = 'zero.vault.check';
  const ITERATIONS = 310000;
  const CHECK_TOKEN = 'zero-vault-ok';

  // The derived key lives here and nowhere else. Never persisted.
  let key = null;

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const b64 = u8 => btoa(String.fromCharCode(...u8));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  function available() {
    return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.deriveKey === 'function';
  }

  function isEnabled() { return !!localStorage.getItem(SALT); }
  function isUnlocked() { return key !== null; }

  async function deriveKey(passphrase, salt) {
    const base = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,                       // non-extractable: the key cannot be read back out
      ['encrypt', 'decrypt']
    );
  }

  async function encrypt(plaintext) {
    if (!key) throw new Error('Vault is locked.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    return b64(iv) + '.' + b64(new Uint8Array(ct));
  }

  async function decrypt(payload) {
    if (!key) throw new Error('Vault is locked.');
    const dot = payload.indexOf('.');
    if (dot < 0) throw new Error('Malformed record.');
    const iv = unb64(payload.slice(0, dot));
    const ct = unb64(payload.slice(dot + 1));
    // AES-GCM is authenticated: a wrong key or tampered ciphertext
    // throws here rather than returning garbage.
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return dec.decode(pt);
  }

  /* Turn encryption on for the first time. */
  async function enable(passphrase) {
    if (!available()) throw new Error('This browser has no Web Crypto support, so the vault cannot be enabled.');
    if (passphrase.length < 8) throw new Error('Use at least 8 characters.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKey(passphrase, salt);
    localStorage.setItem(SALT, b64(salt));
    localStorage.setItem(CHECK, await encrypt(CHECK_TOKEN));
    return true;
  }

  /* Unlock an existing vault. Returns false on a wrong passphrase. */
  async function unlock(passphrase) {
    if (!isEnabled()) throw new Error('No vault has been set up on this device.');
    const salt = unb64(localStorage.getItem(SALT));
    const candidate = await deriveKey(passphrase, salt);
    const prev = key;
    key = candidate;
    try {
      // The check token proves the passphrase without touching real data.
      if (await decrypt(localStorage.getItem(CHECK)) !== CHECK_TOKEN) throw new Error('bad');
      return true;
    } catch {
      key = prev;
      return false;
    }
  }

  /* Drop the key from memory. Data stays encrypted on disk. */
  function lock() { key = null; }

  /* Remove encryption entirely. Caller re-saves data as plain text. */
  function disable() {
    key = null;
    localStorage.removeItem(SALT);
    localStorage.removeItem(CHECK);
  }

  async function changePassphrase(oldPass, newPass, reEncrypt) {
    if (!await unlock(oldPass)) throw new Error('Current passphrase is wrong.');
    const plain = await reEncrypt();          // read everything out under the old key
    await enable(newPass);                    // new salt, new key
    await reEncrypt(plain);                   // write it back under the new key
  }

  return { available, isEnabled, isUnlocked, enable, unlock, lock, disable, encrypt, decrypt, changePassphrase, ITERATIONS };
})();
