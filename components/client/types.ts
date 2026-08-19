export type ClientTicketStatus =
  | "en_proceso"
  | "en_espera_cliente"
  | "resuelto"
  | "cerrado";

export interface ClientTicket {
  id: string;
  databaseId: string;
  customerNumber: string;
  branch: string;
  storeName?: string;
  category: string;
  subcategory: string;
  description: string;
  impact: "low" | "medium" | "high";
  priority: "low" | "medium" | "high";
  status: ClientTicketStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  openingDate?: string;
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    message: string;
    mine: boolean;
    createdAt: string;
  }>;
  timeline: Array<{ id: string; label: string; at: string }>;
}

export const STATUS = {
  en_proceso: { label: "En proceso", className: "bg-blue-50 text-blue-700 ring-blue-600/15" },
  en_espera_cliente: { label: "Requiere tu atención", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  resuelto: { label: "Resuelto", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  cerrado: { label: "Cerrado", className: "bg-slate-100 text-slate-600 ring-slate-500/15" },
} satisfies Record<ClientTicketStatus, { label: string; className: string }>;
