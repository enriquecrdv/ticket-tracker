"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";

type NotificationItem = { id: string; message: string; read: boolean; sender: string; createdAt: string };
export function NotificationsMenu({ dark: _dark = false }: { dark?: boolean }) {
  void _dark;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => fetch("/api/notifications").then((response) => response.ok ? response.json() : []).then((data) => { if (Array.isArray(data)) setItems(data); });
  useEffect(() => { load(); const timer = window.setInterval(load, 60_000); return () => window.clearInterval(timer); }, []);
  const unread = items.filter((item) => !item.read).length;
  async function markRead(item: NotificationItem) { if (!item.read) { await fetch(`/api/notifications/${item.id}`, { method: "PATCH" }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); } }
  return <div className="relative"><button onClick={() => setOpen(!open)} aria-label={`${unread} notificaciones sin leer`} className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-14 z-50 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="font-black text-slate-950">Notificaciones</h2><p className="text-xs text-slate-500">{unread} sin leer</p></div><button onClick={() => setOpen(false)} aria-label="Cerrar notificaciones"><X className="h-4 w-4" /></button></div><div className="max-h-96 overflow-y-auto p-2">{items.map((item) => <button key={item.id} onClick={() => markRead(item)} className={`mb-1 block w-full rounded-xl p-3 text-left ${item.read ? "bg-white" : "bg-blue-50"}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-blue-600"}`} /><span><span className="block text-xs font-bold text-blue-700">{item.sender}</span><span className="mt-1 block text-sm leading-5 text-slate-700">{item.message}</span><span className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">{item.read && <CheckCheck className="h-3 w-3" />}{new Date(item.createdAt).toLocaleString("es-MX")}</span></span></div></button>)}{!items.length && <p className="p-8 text-center text-sm text-slate-500">No tienes notificaciones.</p>}</div></div>}</div>;
}
