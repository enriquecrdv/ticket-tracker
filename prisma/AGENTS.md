# Prisma y MySQL

- Fuente de verdad: `schema.prisma`.
- No edites `migrations/*/migration.sql` después de aplicar una migración.
- El seed debe ser idempotente mediante `upsert` y nunca usar contraseñas de
  producción.
- Después de cambiar el esquema: `prisma format`, `prisma validate`, migración y
  generación del cliente.
- No abras `lib/generated/prisma` para tareas normales: es código generado.
- Mantén relaciones, índices y políticas `onDelete` explícitas.
- MySQL local usa XAMPP; la conexión siempre se obtiene desde `DATABASE_URL`.
