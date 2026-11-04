# Desplegar Talentia en Vercel

Vercel detecta Next.js automáticamente: no hay que configurar comando de
build ni directorio de salida. Esta guía asume que el código ya está en
GitHub (ver §1).

## 1. Sube el código a Git

```bash
git init
git add .
git commit -m "Talentia listo para Vercel"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

`.gitignore` ya excluye `node_modules`, `.next` y `.env`. Verifica que tu
`.env` real (con secretos) **no** se suba: `git status` no debe mostrarlo.

## 2. Importa el proyecto en Vercel

1. Entra a **https://vercel.com** → **Add New → Project → Import** y elige tu repo.
2. En **Project Name** escribe `talentiacv` (así queda `talentiacv.vercel.app`).
3. Vercel detecta **Next.js** solo: deja el comando `npm run build` y el
   output por defecto. No toques nada más.
3. Antes del primer deploy, configura las variables del §3 en
   **Settings → Environment Variables** (márcalas para **Production**).

## 3. Variables de entorno (Production)

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://tu-proyecto.vercel.app` | URL canónica (metadata, Open Graph) |
| `NEXT_PUBLIC_GITHUB_URL` | URL de tu fork | Enlaces de GitHub y licencia |
| `AI_API_KEY` | tu clave | Solo servidor, nunca `NEXT_PUBLIC_*` |
| `AI_BASE_URL` | `https://tu-endpoint/v1` | Endpoint compatible con OpenAI |
| `AI_MODEL` | `auto` | O el nombre exacto del modelo |
| `AI_VISION_MODEL` | `auto` | Multimodal, para escaneos y fotos |
| `AI_TIMEOUT_MS` | `25000` | Ver §4 (el default de 90s excede el límite serverless) |
| `AI_REQUESTS_PER_MINUTE` | `15` | Antiabuso por IP y por minuto |

Sin `AI_API_KEY` la app sigue funcionando con los respaldos locales.

## 4. Tiempos de espera (importante en plan Hobby)

Las rutas de IA ya declaran `maxDuration = 60` (el máximo del plan Hobby),
pero Vercel corta la función igual al llegar al límite. Por eso:

- Pon `AI_TIMEOUT_MS=25000`: si el proveedor tarda más, la ruta devuelve
  un 504 limpio en vez de dejar la petición colgada.
- Las extracciones con imágenes (multimodal) son las más lentas: si ves
  504 frecuentes, sube a un plan con mayor duración o usa un modelo más
  rápido.

## 5. Sin base de datos y sin login

Talentia no usa base de datos: cada hoja de vida se guarda en el navegador
(localStorage) y el antiabuso de la IA es un límite por IP y minuto en
memoria. No hay nada que configurar.

## 6. Archivos subidos (nota)

No hay ruta de subida activa en esta versión; las fotos de perfil se
guardan en el navegador (base64). Si a futuro se añade escritura en
`public/uploads`, recuerda que en Vercel el sistema de archivos es
**efímero**: habría que migrar a Vercel Blob o a un bucket S3/R2.

## 7. Tras el despliegue, verifica

- `https://tu-proyecto.vercel.app/` carga la landing con la galería.
- `/editor`: crea una HDV y descarga el PDF (el texto debe ser seleccionable).
- "Importar CV" con un PDF real → la IA llena los campos (si `AI_API_KEY` está puesta).
- "Validar CV" → "Comparar con oferta" → "Adaptar mi HDV con IA".
- Recarga la página: la HDV guardada debe seguir ahí (queda en el navegador).
