export type UserRole = "admin" | "analista";

export type TicketStatus = "pendiente" | "seguimiento" | "espera_cliente" | "cerrado";

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  activo: boolean;
  createdAt: string;
}

export interface Chain {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  createdAt: string;
  clientCount?: number;
  ticketCount?: number;
  clients?: Array<{ customerNumber: string; name: string }>;
}

export interface TicketComment {
  id: string;
  autor: string;
  autorRole: UserRole;
  mensaje: string;
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  accion: string;
  usuario: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  titulo: string;
  cliente: string;
  cadena: string;
  descripcion: string;
  estado: TicketStatus;
  creadoPor: string;
  asignadoA?: string;
  createdAt: string;
  updatedAt: string;
  comentarios: TicketComment[];
  historial: TicketHistory[];
}
