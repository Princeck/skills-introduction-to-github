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
const js = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');

// NOTE: the replacement MUST be a function, not a string. In a replacement
// string, `$$` means a literal `$` and `$'` means "the rest of the input" —
// and our CSS/JS contain both. A function's return value is used verbatim.
const out = html
  .replace('<link rel="stylesheet" href="css/styles.css" />', () => `<style>\n${css}\n  </style>`)
  .replace('<script src="js/app.js"></script>', () => `<script>\n${js}\n  </script>`);

if (out.includes('css/styles.css') || out.includes('js/app.js')) {
  console.error('✗ Inlining failed — a reference was left behind.');
  process.exit(1);
}

// Verify byte-for-byte that what we embedded is what we read.
const embeddedJs = out.slice(out.lastIndexOf('<script>') + 8, out.lastIndexOf('</script>')).trim();
const embeddedCss = out.slice(out.indexOf('<style>') + 7, out.indexOf('</style>')).trim();
if (embeddedJs !== js.trim()) { console.error('✗ Embedded JS does not match js/app.js'); process.exit(1); }
if (embeddedCss !== css.trim()) { console.error('✗ Embedded CSS does not match css/styles.css'); process.exit(1); }

fs.writeFileSync(path.join(dir, 'zero-standalone.html'), out);
console.log(`✓ zero-standalone.html written (${(out.length / 1024).toFixed(1)} KB, self-contained)`);
console.log('✓ verified: embedded CSS and JS match sources byte-for-byte');
