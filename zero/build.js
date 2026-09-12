/* Inlines css/styles.css + js/app.js into index.html to produce
   zero-standalone.html — a single self-contained file you can paste
   into a design tool, email, or open from anywhere.

   Run:  node build.js
*/
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'css/styles.css'), 'utf8');
// Vault first: app.js reads Vault.isEnabled() while initialising.
const js = ['js/vault.js', 'js/hud.js', 'js/storage.js', 'js/files.js', 'js/abilities.js', 'js/app.js']
  .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

// NOTE: the replacement MUST be a function, not a string. In a replacement
// string, `$$` means a literal `$` and `$'` means "the rest of the input" —
// and our CSS/JS contain both. A function's return value is used verbatim.
const out = html
  .replace('<link rel="stylesheet" href="css/styles.css" />', () => `<style>\n${css}\n  </style>`)
  .replace('<script src="js/vault.js"></script>\n  <script src="js/hud.js"></script>\n  <script src="js/storage.js"></script>\n  <script src="js/files.js"></script>\n  <script src="js/abilities.js"></script>\n  <script src="js/app.js"></script>', () => `<script>\n${js}\n  </script>`);

if (out.includes('css/styles.css') || out.includes('js/app.js') || out.includes('js/vault.js') || out.includes('js/abilities.js') || out.includes('js/storage.js') || out.includes('js/hud.js') || out.includes('js/files.js')) {
  console.error('✗ Inlining failed — a reference was left behind.');
  process.exit(1);
}

// Verify byte-for-byte that what we embedded is what we read. Substring
// containment, not slicing: the scaffolds inside abilities.js contain a
// literal <script> tag, so index-hunting for the wrapper finds that instead.
if (!out.includes(js)) { console.error('✗ Embedded JS does not match its sources'); process.exit(1); }
if (!out.includes(css)) { console.error('✗ Embedded CSS does not match css/styles.css'); process.exit(1); }

// Embed the design assets as data URIs so the standalone stays one file.
// (The multi-file zero/ version references them by relative path instead.)
const mime = { '.jpg': 'image/jpeg', '.png': 'image/png' };
const dataUri = rel => {
  const ext = path.extname(rel);
  const b64 = fs.readFileSync(path.join(dir, rel)).toString('base64');
  return `data:${mime[ext]};base64,${b64}`;
};
let out2 = out
  .replace(/url\('assets\/backdrop\.jpg'\)/g, () => `url('${dataUri('assets/backdrop.jpg')}')`)
  .replace(/src="assets\/zero-mark\.png"/g, () => `src="${dataUri('assets/zero-mark.png')}"`)
  .replace(/src="assets\/zero-crest\.png"/g, () => `src="${dataUri('assets/zero-crest.png')}"`);
if (/assets\/(backdrop\.jpg|zero-mark\.png|zero-crest\.png)/.test(out2)) {
  console.error('✗ An asset reference was left un-embedded.'); process.exit(1);
}

fs.writeFileSync(path.join(dir, 'zero-standalone.html'), out2);
console.log(`✓ zero-standalone.html written (${(out2.length / 1024).toFixed(1)} KB, self-contained)`);
console.log('✓ verified: embedded CSS and JS match sources byte-for-byte');
