"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, ShieldCheck, UserRound, X } from "lucide-react";

type Profile = { name: string; email: string; role: string; chain: string | null };

export function UserMenu({ dark = false }: { dark?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => { fetch("/api/profile").then((response) => response.ok ? response.json() : null).then(setProfile); }, []);
  async function updatePassword() {
    setMessage(null);
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const result = await response.json();
    setMessage({ type: response.ok ? "success" : "error", text: result.message ?? result.error });
    if (response.ok) { setCurrentPassword(""); setNewPassword(""); }
  }

  const initials = profile?.name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase() ?? "US";
  return <div className="relative">
    <button onClick={() => setOpen(!open)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-xs font-black text-white">{initials}</span><span className="hidden sm:block"><span className={`block max-w-40 truncate text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>{profile?.name ?? "Cargando..."}</span><span className={`block text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>{profile?.role ?? ""}</span></span><ChevronDown className="h-4 w-4 opacity-60" /></button>
    {open && <div className="absolute right-0 top-13 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 p-4"><p className="font-bold text-slate-900">{profile?.name}</p><p className="mt-1 text-sm text-slate-500">{profile?.email}</p>{profile?.chain && <p className="mt-2 text-xs font-semibold text-blue-700">{profile.chain}</p>}</div><div className="p-2"><button onClick={() => { setModal(true); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserRound className="h-4 w-4" />Mi perfil y contraseña</button><button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Cerrar sesión</button></div></div>}
    {modal && <div className="fixed inset-0 z-60 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><ShieldCheck className="h-7 w-7 text-blue-600" /><h2 id="profile-title" className="mt-3 text-xl font-bold text-slate-950">Mi cuenta</h2><p className="mt-1 text-sm text-slate-500">{profile?.email}</p></div><button onClick={() => setModal(false)} aria-label="Cerrar panel de usuario" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-700">Contraseña actual<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input mt-2" /></label><label className="block text-sm font-semibold text-slate-700">Nueva contraseña<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input mt-2" placeholder="Mínimo 8 caracteres" /></label>{message && <p role="alert" className={`rounded-xl p-3 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>}<button onClick={updatePassword} disabled={!currentPassword || newPassword.length < 8} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-40">Actualizar contraseña</button><div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><button onClick={() => setModal(false)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Salir del panel</button><button onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"><LogOut className="h-4 w-4" />Cerrar sesión</button></div></div></div></div>}
  </div>;
}
