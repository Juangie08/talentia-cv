/* Rutas compartidas por los scripts de verificacion.
   - BUILD: donde `tsc` compila src/lib/*.ts a CommonJS para poder probarlos
     desde Node (los .ts no se ejecutan tal cual).
   - OUT:   donde caen los PDF y capturas que generan las pruebas. Son
     artefactos descartables, asi que el directorio esta en .gitignore y nada
     de esto debe terminar junto al codigo. */
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '.build');
const OUT = path.join(__dirname, '.out');

fs.mkdirSync(BUILD, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

/** Nombre de un archivo generado por una prueba, dentro de OUT. */
function outPath(filename) {
  return path.join(OUT, filename);
}

/** Ruta al modulo compilado por tsc, dentro de BUILD. */
function built(name) {
  return path.join(BUILD, `${name}.js`);
}

module.exports = { BUILD, OUT, outPath, built };
