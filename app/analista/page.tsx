"use client";

import { useState, useMemo } from "react";
import { mockTickets } from "@/lib/mock-data";
import { Ticket, TicketStatus } from "@/lib/types";
import { Search, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function AnalistaPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    mockTickets[0]?.id || "",
  );
  const [respuesta, setRespuesta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "todos">(
    "todos",
  );
  const [sortBy, setSortBy] = useState<"fecha" | "prioridad">("fecha");

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const matchesSearch =
          ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "todos" || ticket.estado === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "fecha") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      });
  }, [tickets, searchTerm, statusFilter, sortBy]);

  const changeStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              estado: status,
              updatedAt: new Date().toISOString(),
              historial: [
                {
                  id: crypto.randomUUID(),
                  accion: `Cambio de estado a ${status}`,
                  usuario: "Ana Analista",
                  createdAt: new Date().toLocaleString(),
                },
                ...ticket.historial,
              ],
            }
          : ticket,
      ),
    );
  };

  const responderTicket = () => {
    if (!selectedTicket || !respuesta.trim()) return;

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              updatedAt: new Date().toISOString(),
              comentarios: [
                {
                  id: crypto.randomUUID(),
                  autor: "Ana Analista",
                  autorRole: "analista",
                  mensaje: respuesta,
                  createdAt: new Date().toLocaleString(),
                },
                ...ticket.comentarios,
              ],
              historial: [
                {
                  id: crypto.randomUUID(),
                  accion: "Analista respondió al ticket",
                  usuario: "Ana Analista",
                  createdAt: new Date().toLocaleString(),
                },
                ...ticket.historial,
              ],
            }
          : ticket,
      ),
    );

    setRespuesta("");
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "pendiente":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "seguimiento":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "cerrado":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "pendiente":
        return "bg-amber-100 text-amber-800";
      case "seguimiento":
        return "bg-blue-100 text-blue-800";
      case "cerrado":
        return "bg-emerald-100 text-emerald-800";
    }
  };

  const stats = {
    total: tickets.length,
    pendiente: tickets.filter((t) => t.estado === "pendiente").length,
    seguimiento: tickets.filter((t) => t.estado === "seguimiento").length,
    cerrado: tickets.filter((t) => t.estado === "cerrado").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Panel del Analista
          </h1>
          <p className="text-slate-600 mt-1">
            Gestiona y da seguimiento a todos los tickets
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "bg-slate-100" },
            {
              label: "Pendiente",
              value: stats.pendiente,
              color: "bg-amber-100",
            },
            {
              label: "Seguimiento",
              value: stats.seguimiento,
              color: "bg-blue-100",
            },
            { label: "Cerrado", value: stats.cerrado, color: "bg-emerald-100" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Tickets List */}
          <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Tickets
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, título o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as TicketStatus | "todos")
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "fecha" | "prioridad")
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fecha">Más reciente</option>
                    <option value="prioridad">Prioridad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="divide-y divide-slate-200 max-h-150 overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <p>No se encontraron tickets</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-4 transition hover:bg-slate-50 ${
                      selectedTicketId === ticket.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">
                          {ticket.titulo}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ID: {ticket.id}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {ticket.cliente}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {getStatusIcon(ticket.estado)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.estado)}`}
                      >
                        {ticket.estado}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Main Content - Ticket Details */}
          <section className="lg:col-span-2">
            {!selectedTicket ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-500">
                  Selecciona un ticket para ver los detalles
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ticket Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedTicket.titulo}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        ID: {selectedTicket.id}
                      </p>
                      <p className="text-slate-600 mt-3">
                        {selectedTicket.descripcion}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium shrink-0 ${getStatusColor(selectedTicket.estado)}`}
                    >
                      {selectedTicket.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase">
                        Cliente
                      </p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {selectedTicket.cliente}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase">
                        Creado
                      </p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {new Date(
                          selectedTicket.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase">
                        Actualizado
                      </p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {new Date(
                          selectedTicket.updatedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Change Buttons */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-semibold text-slate-900 mb-4">
                    Cambiar Estado
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        status: "pendiente" as TicketStatus,
                        label: "Pendiente",
                        color: "bg-amber-500 hover:bg-amber-600",
                      },
                      {
                        status: "seguimiento" as TicketStatus,
                        label: "Seguimiento",
                        color: "bg-blue-600 hover:bg-blue-700",
                      },
                      {
                        status: "cerrado" as TicketStatus,
                        label: "Cerrado",
                        color: "bg-emerald-600 hover:bg-emerald-700",
                      },
                    ].map((item) => (
                      <button
                        key={item.status}
                        onClick={() =>
                          changeStatus(selectedTicket.id, item.status)
                        }
                        disabled={selectedTicket.estado === item.status}
                        className={`px-4 py-3 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${item.color}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Form */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-semibold text-slate-900 mb-4">
                    Responder Ticket
                  </p>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 min-h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escribe la respuesta o seguimiento..."
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                  />
                  <button
                    onClick={responderTicket}
                    disabled={!respuesta.trim()}
                    className="mt-4 px-4 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Guardar respuesta
                  </button>
                </div>

                {/* Comments */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-semibold text-slate-900 mb-4">
                    Comentarios ({selectedTicket.comentarios.length})
                  </p>
                  <div className="space-y-4">
                    {selectedTicket.comentarios.length === 0 ? (
                      <p className="text-slate-500 text-sm">
                        Aún no hay respuestas.
                      </p>
                    ) : (
                      selectedTicket.comentarios.map((comentario) => (
                        <div
                          key={comentario.id}
                          className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">
                              {comentario.autor}
                            </p>
                            <span className="text-xs text-slate-500">
                              {comentario.createdAt}
                            </span>
                          </div>
                          <p className="mt-3 text-slate-700">
                            {comentario.mensaje}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <p className="text-sm font-semibold text-slate-900 mb-4">
                    Historial
                  </p>
                  <div className="space-y-3">
                    {selectedTicket.historial.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 text-sm text-slate-600 pb-3 border-b border-slate-200 last:border-0"
                      >
                        <span className="text-slate-400 whitespace-nowrap">
                          {item.createdAt}
                        </span>
                        <div>
                          <span className="font-medium text-slate-900">
                            {item.usuario}
                          </span>
                          <span className="text-slate-600">
                            {" "}
                            - {item.accion}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
