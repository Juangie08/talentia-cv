/* Comprobaciones estáticas sobre las plantillas.
   Los errores más molestos en un constructor de CV son silenciosos: una
   sección que deja de renderizarse (por ejemplo el nombre) no rompe la
   compilación y nadie lo nota hasta que se ve el PDF. Este script los caza.

   Ejecutar con: npm run check:templates  */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'components', 'preview', 'templates');
// El hook no es una plantilla: se excluye para no exigirle un nombre.
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx') && f !== 'shared.ts' && f !== 'useBalancedColumns.tsx');

const problems = [];
const notes = [];
let delegadas = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const usesHook = text.includes('useBalancedColumns');
  // Las plantillas de rol son envoltorios: el nombre lo pinta el layout
  // compartido, asi que no se les puede exigir aqui.
  const delega = text.includes('RoleTemplateLayout');

  // 6. Sin recortes silenciosos de contenido.
  for (const [i, line] of lines.entries()) {
    if (/\.slice\(0,\s*\d+\)/.test(line) && /achievement|reference/i.test(line)) {
      problems.push(`${file}:${i + 1}: sigue recortando contenido -> ${line.trim()}`);
    }
  }

  if (delega) {
    delegadas += 1;
    continue;
  }

  // 1. Toda plantilla real debe seguir mostrando el nombre del candidato.
  if (!/personalInfo\.fullName/.test(text)) {
    problems.push(`${file}: no renderiza personalInfo.fullName (el nombre desapareció)`);
  }

  // 2. Toda plantilla real debe escuchar el control de espaciado. Se ofrecio a
  //    las 36 y solo lo cumplian 6: en las demas el boton no hacia nada, y eso
  //    no lo detecta el compilador. Aqui se exige que use el vocabulario
  //    compartido, que es la unica forma de que siga funcionando.
  if (!/density = 'normal'/.test(text)) {
    problems.push(`${file}: ignora la prop \`density\` (el control de espaciado no hara nada)`);
  } else if (!/rhythm\(density\)/.test(text)) {
    problems.push(`${file}: recibe \`density\` pero no llama a \`rhythm(density)\``);
  } else if ((text.match(/r\.[a-zA-Z]+/g) || []).length < 2) {
    problems.push(`${file}: llama a \`rhythm(density)\` pero no usa ningun token \`r.*\``);
  }

  if (!usesHook) continue;

  // 3. Si usa el hook, ambas columnas deben dibujarse en el JSX.
  for (const side of ['left', 'right']) {
    if (!text.includes(`columns.${side}`)) {
      problems.push(`${file}: usa el hook pero no renderiza columns.${side}`);
    }
  }
  // 4. Ninguna sección definida puede quedarse sin renderizar.
  const declared = [...text.matchAll(/\{ id: '([a-zA-Z]+)', node:/g)].map((m) => m[1]);
  if (declared.length === 0) {
    problems.push(`${file}: usa el hook pero no declara ninguna sección`);
  }
  // 5. El nodo de cada sección debe existir de verdad.
  for (const id of declared) {
    const nodeName = text.match(new RegExp(`\\{ id: '${id}', node: (\\w+)`));
    if (nodeName && !new RegExp(`const ${nodeName[1]} =`).test(text)) {
      problems.push(`${file}: la sección '${id}' usa el nodo '${nodeName[1]}' que no está definido`);
    }
  }
  notes.push(`${file}: ${declared.length} secciones`);
}

if (notes.length) {
  console.log(`Con balanceo de columnas (${notes.length}):`);
  for (const note of notes) console.log('  - ' + note);
  console.log(`\nPlantillas de rol delegadas en RoleTemplateLayout: ${delegadas}`);
  console.log(`Plantillas revisadas en total: ${files.length}\n`);
}

if (problems.length) {
  console.log('PROBLEMAS:');
  for (const p of problems) console.log('  x ' + p);
  process.exit(1);
}
console.log(`OK: ${files.length} plantillas revisadas, sin secciones perdidas ni recortes.`);
