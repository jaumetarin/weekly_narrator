# Weekly Narrator

Weekly Narrator convierte la actividad semanal de un repositorio de GitHub en un changelog narrativo y fácil de entender para personas no técnicas.

La idea es resolver un problema muy real: muchos equipos acaban redactando a mano cada viernes un resumen de commits, pull requests y cambios importantes para compartirlo con producto, negocio o dirección. Este proyecto automatiza ese proceso sin exigir Conventional Commits ni formatos rígidos en el repositorio.

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
- Interceptor JWT

### Infraestructura
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
6. El sistema recupera commits y pull requests desde GitHub
7. El backend genera un changelog narrativo y lo guarda en PostgreSQL
8. El frontend muestra el resultado en la pantalla de changelogs

## Automatización semanal

La generación semanal automática no depende de un cron interno del servidor.

En producción, el disparador previsto es un servicio externo (`cron-job.org`) que llama al endpoint:

```txt
POST /changelogs/generate
```

Ese endpoint está protegido con un header:

```txt
X-API-Key
```

Cuando la clave coincide con `CRON_API_KEY`, el backend lanza la generación semanal para todos los repositorios activos y responde inmediatamente con `202 Accepted`.

Este enfoque evita depender de que el servidor esté despierto justo a la hora del cron, algo especialmente importante en despliegues sobre Render free tier.

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
- endpoint protegido para trigger externo con `X-API-Key`
- frontend Angular funcional
- CI con GitHub Actions para backend y frontend

## Deploy previsto

### Backend
- Render

### Base de datos
- Neon PostgreSQL
- `DATABASE_URL` con pooler
- `DIRECT_URL` sin pooler para migraciones

### Frontend
- Vercel
- build Angular en modo producción usando `environment.prod.ts`

### Trigger semanal
- `cron-job.org`
- llamada a `POST /changelogs/generate`
- header `X-API-Key`

## Checklist de deploy

Para publicar el proyecto en producción:

1. Crear la base de datos en Neon y obtener `DATABASE_URL` y `DIRECT_URL`
2. Desplegar el backend en Render
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
   - `https://tu-backend.onrender.com/auth/github/callback`
5. Actualizar `src/environments/environment.prod.ts` con la URL real del backend
6. Desplegar el frontend Angular en Vercel usando la carpeta `changelog-frontend`
7. Configurar `cron-job.org` para llamar a:
   - `POST https://tu-backend.onrender.com/changelogs/generate`
   - header `X-API-Key: <tu_clave>`
8. Probar el flujo completo:
   - login con GitHub
   - selección de repositorios
   - generación manual
   - generación semanal por trigger externo

## Próximos pasos

- conectar URLs reales de producción
- desplegar backend en Render
- desplegar frontend en Vercel
- añadir badge de GitHub Actions
- completar README con enlaces públicos de demo y Swagger

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