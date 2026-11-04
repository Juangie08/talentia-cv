# Guía de Despliegue: HDV Gratis en VPS

Esta guía te ayudará a poner la aplicación en línea esta misma noche para tus compañeros, manteniendo todo el control dentro de tu propio servidor.

## 1. Requisitos en el VPS

Asegúrate de tener instalados:

- **Node.js** (v18 o superior)
- **Nginx** (para el dominio)
- **Git**

## 2. Preparación en el Servidor

Clona tu repositorio y entra en la carpeta:

```bash
git clone <tu-repositorio>
cd hdv-gratis
npm install
```

## 3. Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto :

```bash
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"

# IA (cualquier endpoint compatible con la API de OpenAI). Necesaria para:
# extraer datos de un CV subido, adaptar la hoja de vida a una oferta y mejorar
# el contenido. La clave vive SOLO en el servidor: no la expongas ni la subas
# al repositorio.
AI_API_KEY="tu_clave"
AI_BASE_URL="https://tu-endpoint/v1"
AI_MODEL="auto"
AI_VISION_MODEL="auto"
```

> Si dejas `AI_API_KEY` vacía, la app sigue funcionando: la extracción
> automática usa un parser de respaldo y el botón "Mejorar con IA" aplica una
> mejora básica con reglas. La IA solo es un extra, no un requisito.

## 4. Base de Datos

No hay base de datos: Talentia guarda cada hoja de vida en el navegador y el
antiabuso de la IA se controla por IP en memoria. No hace falta migrar nada.

## 5. Build y Ejecución

Para que la app vuele en el VPS:

```bash
npm run build
# Usa PM2 para que la app no se apague nunca
npm install -g pm2
pm2 start npm --name "hdv-gratis" -- start -- -p 3010
```

## 6. Configuración de Fotos (Persistencia)

Asegúrate de que la carpeta de fotos tenga permisos de escritura:

```bash
mkdir -p public/uploads/photos
chmod -R 777 public/uploads
```

---

### Notas Importantes de Seguridad

