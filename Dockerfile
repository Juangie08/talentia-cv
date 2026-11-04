# Talentia — imagen de auto-hospedaje (Next.js, sin base de datos).
# Uso:  docker compose up --build
FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Dependencias primero: así el build se reutiliza mientras no cambie el lockfile.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

EXPOSE 3500

# Sin migraciones: cada hoja de vida se guarda en el navegador.
CMD ["npm", "start", "--", "-p", "3500"]
