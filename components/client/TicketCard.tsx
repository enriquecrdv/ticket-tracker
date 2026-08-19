import { ArrowRight, CalendarDays, MessageSquare } from "lucide-react";
import { ClientTicket, STATUS } from "./types";

export function TicketCard({ ticket, onOpen }: { ticket: ClientTicket; onOpen: () => void }) {
  const status = STATUS[ticket.status];
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700">{ticket.id}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>
              {status.label}
            </span>
          </div>
          <h3 className="mt-3 truncate text-base font-bold text-slate-900">{ticket.category}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{ticket.description}</p>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Actualizado {new Date(ticket.updatedAt).toLocaleDateString("es-MX")}</span>
        <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />{ticket.comments.length} respuestas</span>
        <span className="ml-auto font-medium text-slate-700">{ticket.branch}</span>
      </div>
    </button>
  );
}
