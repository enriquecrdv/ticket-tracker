# Ticket Tracker — índice técnico

Actualizado: 2026-08-18.

## Resumen

Aplicación de tickets construida con Next.js 16, React 19, TypeScript, MySQL,
Prisma 7 y NextAuth 4. MySQL local se ejecuta mediante XAMPP.

## Mapa rápido

| Área | Archivo principal | Responsabilidad |
| --- | --- | --- |
| Inicio | `app/page.tsx` | Renderiza el login |
| Login | `components/Login.tsx` | Formulario y redirección por rol |
| Autenticación | `lib/auth.ts` | Credentials, bcrypt, JWT y callbacks de sesión |
| Endpoint de sesión | `app/api/auth/[...nextauth]/route.ts` | Rutas HTTP de NextAuth |
| Protección | `proxy.ts` | Protege `/admin` y `/analista` |
| Prisma | `lib/prisma.ts` | Cliente compartido y adaptador MySQL/MariaDB |
| Modelo de datos | `prisma/schema.prisma` | Entidades, enums, relaciones e índices |
| Datos iniciales | `prisma/seed.ts` | Usuarios, clientes, cadenas, sucursales y tickets de prueba |
| Administrador | `app/admin/page.tsx` | Centro KAM por módulos: operación, cadenas, equipo, catálogo y reportes |
| Analista | `app/analista/page.tsx` | Atención, comentarios y estados simulados |
| Cliente | `components/client/ClientPortal.tsx` | Dashboard y navegación del portal cliente |
| Alta cliente | `components/client/CreateTicketWizard.tsx` | Ticket normal o alta fiscal guiada con documentos obligatorios |
| Detalle cliente | `components/client/TicketDetail.tsx` | Conversación, actividad y datos del ticket |
| Vista cliente | `app/test-cliente/page.tsx` | Monta el componente de cliente |
| Tipos UI | `lib/types.ts` | Tipos heredados de las pantallas simuladas |
| Datos simulados | `lib/mock-data.ts` | Datos temporales para admin y analista |
| Permisos UI | `lib/permissions.ts` | Matriz declarativa todavía no conectada al servidor |

## Rutas actuales

| Ruta | Acceso | Estado |
| --- | --- | --- |
| `/` | Público | Login funcional |
| `/admin` | Solo `ADMIN` | Dashboard conectado: usuarios, cadenas, clientes y tickets |
| `/analista` | `ADMIN` o `ANALISTA` | Gestión conectada, filtros y solicitud de información |
| `/cliente` | Solo `CLIENTE` | Portal diseñado para crear y consultar tickets propios |
| `/test-cliente` | Redirección | Compatibilidad: redirige a `/cliente` |
| `/api/auth/[...nextauth]` | Público/sesión | Funcional |
| `/api/tickets` | Sesión | Crear, consultar y listar tickets según rol/cadena |
| `/api/tickets/[id]` | Staff | Actualizar estado y asignación |
| `/api/tickets/[id]/comments` | Sesión autorizada | Conversación del ticket |
| `/api/tickets/[id]/attachments` | Sesión autorizada | Agregar adjuntos al ticket |
| `/api/tickets/export` | Staff | Exportar solicitudes de alta filtradas a Excel |
| `/api/profile` | Sesión | Consultar perfil y cambiar contraseña |
| `/api/report-catalog` | Sesión/ADMIN | Consultar y administrar el catálogo dinámico de reportes |
| `/api/notifications` | Sesión/ADMIN | Consultar y enviar notificaciones internas |
| `/api/notifications/[id]` | Sesión | Marcar una notificación como leída |
| `/api/users` | Solo `ADMIN` | Listar y crear usuarios |
| `/api/chains` | Solo `ADMIN` | Listar y crear cadenas |

## Autenticación

1. `Login.tsx` llama `signIn("credentials")`.
2. `lib/auth.ts` busca el usuario en MySQL y valida bcrypt.
3. NextAuth guarda `id` y `role` en el JWT y la sesión.
4. El login redirige `ADMIN` a `/admin` y `ANALISTA` a `/analista`.
5. `proxy.ts` bloquea sesiones ausentes y el acceso de analistas a `/admin`.

Variables locales necesarias: `DATABASE_URL`, `NEXTAUTH_URL` y
`NEXTAUTH_SECRET`. Los valores reales viven en `.env`, que está ignorado por
Git.

## Modelo Prisma

Entidades: `User`, `Client`, `Chain`, `Branch`, `Ticket`, `TicketComment`,
`TicketHistory`, `Attachment`, `AppSetting` y `Notification`.

Estados oficiales de base de datos:

```text
PENDIENTE → ASIGNADO → EN_PROGRESO → ESPERA_CLIENTE → RESUELTO → CERRADO
```

Roles: `ADMIN`, `ANALISTA`, `CLIENTE`. Niveles: `BAJO`, `MEDIO`, `ALTO`.

La traducción entre enums de Prisma y estados visuales está centralizada en
`lib/ticket-mappers.ts`.

## Enrutamiento por tarea

- Login o sesión: `components/Login.tsx`, `lib/auth.ts`, `proxy.ts`, ruta auth.
- Base de datos: `prisma/schema.prisma`, `lib/prisma.ts`; leer el seed solo si
  cambian datos iniciales.
- Tickets del cliente: `components/client/` y `app/api/tickets/`.
- Panel del analista: `app/analista/page.tsx` y APIs de tickets/comentarios.
- Administración: `app/admin/page.tsx`, APIs de usuarios y cadenas.
- Perfil compartido: `components/shared/UserMenu.tsx` y `app/api/profile/route.ts`.
- Estilos del login: `components/Login.css` y `components/Login.tsx`.
- Navegación: `components/MENU/menu.tsx` y `components/MENU/menu.css`.

## Comandos

```bash
npm run dev
npm run lint
npx tsc --noEmit
npx prisma validate
npx prisma migrate dev --name nombre_migracion
npx prisma db seed
npx prisma studio
npm run build
```

## Estado pendiente prioritario

1. Incorporar paginación y filtros del servidor para volúmenes altos.
2. Migrar los tipos visuales heredados a contratos compartidos.
3. Sustituir el almacenamiento local de adjuntos por almacenamiento externo antes de producción.
4. Añadir pruebas de autenticación, permisos y ciclo de vida del ticket.

## Regla de mantenimiento

Actualizar este índice únicamente cuando cambien rutas, responsabilidades,
modelos, autenticación, comandos o decisiones arquitectónicas.
