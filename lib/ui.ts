import type { TicketStatus } from "@/lib/types";

export const fieldClass = "input w-full bg-white text-slate-950 placeholder:text-slate-500";

export const ticketStatusMeta: Record<TicketStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-900" },
  seguimiento: { label: "En seguimiento", className: "bg-blue-100 text-blue-900" },
  espera_cliente: { label: "Requiere atención", className: "bg-orange-100 text-orange-900" },
  cerrado: { label: "Cerrado", className: "bg-emerald-100 text-emerald-900" },
};

export function daysSince(value: string | Date) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
}
