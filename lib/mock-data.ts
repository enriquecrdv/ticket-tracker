import { Chain, Ticket, User } from "./types";

export const mockUsers: User[] = [
  {
    id: "u1",
    nombre: "Admin General",
    email: "admin@empresa.com",
    role: "admin",
    activo: true,
    createdAt: "2026-03-09",
  },
  {
    id: "u2",
    nombre: "Ana Analista",
    email: "analista@empresa.com",
    role: "analista",
    activo: true,
    createdAt: "2026-03-09",
  },
];

export const mockChains: Chain[] = [
  {
    id: "c1",
    nombre: "OXXO",
    descripcion: "Cadena principal",
    activa: true,
    createdAt: "2026-03-09",
  },
  {
    id: "c2",
    nombre: "Waldo's",
    descripcion: "Cadena secundaria",
    activa: true,
    createdAt: "2026-03-09",
  },
];

export const mockTickets: Ticket[] = [
  {
    id: "t1",
    titulo: "No aparece pedido en sistema",
    cliente: "Cliente 1001",
    cadena: "OXXO",
    descripcion: "El cliente reporta que no ve su pedido reflejado.",
    estado: "pendiente",
    creadoPor: "Cliente 1001",
    asignadoA: "Ana Analista",
    createdAt: "2026-03-09 10:00",
    updatedAt: "2026-03-09 10:00",
    comentarios: [],
    historial: [
      {
        id: "h1",
        accion: "Ticket creado",
        usuario: "Cliente 1001",
        createdAt: "2026-03-09 10:00",
      },
    ],
  },
];
