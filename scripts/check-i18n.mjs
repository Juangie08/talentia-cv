/**
 * Comprueba que cada tr('...') de la interfaz tenga su entrada en el
 * diccionario inglés (src/lib/i18n/ui-en.ts).
 *
 * Sin esta verificación, una frase nueva se muestra en español dentro de la
 * interfaz en inglés: el usuario ve media pantalla en cada idioma y no hay
 * ningún error que lo delate. Con esto, el fallo aparece al compilar.
 */
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

const dictSrc = fs.readFileSync('src/lib/i18n/ui-en.ts', 'utf8');
const keys = new Set();
const keyRe = /^\s*(?:'((?:[^'\\]|\\.)*)'|([A-Za-zÁÉÍÓÚáéíóúÑñ][\w áéíóúñ]*))\s*:/gm;
for (const m of dictSrc.matchAll(keyRe)) {
  keys.add((m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\n/g, '\n'));
}

const missing = new Map();
const trRe = /(?:^|[^\w$.])tr\(\s*'((?:[^'\\]|\\.)*)'/g;
for (const file of walk('src')) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(trRe)) {
    const key = m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n');
    if (keys.has(key)) continue;
    if (!missing.has(file)) missing.set(file, new Set());
    missing.get(file).add(key);
  }
}

let total = 0;
for (const [file, set] of missing) {
  total += set.size;
  console.error(`\n${file} (${set.size})`);
  for (const k of set) console.error('   ', JSON.stringify(k));
}

if (total > 0) {
  console.error(
    `\n${total} textos de interfaz sin traducción al inglés. Añádelos a src/lib/i18n/ui-en.ts.`,
  );
  process.exit(1);
}

console.log('check:i18n OK: todos los textos de interfaz tienen traducción.');
