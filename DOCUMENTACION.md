# Portal de soporte — Documentación

Documento central del proyecto. Describe instalación, operación, arquitectura, seguridad y despliegue.

## Índice

1. [Descripción](#1-descripción)
2. [Tecnologías](#2-tecnologías)
3. [Roles y permisos](#3-roles-y-permisos)
4. [Instalación local con XAMPP](#4-instalación-local-con-xampp)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Comandos](#6-comandos)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Arquitectura](#8-arquitectura)
9. [Sistema visual y experiencia de usuario](#9-sistema-visual-y-experiencia-de-usuario)
10. [Modelo y flujo de folios](#10-modelo-y-flujo-de-folios)
11. [Seguridad](#11-seguridad)
12. [Despliegue en Hostinger](#12-despliegue-en-hostinger)
13. [Verificación posterior al despliegue](#13-verificación-posterior-al-despliegue)
14. [Actualizaciones, respaldos y reversión](#14-actualizaciones-respaldos-y-reversión)
15. [Escalabilidad y trabajo pendiente](#15-escalabilidad-y-trabajo-pendiente)
16. [Definición de terminado](#16-definición-de-terminado)

## 1. Descripción

Sistema multirol para administrar solicitudes de soporte de cadenas comerciales. Incluye portal de cliente, espacio operativo para analistas y centro de control administrativo.

Funciones principales:

- creación y seguimiento de folios;
- asignación automática de analistas por cadena y carga;
- comentarios, archivos, historial y alertas;
- catálogo editable de reportes;
- códigos de cliente y condiciones comerciales por cadena;
- comunicados y notificaciones;
- exportación de informes y altas a Excel;
- paneles diferenciados para cliente, analista y administrador.

## 2. Tecnologías

- Next.js 16 y React 19;
- TypeScript estricto;
- Prisma 7;
- MySQL/MariaDB;
- NextAuth con credenciales y sesiones JWT;
- Tailwind CSS 4;
- ExcelJS;
- Zod para validación.

## 3. Roles y permisos

### Administrador

- supervisa todos los folios y analistas;
- administra usuarios, cadenas, códigos y condiciones comerciales;
- configura asignaciones de cadenas a analistas;
- reasigna folios, cambia prioridad, estado y alertas;
- edita el catálogo, publica comunicados y genera reportes.

### Analista

- consulta sus folios asignados;
- responde, adjunta documentos y cambia el estado operativo;
- consulta cadenas y condiciones comerciales;
- exporta únicamente su actividad autorizada.

### Cliente

- crea folios para su cadena;
- consulta sucursales por código de nueve dígitos;
- responde solicitudes de información y agrega archivos;
- consulta estados, comunicados y condiciones comerciales permitidas.

Los permisos se validan en el servidor. Ocultar un botón nunca sustituye una validación de API.

## 4. Instalación local con XAMPP

1. Instala Node.js y XAMPP.
2. Inicia MySQL desde XAMPP.
3. Crea una base de datos vacía.
4. Configura las variables descritas en la siguiente sección.
5. Ejecuta:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

6. Abre `http://localhost:3000`.

El seed es exclusivamente para pruebas. No reutilices sus contraseñas ni lo ejecutes en producción.

## 5. Variables de entorno

Archivo local `.env`:

```dotenv
DATABASE_URL=mysql://USUARIO:CONTRASENA@127.0.0.1:3306/BASE
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=SECRETO_LOCAL_ALEATORIO
```

Reglas:

- `.env` nunca debe entrar a Git;
- producción requiere secretos distintos a desarrollo;
- codifica los caracteres especiales de usuario y contraseña en la URL;
- `NEXTAUTH_SECRET` debe contener al menos 32 bytes aleatorios;
- en producción, `NEXTAUTH_URL` debe usar HTTPS.

## 6. Comandos

```bash
npm run dev                 # servidor local
npm run lint                # reglas de calidad
npx tsc --noEmit            # tipos
npx prisma format           # formato del esquema
npx prisma validate         # validación de Prisma
npx prisma migrate dev      # migración local
npx prisma migrate deploy   # migraciones de producción
npx prisma db seed          # datos exclusivamente de prueba
npm run build               # compilación de producción
npm start                   # ejecución de producción
npm audit                   # dependencias vulnerables
```

## 7. Estructura del proyecto

```text
app/                 páginas y rutas HTTP
components/admin/    módulos de administración
components/analyst/  espacio operativo del analista
components/client/   portal y asistente del cliente
components/shared/   navegación, cuenta y componentes comunes
lib/                 dominio, seguridad, mapeadores y acceso a Prisma
prisma/              esquema, migraciones y datos de prueba
storage/uploads/     adjuntos locales; solo desarrollo
docs/                reservado; la documentación vive en este archivo
```

`PROJECT_INDEX.md` es el mapa técnico para agentes y mantenimiento del código. Debe actualizarse cuando cambien rutas, responsabilidades o decisiones arquitectónicas.

## 8. Arquitectura

### Principios

1. La base de datos y las APIs son la fuente de verdad.
2. Toda entrada externa se valida con Zod.
3. Toda autorización ocurre en el servidor por rol, cadena y asignación.
4. Los componentes compartidos definen navegación, estados y controles visuales.
5. Los mapeadores separan Prisma de los contratos de interfaz.

Flujo de una solicitud:

```text
Interfaz → API Next.js → sesión/permisos → validación → Prisma → mapeador → interfaz
```

No se importa Prisma desde componentes. Las APIs deben devolver únicamente los datos necesarios y mensajes de error seguros.

Entidades principales:

- `User`: acceso, rol, cadena y asignaciones;
- `Client`: código comercial y nombre de sucursal/cliente;
- `Chain`: cadenas, condiciones, clientes y analistas;
- `Ticket`: solicitud y ciclo operativo;
- `TicketComment`: conversación;
- `TicketHistory`: auditoría operativa;
- `Attachment`: metadatos de archivos;
- `Announcement` y `Notification`: comunicación interna.

## 9. Sistema visual y experiencia de usuario

Componentes comunes:

- `WorkspaceHeader`: identidad y navegación de los tres roles;
- `PageHeader`: títulos, descripciones y acciones;
- `UserMenu`: perfil, contraseña, tema, comunicados y salida;
- `lib/ui.ts`: estados, fechas y estilos reutilizables;
- `globals.css`: tokens, modo oscuro, foco y movimiento reducido.

Convenciones:

- azul: navegación y acción principal;
- ámbar/naranja: requiere atención;
- rojo: riesgo o retraso;
- verde: cerrado correctamente;
- toda pantalla debe tener estados de carga, vacío, error y éxito;
- los controles deben funcionar con teclado y mostrar foco visible;
- las tablas son la vista predeterminada para grandes volúmenes; las tarjetas son opcionales.

## 10. Modelo y flujo de folios

Estados de base de datos:

```text
PENDIENTE → ASIGNADO → EN_PROGRESO → ESPERA_CLIENTE → RESUELTO → CERRADO
```

La interfaz agrupa `RESUELTO` y `CERRADO` como cerrados cuando corresponde. Cada folio tiene un consecutivo visible iniciado en `100000`; el ID interno CUID no se usa como referencia operativa.

Asignación automática:

1. se identifica la cadena del cliente;
2. se obtienen analistas activos autorizados para esa cadena;
3. se cuenta su carga abierta;
4. se asigna al analista con menor carga;
5. administración puede reasignarlo manualmente.

Los folios sin movimiento durante más de cinco días se destacan como alerta operativa.

## 11. Seguridad

### Controles implementados

- sesiones verificadas contra usuarios activos;
- permisos por rol, cadena y analista asignado;
- limitación de intentos de acceso;
- login sin enumeración de correos;
- contraseñas nuevas de 12 caracteres con mayúscula, minúscula, número y símbolo;
- hash bcrypt con costo 12;
- protección de origen en APIs de escritura;
- CSP, anti-frame, `nosniff` y política de permisos;
- validación de extensión y firma binaria de archivos;
- nombres de archivos normalizados;
- límites de cantidad y tamaño de adjuntos;
- protección contra fórmulas inyectadas en Excel.

### Requisitos antes de producción

1. Usar HTTPS.
2. Crear un usuario MySQL exclusivo con permisos mínimos.
3. Usar otra cuenta temporal para migraciones.
4. No exponer MySQL a Internet.
5. Guardar secretos en el gestor del proveedor.
6. Migrar adjuntos a almacenamiento privado con antivirus y cifrado.
7. Sustituir el rate limiting en memoria por Redis al usar varias instancias.
8. Activar respaldos cifrados y probar restauraciones.
9. Cambiar todas las contraseñas de prueba.
10. Ejecutar auditorías de dependencias y permisos periódicamente.

Las vulnerabilidades deben reportarse al responsable técnico sin adjuntar contraseñas, tokens ni documentos reales.

## 12. Despliegue en Hostinger

Hostinger permite aplicaciones Next.js en Business Web Hosting, planes Cloud y VPS. Este proyecto requiere ejecución Node.js de servidor; no debe publicarse como sitio estático.

### Comparación

| Opción | Recomendación | Adjuntos |
| --- | --- | --- |
| Business/Cloud Node.js | Despliegue sencillo desde GitHub | Requiere almacenamiento privado externo |
| VPS | Mayor control y opción recomendada durante la etapa inicial | Puede usar volumen persistente, aunque se recomienda almacenamiento de objetos |

Documentación oficial:

- [Aplicaciones Node.js en Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Opciones Node.js](https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/)
- [Documentación de VPS](https://www.hostinger.com/support/vps/)

### Preparación

1. Usa un repositorio privado de GitHub.
2. Confirma que `.env`, respaldos y `storage/uploads` no estén versionados.
3. Ejecuta las comprobaciones de la sección 6.
4. Genera secretos exclusivos de producción.
5. Configura dominio y HTTPS.

### Business o Cloud

1. En hPanel abre **Websites → Add Website → Deploy Web App**.
2. Selecciona **Import Git Repository**.
3. Autoriza únicamente el repositorio requerido.
4. Selecciona Next.js y Node.js 22.x.
5. Usa `npm ci` para instalar y `npm run build` para compilar.
6. Agrega `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` y `NODE_ENV=production` desde variables de entorno.
7. Ejecuta `npx prisma migrate deploy` desde un entorno autorizado antes de habilitar la versión.
8. Revisa logs de compilación y ejecución.

Hostinger administra las carpetas de cada despliegue; las modificaciones manuales pueden desaparecer. Por eso `storage/uploads` no es seguro en esta modalidad.

### VPS recomendado

1. Usa Ubuntu LTS o la plantilla Docker.
2. Crea un usuario de despliegue sin acceso root directo.
3. Configura firewall y expón únicamente `22`, `80` y `443`.
4. Mantén MySQL `3306` privado.
5. Instala Node.js 22, Nginx, TLS y systemd/PM2, o utiliza Docker Compose.
6. Clona el repositorio privado y configura secretos con permisos restringidos.
7. Ejecuta:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

8. Configura Nginx para enviar HTTPS al puerto interno de Next.js.
9. Activa reinicio automático, rotación de logs y monitoreo.

Hostinger también ofrece [despliegue a VPS con GitHub Actions](https://www.hostinger.com/support/deploy-to-hostinger-vps-using-github-actions/).

### MySQL en Hostinger

- usa base y usuario exclusivos;
- usa `utf8mb4`;
- no habilites “Any Host” (`%`);
- si la base está separada, autoriza solamente la IP fija de la aplicación;
- si aplicación y MySQL están en el mismo VPS, usa red local;
- conserva una cuenta distinta para migraciones.

Referencia: [Remote MySQL en Hostinger](https://support.hostinger.com/en/articles/1583546-how-to-set-up-remote-mysql-access-in-hostinger).

## 13. Verificación posterior al despliegue

1. Inicia sesión con una cuenta temporal de cada rol.
2. Confirma aislamiento entre cadenas.
3. Crea, asigna, comenta, adjunta y cierra un folio.
4. Verifica catálogo, comunicados y notificaciones.
5. Exporta un informe Excel.
6. Bloquea una cuenta y confirma la revocación inmediata.
7. Revisa HTTPS y cabeceras de seguridad.
8. Reinicia el servicio y confirma persistencia de base y adjuntos.
9. Comprueba logs sin secretos ni datos innecesarios.
10. Configura alertas de disponibilidad, memoria, disco, HTTP 5xx y vencimiento TLS.

## 14. Actualizaciones, respaldos y reversión

Antes de desplegar:

- crea un respaldo cifrado de MySQL;
- identifica la versión desplegada con commit o etiqueta;
- revisa migraciones pendientes;
- conserva la compilación anterior.

En Business/Cloud usa **Deployments** y publica siempre desde GitHub. No edites manualmente los archivos generados.

En VPS despliega versiones identificables y conserva un procedimiento probado de reversión. Revertir código no revierte automáticamente una migración; las migraciones deben ser compatibles hacia adelante o contar con un plan de recuperación.

## 15. Escalabilidad y trabajo pendiente

Prioridades:

1. mover filtros y paginación al servidor;
2. dividir `app/admin/page.tsx` y `AnalystWorkspace.tsx` por módulo;
3. separar `lib/types.ts` en contratos por dominio;
4. sustituir polling por SSE o WebSocket con mayor concurrencia;
5. mover archivos a almacenamiento privado;
6. agregar pruebas automatizadas de autenticación y permisos;
7. añadir auditoría administrativa persistente;
8. incorporar Redis para límites y coordinación distribuida.

## 16. Definición de terminado

Un cambio se considera terminado cuando:

- funciona para el rol autorizado y falla de forma segura para los demás;
- valida entradas en servidor;
- presenta carga, vacío, éxito y error;
- funciona con teclado y foco visible;
- cumple contraste y modo oscuro;
- pasa ESLint y TypeScript;
- Prisma valida si hubo cambios de datos;
- el build pasa si se modificaron rutas, autenticación o configuración;
- actualiza `PROJECT_INDEX.md` y este documento si cambia la arquitectura.
