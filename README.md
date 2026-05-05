# Weekly Narrator

[![CI](https://github.com/jaumetarin/weekly_narrator/actions/workflows/ci.yml/badge.svg)](https://github.com/jaumetarin/weekly_narrator/actions/workflows/ci.yml)

Weekly Narrator convierte la actividad semanal de un repositorio de GitHub en un changelog narrativo y fácil de entender para personas no técnicas.

La idea detrás del proyecto es resolver un problema muy real: muchos equipos acaban redactando a mano cada viernes un resumen de commits, pull requests y cambios importantes para compartirlo con producto, negocio o dirección. Este proyecto automatiza ese proceso sin exigir Conventional Commits ni formatos rígidos en el repositorio.

## Demo

- Frontend: [https://weekly-narrator.vercel.app](https://weekly-narrator.vercel.app)
- Backend API: [https://weekly-narrator.onrender.com](https://weekly-narrator.onrender.com)
- Swagger: [https://weekly-narrator.onrender.com/api](https://weekly-narrator.onrender.com/api)

## Qué hace

- Permite iniciar sesión con GitHub mediante OAuth
- Recupera los repositorios del usuario autenticado
- Permite seleccionar qué repositorios quieres monitorizar
- Lee commits y pull requests recientes desde GitHub
- Genera un changelog semanal con lenguaje natural
- Guarda el resultado en PostgreSQL
- Expone una API REST documentada con Swagger
- Incluye un frontend Angular para login, selección de repositorios y visualización de changelogs

## Stack técnico

### Backend
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT
- GitHub OAuth
- Swagger
- Jest

### Frontend
- Angular
- TypeScript
- Angular Router
- HttpClient
- AuthGuard
- JWT interceptor

### Infraestructura
- Docker
- Docker Compose
- GitHub Actions
- Render
- Neon
- Vercel
- cron-job.org

## Arquitectura general

El backend está dividido en módulos por responsabilidad:

- `auth`: OAuth con GitHub, emisión y validación de JWT
- `github`: acceso a repositorios, commits y pull requests del usuario
- `changelog`: generación y lectura de changelogs
- `prisma`: acceso a base de datos

El frontend Angular vive en la carpeta `changelog-frontend` y está organizado en pantallas standalone:

- login
- callback OAuth
- repositorios
- changelogs

## Flujo principal

1. El usuario inicia sesión con GitHub
2. El backend intercambia el `code` OAuth por un `access_token`
3. El backend genera un JWT propio y redirige al frontend
4. El frontend guarda el token y protege las rutas privadas
5. El usuario selecciona los repositorios que quiere monitorizar
6. El backend recupera commits y pull requests desde GitHub
7. El backend genera un changelog narrativo y lo guarda en PostgreSQL
8. El frontend muestra el resultado en la pantalla de changelogs

## Automatización semanal

La generación semanal automática se dispara desde un servicio externo (`cron-job.org`) en lugar de depender de un cron interno del servidor.

El job semanal llama al endpoint:

```txt
POST /changelogs/generate
```

Ese endpoint está protegido con un header:

```txt
X-API-Key
```

Cuando la clave coincide con `CRON_API_KEY`, el backend lanza la generación semanal para todos los repositorios activos y responde inmediatamente con `202 Accepted`.

Este enfoque evita depender de que el servidor esté despierto justo a la hora del cron, algo especialmente importante en despliegues con spin-down por inactividad.

## Ejecución en local

### Requisitos
- Docker
- Docker Compose
- Node.js 20+

### Variables de entorno

Copia el archivo `.env.example` y renómbralo como `.env`.

Después, rellena con tus valores reales las variables sensibles, especialmente:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `CRON_API_KEY`

El archivo `.env.example` documenta la estructura completa de configuración para desarrollo local.

### Levantar backend y base de datos

Desde la raíz del proyecto:

```bash
docker compose up
```

Esto levanta:

- backend NestJS
- PostgreSQL

### Levantar frontend Angular

En otra terminal:

```bash
cd changelog-frontend
npm install
npm start
```

El frontend quedará disponible en:

```txt
http://localhost:4200
```

## Tests y build

### Backend

Desde la raíz del proyecto:

```bash
npm install
npm test -- --runInBand
npm run build
```

### Frontend

Desde `changelog-frontend`:

```bash
npm install
npm run build -- --configuration=production
```

## API y documentación

Cuando el backend está arrancado, Swagger queda disponible en:

```txt
http://localhost:3000/api
```

En producción:

```txt
https://weekly-narrator.onrender.com/api
```

## Rutas principales del frontend

- `/login`
- `/auth/callback`
- `/repositories`
- `/changelogs`

## Estado del proyecto

Actualmente el proyecto incluye:

- autenticación con GitHub
- selección persistida de repositorios
- generación manual de changelogs
- generación semanal por trigger externo
- endpoint protegido con `X-API-Key`
- frontend Angular funcional
- CI con GitHub Actions para backend y frontend
- despliegue full-stack funcionando en producción

## Deploy actual

### Frontend
- Vercel
- [https://weekly-narrator.vercel.app](https://weekly-narrator.vercel.app)

### Backend
- Render
- [https://weekly-narrator.onrender.com](https://weekly-narrator.onrender.com)

### Base de datos
- Neon PostgreSQL
- `DATABASE_URL` con pooler
- `DIRECT_URL` sin pooler para migraciones Prisma

### Trigger semanal
- cron-job.org
- llamada `POST` a `https://weekly-narrator.onrender.com/changelogs/generate`
- header `X-API-Key`

## Checklist de deploy

Para publicar el proyecto en producción:

1. Crear la base de datos en Neon y obtener `DATABASE_URL` y `DIRECT_URL`
2. Desplegar el backend en Render con Docker
3. Configurar en Render las variables de entorno:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_CALLBACK_URL`
   - `FRONTEND_URL`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `CRON_API_KEY`
4. Añadir la callback de producción en la GitHub OAuth App:
   - `https://weekly-narrator.onrender.com/auth/github/callback`
5. Configurar `src/environments/environment.prod.ts` con la URL real del backend
6. Desplegar el frontend Angular en Vercel usando la carpeta `changelog-frontend`
7. Añadir `vercel.json` para servir correctamente las rutas del frontend
8. Configurar `cron-job.org` para disparar la generación semanal
9. Probar el flujo completo:
   - login con GitHub
   - selección de repositorios
   - generación manual
   - generación semanal por trigger externo

## CI

El proyecto incluye pipeline de GitHub Actions para:

- instalar dependencias del backend
- generar Prisma Client
- ejecutar tests del backend
- compilar el backend
- compilar el frontend Angular en modo producción

## Próximos pasos

- añadir badge de GitHub Actions al README
- mejorar observabilidad y logging del backend
- refinar experiencia de error/loading en frontend
- ampliar validaciones y tests end-to-end

## Autor

Proyecto desarrollado por Jaime Tarín como pieza de portfolio para practicar y demostrar:

- NestJS
- Angular
- Prisma
- JWT
- OAuth
- PostgreSQL
- testing
- CI/CD
- despliegue full-stack
