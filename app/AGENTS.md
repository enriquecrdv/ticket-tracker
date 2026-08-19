# Área App Router

- Revisa solo la ruta solicitada y sus dependencias directas.
- Los `page.tsx` grandes son UI temporal; no los leas completos para cambios de
  backend.
- Toda API debe validar entrada, sesión y rol en el servidor.
- Respuestas de API: códigos HTTP claros y mensajes seguros, sin detalles
  internos de MySQL.
- Para autenticación consulta `lib/auth.ts`, `lib/prisma.ts` y `proxy.ts`.
- Tras cambiar rutas o handlers ejecuta TypeScript, ESLint y build.
