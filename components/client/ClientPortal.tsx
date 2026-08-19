"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { Bell, CheckCircle2, Clock3, Headphones, Menu, Plus, Search, TicketCheck, X } from "lucide-react";
import { UserMenu } from "@/components/shared/UserMenu";
import { ClientTicket } from "./types";
import { TicketCard } from "./TicketCard";
import { TicketDetail } from "./TicketDetail";
import { CreateTicketWizard } from "./CreateTicketWizard";

type View = "dashboard" | "tickets" | "create" | "detail";

export default function ClientPortal() {
  const [view, setView] = useState<View>("dashboard");
  const [tickets, setTickets] = useState<ClientTicket[]>([]);
  const [selected, setSelected] = useState<ClientTicket | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [customer, setCustomer] = useState({ name: "Cliente", number: "" });
  const [chainName, setChainName] = useState("");
  const [commercial, setCommercial] = useState<Record<string, string | null> | null>(null);

  useEffect(() => {
    Promise.all([getSession(), fetch("/api/tickets").then((response) => response.json()), fetch("/api/client-context").then((response) => response.json())]).then(([session, data, context]) => {
      setCustomer({ name: session?.user.name ?? "Cliente", number: session?.user.customerNumber ?? "" });
      if (Array.isArray(data)) setTickets(data);
      if (context.chain) setChainName(context.chain.name);
      if (context.commercial) setCommercial(context.commercial);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const matchesText = `${ticket.id} ${ticket.category} ${ticket.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || (status === "finished" ? ticket.status === "resuelto" || ticket.status === "cerrado" : ticket.status === status);
    return matchesText && matchesStatus;
  }), [tickets, search, status]);

  const stats = {
    active: tickets.filter((ticket) => ticket.status === "en_proceso").length,
    attention: tickets.filter((ticket) => ticket.status === "en_espera_cliente").length,
    solved: tickets.filter((ticket) => ticket.status === "resuelto" || ticket.status === "cerrado").length,
  };

  function openTicket(ticket: ClientTicket) { setSelected(ticket); setView("detail"); }
  function updateTicket(updated: ClientTicket) { setSelected(updated); setTickets((current) => current.map((ticket) => ticket.id === updated.id ? updated : ticket)); }
  function created(ticket: ClientTicket) { setTickets((current) => [ticket, ...current]); setSelected(ticket); setView("detail"); }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => setView("dashboard")} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/20">SP</span><span className="hidden text-left sm:block"><span className="block text-sm font-bold">Portal de soporte</span><span className="block text-xs text-slate-400">{customer.name}</span></span></button>
          <nav className="hidden items-center gap-1 md:flex"><Nav active={view === "dashboard"} onClick={() => setView("dashboard")}>Inicio</Nav><Nav active={view === "tickets" || view === "detail"} onClick={() => setView("tickets")}>Mis tickets</Nav><Nav active={view === "create"} onClick={() => setView("create")}>Crear ticket</Nav></nav>
          <div className="flex items-center gap-2"><button onClick={() => { setStatus(stats.attention ? "en_espera_cliente" : "cerrado"); setView("tickets"); }} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Ver notificaciones"><Bell className="h-5 w-5" />{stats.attention > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />}</button><div className="hidden sm:block"><UserMenu /></div><button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-xl p-2.5 text-slate-600 md:hidden" aria-label="Menú">{mobileMenu ? <X /> : <Menu />}</button></div>
        </div>
        {mobileMenu && <nav className="border-t border-slate-100 bg-white p-3 md:hidden"><MobileNav onClick={() => { setView("dashboard"); setMobileMenu(false); }}>Inicio</MobileNav><MobileNav onClick={() => { setView("tickets"); setMobileMenu(false); }}>Mis tickets</MobileNav><MobileNav onClick={() => { setView("create"); setMobileMenu(false); }}>Crear ticket</MobileNav><MobileNav onClick={() => signOut({ callbackUrl: "/" })}>Cerrar sesión</MobileNav></nav>}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {view === "dashboard" && <>
          <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10"><div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" /><div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-blue-300">Cliente {customer.number}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Hola, {customer.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Consulta tus solicitudes, responde al equipo de soporte o registra un nuevo problema en pocos pasos.</p></div><button onClick={() => setView("create")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500"><Plus className="h-5 w-5" />Crear ticket</button></div></section>
          <section className="mt-6 grid gap-4 sm:grid-cols-3"><Stat onClick={() => { setStatus("en_proceso"); setView("tickets"); }} icon={<Clock3 />} label="En proceso" value={stats.active} tone="blue" /><Stat onClick={() => { setStatus("en_espera_cliente"); setView("tickets"); }} icon={<Headphones />} label="Requieren atención" value={stats.attention} tone="amber" /><Stat onClick={() => { setStatus("finished"); setView("tickets"); }} icon={<CheckCircle2 />} label="Finalizados" value={stats.solved} tone="green" /></section>
          {commercial && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">Condiciones comerciales</p><h2 className="mt-1 text-lg font-bold text-slate-900">{chainName}</h2></div></div><div className="mt-5 grid gap-4 sm:grid-cols-5">{[["Crédito", commercial.credit], ["Contrato", commercial.contract], ["Días crédito", commercial.creditDays], ["Descuento", commercial.discount], ["PINC", commercial.pinc]].map(([label, value]) => <div key={label ?? ""} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value || "Sin dato"}</p></div>)}</div></section>}
          <section className="mt-9"><div className="flex items-end justify-between"><div><p className="text-sm font-semibold text-blue-600">Actividad reciente</p><h2 className="mt-1 text-2xl font-bold">Tus últimos tickets</h2></div><button onClick={() => setView("tickets")} className="text-sm font-bold text-blue-700 hover:text-blue-900">Ver todos</button></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{tickets.slice(0, 4).map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onOpen={() => openTicket(ticket)} />)}</div>{!loading && tickets.length === 0 && <Empty onCreate={() => setView("create")} />}</section>
        </>}

        {view === "tickets" && <section><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-600">Seguimiento</p><h1 className="mt-1 text-3xl font-bold">Mis tickets</h1><p className="mt-2 text-sm text-slate-500">Encuentra y administra todas tus solicitudes.</p></div><button onClick={() => setView("create")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Nuevo ticket</button></div><div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por folio, categoría o descripción" className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"><option value="all">Todos los estados</option><option value="en_proceso">En proceso</option><option value="en_espera_cliente">Requieren atención</option><option value="resuelto">Resueltos</option><option value="cerrado">Cerrados</option></select></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{filtered.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onOpen={() => openTicket(ticket)} />)}</div>{!loading && filtered.length === 0 && <Empty onCreate={() => setView("create")} />}</section>}
        {view === "create" && <CreateTicketWizard chainName={chainName} customerNumber={customer.number} onCancel={() => setView("dashboard")} onCreated={created} />}
        {view === "detail" && selected && <TicketDetail ticket={selected} onBack={() => setView("tickets")} onUpdated={updateTicket} />}
      </main>
    </div>
  );
}

function Nav({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>{children}</button>; }
function MobileNav({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">{children}</button>; }
function Stat({ icon, label, value, tone, onClick }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "amber" | "green"; onClick: () => void }) { const color = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700" }[tone]; return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-blue-600">Ver folios</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${color}`}>{icon}</span></div></button>; }
function Empty({ onCreate }: { onCreate: () => void }) { return <div className="mt-5 rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center"><TicketCheck className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-4 font-bold text-slate-900">No encontramos tickets</h3><p className="mt-1 text-sm text-slate-500">Crea una nueva solicitud y podrás darle seguimiento aquí.</p><button onClick={onCreate} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Crear ticket</button></div>; }
