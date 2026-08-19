"use client";

import { useState } from "react";
import { ArrowLeft, Building2, CalendarDays, FileUp, Paperclip, Send, UserRound } from "lucide-react";
import { ClientTicket, STATUS } from "./types";

export function TicketDetail({ ticket, onBack, onUpdated }: { ticket: ClientTicket; onBack: () => void; onUpdated: (ticket: ClientTicket) => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const status = STATUS[ticket.status];

  async function sendReply() {
    if (!message.trim()) return;
    setSending(true);
    const response = await fetch(`/api/tickets/${ticket.databaseId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (response.ok) {
      onUpdated(await response.json());
      setMessage("");
    }
    setSending(false);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    [...files].forEach((file) => formData.append("files", file));
    setUploading(true);
    setUploadMessage("");
    const response = await fetch(`/api/tickets/${ticket.databaseId}/attachments`, { method: "POST", body: formData });
    const data = await response.json().catch(() => null) as ClientTicket | { error?: string } | null;
    if (response.ok && data && "databaseId" in data) {
      onUpdated(data);
      setUploadMessage("Archivos agregados correctamente.");
    } else {
      setUploadMessage(data && "error" in data ? data.error ?? "No fue posible subir los archivos." : "No fue posible subir los archivos.");
    }
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> Volver a mis tickets
      </button>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-mono text-sm font-bold text-blue-700">{ticket.id}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{ticket.category}</h1>
              <p className="mt-1 text-sm text-slate-500">{ticket.subcategory}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${status.className}`}>{status.label}</span>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" />{ticket.branch}</span>
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" />{new Date(ticket.createdAt).toLocaleDateString("es-MX")}</span>
            <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-slate-400" />{ticket.assignedTo ?? "Por asignar"}</span>
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px]">
          <div className="p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Descripción</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{ticket.description}</p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-900">Archivos adjuntos</h2><p className="mt-1 text-xs text-slate-500">PDF, JPG o PNG. Máximo 5 MB por archivo.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50"><FileUp className="h-4 w-4" />{uploading ? "Subiendo..." : "Agregar archivos"}<input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} onChange={(event) => uploadFiles(event.target.files)} className="sr-only" /></label></div>
              {uploadMessage && <p role="status" className="mt-3 text-sm font-medium text-slate-700">{uploadMessage}</p>}
              <div className="mt-4 space-y-2">{ticket.attachments?.map((attachment) => <div key={attachment.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"><Paperclip className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span><span className="text-xs text-slate-400">{(attachment.sizeBytes / 1024).toFixed(0)} KB</span></div>)}{!ticket.attachments?.length && <p className="text-sm text-slate-500">Todavía no hay archivos adjuntos.</p>}</div>
            </div>

            <h2 className="mt-9 text-lg font-bold text-slate-900">Conversación</h2>
            <div className="mt-4 space-y-4">
              {ticket.comments.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aún no hay respuestas. Te avisaremos cuando un analista responda.</p>}
              {ticket.comments.map((comment) => (
                <div key={comment.id} className={`flex ${comment.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${comment.mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <p className="text-xs font-semibold opacity-75">{comment.author}</p>
                    <p className="mt-1 text-sm leading-6">{comment.message}</p>
                    <p className="mt-2 text-[11px] opacity-60">{new Date(comment.createdAt).toLocaleString("es-MX")}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-blue-500">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="Escribe una respuesta..." className="min-h-12 flex-1 resize-none border-0 px-3 py-2 text-sm outline-none" />
              <button onClick={sendReply} disabled={sending || !message.trim()} className="self-end rounded-xl bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-40" aria-label="Enviar respuesta"><Send className="h-5 w-5" /></button>
            </div>
          </div>
          <aside className="border-t border-slate-100 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
            <h2 className="font-bold text-slate-900">Actividad</h2>
            <div className="mt-5 space-y-5">
              {ticket.timeline.map((item) => (
                <div key={item.id} className="relative pl-6 text-sm before:absolute before:left-1 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-blue-500">
                  <p className="font-medium text-slate-700">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.at).toLocaleString("es-MX")}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
