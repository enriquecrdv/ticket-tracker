export type UserRole = "admin" | "analista" | "cliente";

export type TicketStatus = "pendiente" | "seguimiento" | "espera_cliente" | "cerrado";

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  activo: boolean;
  createdAt: string;
  chain?: string;
  customerNumber?: string;
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
  commercial?: CommercialCondition;
}

export interface CommercialCondition {
  credit: string; contract: string; guarantee: string; collection: string;
  collectionPortal: string; segment: string; priceList: string; discount: string;
  promoList: string; continent: string; scheme: string; creditDays: string;
  pinc: string; cashAndCredit: string; comments: string;
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

export interface TicketAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  titulo: string;
  cliente: string;
  cadena: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  prioridad: "baja" | "media" | "alta";
  alertaAdmin: boolean;
  estado: TicketStatus;
  creadoPor: string;
  asignadoA?: string;
  createdAt: string;
  updatedAt: string;
  comentarios: TicketComment[];
  historial: TicketHistory[];
  attachments: TicketAttachment[];
}
