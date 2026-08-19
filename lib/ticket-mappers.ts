import type { Prisma } from "@/lib/generated/prisma/client";

export const ticketInclude = {
  client: true,
  chain: true,
  branch: true,
  assignedTo: true,
  createdByUser: true,
  comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
  history: { include: { user: true }, orderBy: { createdAt: "desc" } },
  attachments: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.TicketInclude;

export type TicketWithRelations = Prisma.TicketGetPayload<{
  include: typeof ticketInclude;
}>;

function uiStatus(status: TicketWithRelations["status"]) {
  if (status === "PENDIENTE") return "pendiente" as const;
  if (status === "ESPERA_CLIENTE") return "espera_cliente" as const;
  if (status === "RESUELTO" || status === "CERRADO") return "cerrado" as const;
  return "seguimiento" as const;
}

function clientStatus(status: TicketWithRelations["status"]) {
  if (status === "ESPERA_CLIENTE") return "en_espera_cliente" as const;
  if (status === "RESUELTO") return "resuelto" as const;
  if (status === "CERRADO") return "cerrado" as const;
  return "en_proceso" as const;
}

export function toStaffTicket(ticket: TicketWithRelations) {
  return {
    id: ticket.id,
    titulo: ticket.title,
    cliente: ticket.client.name,
    cadena: ticket.chain.name,
    descripcion: ticket.description,
    categoria: ticket.category,
    subcategoria: ticket.subcategory,
    prioridad: ({ BAJO: "baja", MEDIO: "media", ALTO: "alta" } as const)[ticket.priority],
    alertaAdmin: ticket.adminAlert,
    estado: uiStatus(ticket.status),
    creadoPor: ticket.createdByUser?.name ?? ticket.client.name,
    asignadoA: ticket.assignedTo?.name,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    comentarios: ticket.comments.map((comment) => ({
      id: comment.id,
      autor: comment.author.name,
      autorRole: comment.author.role === "ADMIN" ? "admin" : comment.author.role === "CLIENTE" ? "cliente" : "analista",
      mensaje: comment.message,
      createdAt: comment.createdAt.toISOString(),
    })),
    historial: ticket.history.map((entry) => ({
      id: entry.id,
      accion: entry.detail ?? entry.action,
      usuario: entry.user?.name ?? "Sistema",
      createdAt: entry.createdAt.toISOString(),
    })),
    attachments: ticket.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
    })),
  };
}

export function toClientTicket(ticket: TicketWithRelations) {
  const level = ticket.priority.toLowerCase() as "bajo" | "medio" | "alto";
  const englishLevel = { bajo: "low", medio: "medium", alto: "high" } as const;

  return {
    id: ticket.folio,
    databaseId: ticket.id,
    customerNumber: ticket.client.customerNumber,
    branch: ticket.branch?.name ?? ticket.chain.name,
    storeName: ticket.client.name,
    category: ticket.category,
    subcategory: ticket.subcategory,
    description: ticket.description,
    impact: englishLevel[ticket.impact.toLowerCase() as keyof typeof englishLevel],
    priority: englishLevel[level],
    status: clientStatus(ticket.status),
    assignedTo: ticket.assignedTo?.name,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    openingDate: ticket.openingDate.toISOString(),
    attachments: ticket.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
    })),
    comments: ticket.comments.map((comment) => ({
      id: comment.id,
      author: comment.author.name,
      message: comment.message,
      mine: comment.author.role === "CLIENTE",
      createdAt: comment.createdAt.toISOString(),
    })),
    timeline: ticket.history.map((entry) => ({
      id: entry.id,
      label: entry.detail ?? entry.action,
      at: entry.createdAt.toISOString(),
    })),
  };
}
