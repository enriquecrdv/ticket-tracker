"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, FileUp, Paperclip, Send, UserRound } from "lucide-react";
import { ClientTicket, STATUS } from "./types";

export function TicketDetail({ ticket, onBack, onUpdated }: { ticket: ClientTicket; onBack: () => void; onUpdated: (ticket: ClientTicket) => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const status = STATUS[ticket.status];

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const response = await fetch(`/api/tickets/${ticket.databaseId}/comments`, { cache: "no-store" });
      const data = await response.json().catch(() => null) as ClientTicket | null;
      if (active && response.ok && data?.databaseId) onUpdated(data);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(refresh, 8000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [ticket.databaseId, onUpdated]);

  async function sendReply() {
    if (!message.trim()) return;
    setSending(true);
    setReplyError("");
    try {
      const response = await fetch(`/api/tickets/${ticket.databaseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => null) as ClientTicket | { error?: string } | null;
      if (response.ok && data && "databaseId" in data) {
        onUpdated(data);
        setMessage("");
      } else {
        setReplyError(data && "error" in data ? data.error ?? "No se pudo guardar el comentario." : "El servidor no confirmó el comentario.");
      }
    } catch {
      setReplyError("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
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
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-900">Archivos adjuntos</h2><p className="mt-1 text-xs text-slate-500">Documentos, correos o fotos. Máximo acumulado: 200 MB.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 hover:bg-blue-50"><FileUp className="h-4 w-4" />{uploading ? "Subiendo..." : "Agregar archivos"}<input type="file" multiple accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.eml,.msg,.jpg,.jpeg,.png,.webp,.tif,.tiff" disabled={uploading} onChange={(event) => uploadFiles(event.target.files)} className="sr-only" /></label></div>
              {uploadMessage && <p role="status" className="mt-3 text-sm font-medium text-slate-700">{uploadMessage}</p>}
              <div className="mt-4 space-y-2">{ticket.attachments?.map((attachment) => <div key={attachment.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"><Paperclip className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span><span className="text-xs text-slate-400">{(attachment.sizeBytes / 1024).toFixed(0)} KB</span></div>)}{!ticket.attachments?.length && <p className="text-sm text-slate-500">Todavía no hay archivos adjuntos.</p>}</div>
            </div>

            <div className="mt-9 flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Seguimiento</p><h2 className="mt-1 text-lg font-bold text-slate-900">Conversación</h2></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{ticket.comments.length} {ticket.comments.length === 1 ? "mensaje" : "mensajes"}</span>
            </div>
            <div className="mt-5 space-y-5 rounded-2xl bg-slate-50/70 p-4 sm:p-5">
              {ticket.comments.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aún no hay respuestas. Te avisaremos cuando un analista responda.</p>}
              {[...ticket.comments].reverse().map((comment) => (
                <div key={comment.id} className={`flex flex-col ${comment.mine ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${comment.mine ? "rounded-br-md bg-blue-700 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                    <p className={`text-xs font-bold ${comment.mine ? "text-blue-100" : "text-blue-700"}`}>{comment.author}</p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6">{comment.message}</p>
                  </div>
                  <time dateTime={comment.createdAt} className={`mt-1.5 px-1 text-[11px] font-medium text-slate-500 ${comment.mine ? "text-right" : "text-left"}`}>{new Date(comment.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</time>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="Escribe una respuesta..." className="min-h-12 flex-1 resize-none border-0 px-3 py-2 text-sm outline-none" />
              <button onClick={sendReply} disabled={sending || !message.trim()} className="self-end rounded-xl bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-40" aria-label="Enviar respuesta"><Send className="h-5 w-5" /></button>
            </div>
            {replyError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{replyError}</p>}
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
