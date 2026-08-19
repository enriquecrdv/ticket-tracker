"use client";

import { useEffect, useState, useMemo } from "react";
import { Chain, Ticket, TicketStatus, User } from "@/lib/types";
import { UserMenu } from "@/components/shared/UserMenu";
import { CatalogEditor } from "@/components/admin/CatalogEditor";
import {
  Users,
  Link2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [newUser, setNewUser] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "analista",
  });

  const [newChain, setNewChain] = useState({
    nombre: "",
    descripcion: "",
  });

  // Filtros y búsqueda
  const [userSearch, setUserSearch] = useState("");
  const [chainSearch, setChainSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "admin" | "analista"
  >("all");
  const [chainStatusFilter, setChainStatusFilter] = useState<
    "all" | "activa" | "inactiva"
  >("all");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    TicketStatus | "all"
  >("all");
  const [ticketChainFilter, setTicketChainFilter] = useState("all");
  const [ticketDateFrom, setTicketDateFrom] = useState("");
  const [ticketDateTo, setTicketDateTo] = useState("");

  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((response) => response.json()),
      fetch("/api/chains").then((response) => response.json()),
      fetch("/api/tickets").then((response) => response.json()),
    ]).then(([userData, chainData, ticketData]) => {
      if (Array.isArray(userData)) setUsers(userData);
      if (Array.isArray(chainData)) setChains(chainData);
      if (Array.isArray(ticketData)) setTickets(ticketData);
    });
  }, []);

  // Funciones de filtrado
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.nombre.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
        userRoleFilter === "all" || user.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const filteredChains = useMemo(() => {
    return chains.filter((chain) => {
      const matchesSearch = chain.nombre
        .toLowerCase()
        .includes(chainSearch.toLowerCase());
      const matchesStatus =
        chainStatusFilter === "all" ||
        (chainStatusFilter === "activa" ? chain.activa : !chain.activa);
      return matchesSearch && matchesStatus;
    });
  }, [chains, chainSearch, chainStatusFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        ticketStatusFilter === "all" || ticket.estado === ticketStatusFilter;
      const matchesChain = ticketChainFilter === "all" || ticket.cadena === ticketChainFilter;
      const created = new Date(ticket.createdAt);
      const matchesFrom = !ticketDateFrom || created >= new Date(`${ticketDateFrom}T00:00:00`);
      const matchesTo = !ticketDateTo || created <= new Date(`${ticketDateTo}T23:59:59`);
      return matchesStatus && matchesChain && matchesFrom && matchesTo;
    });
  }, [tickets, ticketStatusFilter, ticketChainFilter, ticketDateFrom, ticketDateTo]);

  const ticketChains = useMemo(() => [...new Set(tickets.map((ticket) => ticket.cadena))].sort(), [tickets]);

  // Alertas de tickets
  const overdueTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const createdDate = new Date(ticket.createdAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysDiff > 5 && ticket.estado !== "cerrado";
    });
  }, [tickets]);

  const createUser = async () => {
    if (!newUser.nombre || !newUser.email || newUser.password.length < 8) {
      showAlert("error", "Completa todos los campos");
      return;
    }
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
    const user = await response.json();
    if (!response.ok) return showAlert("error", user.error ?? "No se pudo crear el usuario");
    setUsers((prev) => [user, ...prev]);
    setNewUser({ nombre: "", email: "", password: "", role: "analista" });
    showAlert("success", "Usuario creado exitosamente");
  };

  const deleteUser = async (id: string) => {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) return showAlert("error", (await response.json()).error ?? "No se pudo eliminar");
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showAlert("success", "Usuario eliminado");
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    const response = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !user.activo }) });
    if (!response.ok) return showAlert("error", (await response.json()).error ?? "No se pudo actualizar");
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)),
    );
  };

  const createChain = async () => {
    if (!newChain.nombre) {
      showAlert("error", "Ingresa el nombre de la cadena");
      return;
    }

    const response = await fetch("/api/chains", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newChain) });
    const chain = await response.json();
    if (!response.ok) return showAlert("error", chain.error ?? "No se pudo crear la cadena");
    setChains((prev) => [chain, ...prev]);
    setNewChain({ nombre: "", descripcion: "" });
    showAlert("success", "Cadena creada exitosamente");
  };

  const toggleChainStatus = async (id: string) => {
    const chain = chains.find((item) => item.id === id);
    if (!chain) return;
    const response = await fetch(`/api/chains/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !chain.activa }) });
    if (!response.ok) return showAlert("error", "No se pudo actualizar la cadena");
    setChains((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activa: !c.activa } : c)),
    );
  };

  const showAlert = (type: string, message: string) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Notificación */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
            notification.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div><p className="text-sm font-semibold text-blue-300">Centro de control</p><h1 className="mt-1 text-3xl font-bold sm:text-4xl">Administración</h1><p className="mt-2 text-slate-300">Usuarios, cadenas y operación en una sola vista.</p></div>
          <UserMenu dark />
        </div>

        {/* Alertas críticas */}
        {overdueTickets.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">
                ⚠️ {overdueTickets.length} ticket(s) sin atender por más de 5
                días
              </p>
              <p className="text-sm text-red-700 mt-1">
                Se requiere atención inmediata
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-semibold">Usuarios</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {users.length}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-semibold">Cadenas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {chains.length}
                </p>
              </div>
              <Link2 className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-semibold">Tickets</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {tickets.length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-semibold">
                  Retrasados
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {overdueTickets.length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Formularios de creación */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Crear usuario
              </h2>
            </div>

            <div className="space-y-3">
              <input
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                placeholder="Nombre completo"
                value={newUser.nombre}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
              <input
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                placeholder="Correo electrónico"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <input
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                placeholder="Contraseña temporal (mínimo 8 caracteres)"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <select
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <option value="analista">Analista</option>
                <option value="admin">Administrador</option>
              </select>

              <button
                onClick={createUser}
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition"
              >
                + Crear usuario
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Crear cadena
              </h2>
            </div>

            <div className="space-y-3">
              <input
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none transition"
                placeholder="Nombre de la cadena"
                value={newChain.nombre}
                onChange={(e) =>
                  setNewChain((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none transition resize-none"
                placeholder="Descripción"
                rows={3}
                value={newChain.descripcion}
                onChange={(e) =>
                  setNewChain((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
              />
              <button
                onClick={createChain}
                className="w-full bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-3 rounded-lg font-semibold transition"
              >
                + Crear cadena
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <CatalogEditor />

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Buscar usuario..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                value={userRoleFilter}
                onChange={(e) =>
                  setUserRoleFilter(
                    e.target.value as "all" | "admin" | "analista",
                  )
                }
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="analista">Analista</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Nombre
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Correo
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Rol
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition"
                  >
                    <td className="py-4 px-4 font-medium text-slate-900">
                      {user.nombre}
                    </td>
                    <td className="py-4 px-4 text-slate-600">{user.email}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin" ? "Administrador" : "Analista"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.activo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600 hover:text-slate-900"
                          title={user.activo ? "Desactivar" : "Activar"}
                        >
                          {user.activo ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Cadenas */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Cadenas</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                  placeholder="Buscar cadena..."
                  value={chainSearch}
                  onChange={(e) => setChainSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                value={chainStatusFilter}
                onChange={(e) =>
                  setChainStatusFilter(
                    e.target.value as "all" | "activa" | "inactiva",
                  )
                }
              >
                <option value="all">Todas</option>
                <option value="activa">Activas</option>
                <option value="inactiva">Inactivas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Nombre
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Descripción
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Clientes</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">Folios</th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-slate-700">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredChains.map((chain) => (
                  <tr
                    key={chain.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition"
                  >
                    <td className="py-4 px-4 font-medium text-slate-900">
                      {chain.nombre}
                    </td>
                    <td className="py-4 px-4 text-slate-600 max-w-md truncate">
                      {chain.descripcion}
                    </td>
                    <td className="py-4 px-4 text-slate-700"><span className="font-bold">{chain.clientCount ?? 0}</span>{chain.clients?.length ? <p className="mt-1 max-w-52 truncate text-xs text-slate-400" title={chain.clients.map((client) => `${client.customerNumber} · ${client.name}`).join("\n")}>{chain.clients.map((client) => client.name).join(", ")}</p> : null}</td>
                    <td className="py-4 px-4 font-bold text-purple-700">{chain.ticketCount ?? 0}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          chain.activa
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {chain.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleChainStatus(chain.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          chain.activa
                            ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {chain.activa ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seguimiento de Tickets */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Seguimiento de Tickets
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none transition"
              value={ticketStatusFilter}
              onChange={(e) =>
                setTicketStatusFilter(
                  e.target.value as
                    | "all"
                    | TicketStatus,
                )
              }
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="espera_cliente">Espera del cliente</option>
              <option value="cerrado">Cerrado</option>
            </select>
            <select value={ticketChainFilter} onChange={(e) => setTicketChainFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none">
              <option value="all">Todas las cadenas</option>
              {ticketChains.map((chain) => <option key={chain} value={chain}>{chain}</option>)}
            </select>
            <label className="text-xs font-semibold text-slate-600">Desde<input type="date" value={ticketDateFrom} onChange={(e) => setTicketDateFrom(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Hasta<input type="date" value={ticketDateTo} onChange={(e) => setTicketDateTo(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const createdDate = new Date(ticket.createdAt);
              const now = new Date();
              const daysDiff = Math.floor(
                (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
              );
              const isOverdue = daysDiff > 5 && ticket.estado !== "cerrado";

              return (
                <div
                  key={ticket.id}
                  className={`border rounded-xl p-4 transition ${
                    isOverdue
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {ticket.titulo}
                        </p>
                        {isOverdue && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        ID: {ticket.id} · Asignado a:{" "}
                        <span className="font-medium">
                          {ticket.asignadoA || "Sin asignar"}
                        </span>
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Días desde creación: {daysDiff}
                      </p>
                    </div>

                    <div className="flex gap-2 items-center">
                      {ticket.estado === "cerrado" ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Completado
                        </span>
                      ) : isOverdue ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Retrasado
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {ticket.estado}
                        </span>
                      )}
                    </div>
                  </div>

                  {ticket.historial && ticket.historial.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="font-medium text-slate-900 mb-2 text-sm">
                        Historial
                      </p>
                      <div className="space-y-2">
                        {ticket.historial.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="text-xs text-slate-600 flex items-center gap-2"
                          >
                            <span className="font-medium">{item.usuario}:</span>
                            <span>{item.accion}</span>
                            <span className="text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
