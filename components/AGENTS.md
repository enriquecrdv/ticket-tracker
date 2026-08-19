# Componentes

- `Cliente/cliente.tsx` es grande: localiza primero el handler, tipo o sección
  visual afectada y lee únicamente su contexto cercano.
- Mantén en componentes solo estado y presentación; mueve acceso a datos a APIs
  y reglas compartidas a `lib`.
- No dupliques enums de Prisma en nuevos componentes; usa contratos compartidos
  o una capa explícita de presentación.
- Conserva accesibilidad: labels, estados de carga, errores con `role="alert"` y
  botones deshabilitados durante envíos.
- Valida con ESLint del componente y TypeScript global.
