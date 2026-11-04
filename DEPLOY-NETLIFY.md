# Desplegar Talentia en Netlify (con tu propia cuenta)

> **Importante sobre la cuenta:** esta guía NO toca ninguna cuenta existente.
> El proyecto ya trae `netlify.toml` y `.env.example`.
> Tú decides con qué cuenta de Netlify lo conectas. **No uses la cuenta del otro
> proyecto.** Sigue la Opción A (por Git) para no arriesgarte a desplegar en la
> cuenta equivocada.

---

## 0. Qué funciona y qué necesita ajustes en Netlify

| Función | ¿Funciona en Netlify tal cual? |
|---|---|
| Crear y editar la hoja de vida | ✅ Sí (todo en el navegador) |
| Exportar PDF / Word / copiar texto | ✅ Sí (generación en cliente) |
| Importar CV con IA | ✅ Sí (ruta serverless + `AI_API_KEY`) |
| Adaptar a la oferta con IA | ✅ Sí (igual que arriba) |
| Guardar varias versiones y foto de perfil | ✅ Sí (solo en este navegador) |

La app es 100% usable en Netlify tal cual: no hay base de datos ni login que
configurar, y el editor guarda todo en el navegador de cada persona.

---

## 1. Sube el código a Git

```bash
git init
git add .
git commit -m "Talentia listo para Netlify"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

`.gitignore` ya excluye `node_modules`, `.next` y `.env`. Verifica que tu `.env`
real (con secretos) **no** se suba: `git status` no debe mostrarlo.

---

## 2. Conecta Netlify con TU cuenta (Opción A, recomendada)

1. Entra a **https://app.netlify.com** con la cuenta **nueva/correcta** (la de este proyecto).
2. **Add new site → Import an existing project → Deploy with Git → GitHub** y elige tu repo.
3. Netlify lee `netlify.toml` solo: build `npm run build`, publica `.next`, e instala el plugin de Next.js.
4. Antes del primer build, configura las variables del §3/§4 en **Site configuration → Environment variables**.

> **Opción B (CLI), solo si sabes lo que haces:** para no caer en la cuenta
> equivocada, primero `netlify logout`, luego `netlify login` (se abre el
> navegador: inicia sesión con la cuenta correcta) y después `netlify init`
> dentro de la carpeta del proyecto. Revisa con `netlify status` qué cuenta y
> qué sitio está activo ANTES de `netlify deploy`.

---

## 3. Sin base de datos y sin login

Talentia no usa base de datos: cada hoja de vida se guarda en el navegador
(localStorage) y el antiabuso de la IA es un límite por IP y minuto en memoria.
No hay `DATABASE_URL`, ni Prisma, ni migraciones, ni OAuth que configurar.

Si algún día quieres cuentas y guardado en la nube, tendrás que añadir un
Postgres gestionado y un proveedor de autenticación; hoy no hace falta.

---

## 5. Fotos de perfil (nota)

`/api/upload` escribe en `public/uploads/...`, que en Netlify es **efímero** (se
pierde entre despliegues y entre instancias). Opciones:

- **Sencillo:** los usuarios pegan una URL de foto o usan el guardado local
  (base64 en el navegador) — esto ya funciona sin backend.
- **Persistente:** migrar `/api/upload` a **Netlify Blobs** o a un bucket S3/R2.
  Es un cambio aparte; no bloquea el despliegue.

---

## 6. Tras el despliegue, verifica

- `https://tu-sitio.netlify.app/` carga la landing con la galería.
- `/editor`: crea una HDV y descarga el PDF (el texto debe ser seleccionable).
- "Importar CV" con un PDF real → la IA llena los campos (si `AI_API_KEY` está puesta).
- "Validar CV" → "Comparar con oferta" → "Adaptar mi HDV con IA".
- Guardar una versión y recargar la página: debe seguir ahí (queda en el navegador).

## Resumen de variables de entorno (Netlify)

```
NEXT_PUBLIC_SITE_URL = https://tu-sitio.netlify.app
AI_REQUESTS_PER_MINUTE  # antiabuso por IP (por defecto 15)
AI_API_KEY              # clave del endpoint de IA (solo en el servidor)
AI_BASE_URL             # https://tu-endpoint/v1
AI_MODEL                # auto o el nombre exacto del modelo
AI_VISION_MODEL         # modelo multimodal para escaneos y fotos
```
