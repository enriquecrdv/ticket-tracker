# Instrucciones de trabajo

Lee primero `PROJECT_INDEX.md`. No recorras todo el repositorio si el índice
identifica los archivos relacionados con la tarea.

## Uso eficiente del contexto

- Busca símbolos, imports, rutas o mensajes concretos antes de abrir archivos.
- En archivos grandes, lee solo el bloque relevante y sus imports/tipos.
- No leas `.next`, `node_modules`, `lib/generated` ni migraciones históricas,
  salvo que la tarea lo requiera expresamente.
- No vuelvas a analizar áreas ya descritas en `PROJECT_INDEX.md` si no cambiaron.
- Conserva cambios locales del usuario y limita cada parche al objetivo actual.
- Da actualizaciones y respuestas finales breves, salvo que se pida detalle.

## Validación proporcional

- Cambio aislado: ESLint sobre los archivos modificados y `tsc --noEmit`.
- Cambio de Prisma: `prisma format`, `prisma validate` y una migración cuando
  cambie el esquema.
- Cambio de autenticación, rutas o configuración: además ejecutar `next build`.
- Ejecutar pruebas específicas antes que suites completas cuando existan.

## Convenciones

- TypeScript estricto; evitar `any` y duplicación de tipos de dominio.
- Validar entradas externas con Zod y permisos en el servidor.
- Nunca registrar contraseñas, tokens, secretos o cadenas de conexión.
- No incluir `.env` ni credenciales reales en Git.
- Mantener `PROJECT_INDEX.md` sincronizado con cambios arquitectónicos.

Consulta también el `AGENTS.md` del subdirectorio que estés modificando.
