"use client";
import { useMemo, useState, type ChangeEvent, type JSX } from "react";
import React from "react";
import {
  ChevronDown,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Ban,
  FileText,
} from "lucide-react";

// Tipos de categorías disponibles para los tickets
type TicketCategory =
  | "Alta de clientes"
  | "Entregas y pedidos"
  | "Reposición de producto en mal estado"
  | "Sistemas y aplicaciones (APP BEES / MDWEB)"
  | "Cambio de propietario / datos fiscales"
  | "Crédito, saldos y facturación"
  | "Equipos y activos (refrigeradores, choperas)"
  | "Abasto y catálogo";

// Estados posibles de un ticket
type TicketStatus = "en_proceso" | "en_espera_cliente" | "resuelto" | "cerrado";

// Niveles de impacto y prioridad
type Impact = "low" | "medium" | "high";
type Priority = "low" | "medium" | "high";

// Elemento individual en la línea de tiempo del ticket
interface TimelineItem {
  id: string;
  label: string;
  at: string;
}

// Datos completos de un ticket
interface TicketData {
  id: string;
  customerNumber: string;
  branch: string;
  storeName?: string;
  category: TicketCategory;
  subcategory: string;
  impact: Impact;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  openingDate?: string;
  timeline: TimelineItem[];
}

// Datos del formulario para crear un ticket
interface FormData {
  customerNumber: string;
  branch: string;
  storeName: string;
  category: TicketCategory | "";
  subcategory: string;
  impact: Impact;
  openingDate: string;
  description: string;
  evidence: File | null;
  ine: File | null;
  proofOfAddress: File | null;
  csf: File | null;
  address: string;
  coordinates: string;
}

// Mapeo de categorías con sus subcategorías disponibles
const CATEGORY_SUBCATEGORIES: Record<TicketCategory, string[]> = {
  "Alta de clientes": ["Datos del local y Documentación"],
  "Entregas y pedidos": [
    "Pedido incompleto",
    "Pedido retrasado",
    "Pedido incorrecto",
  ],
  "Reposición de producto en mal estado": [
    "Producto caducado",
    "Envase dañado",
    "Sabor alterado",
  ],
  "Sistemas y aplicaciones (APP BEES / MDWEB)": [
    "No puedo iniciar sesión",
    "Error en pedido",
    "No procesa pago",
  ],
  "Cambio de propietario / datos fiscales": [
    "Cambio de razón social",
    "RFC incorrecto",
    "Domicilio fiscal",
  ],
  "Crédito, saldos y facturación": [
    "Nota de crédito",
    "Saldo no aplica",
    "Factura duplicada",
  ],
  "Equipos y activos (refrigeradores, choperas)": [
    "No enfría",
    "Fuga",
    "Mantenimiento preventivo",
  ],
  "Abasto y catálogo": [
    "Producto no disponible",
    "Precio incorrecto",
    "Catálogo desactualizado",
  ],
};

// Categorías que requieren archivo de evidencia
const REQUIRES_EVIDENCE: TicketCategory[] = [
  "Alta de clientes",
  "Reposición de producto en mal estado",
  "Equipos y activos (refrigeradores, choperas)",
];

// Metadatos para mostrar el estado del ticket (etiqueta, color, icono)
const STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; icon: JSX.Element }
> = {
  en_proceso: {
    label: "En proceso",
    color: "bg-amber-100 text-amber-700",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  en_espera_cliente: {
    label: "En espera del cliente",
    color: "bg-purple-100 text-purple-700",
    icon: <PauseCircle className="w-4 h-4" />,
  },
  resuelto: {
    label: "Resuelto",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  cerrado: {
    label: "Cerrado",
    color: "bg-slate-200 text-slate-700",
    icon: <Ban className="w-4 h-4" />,
  },
};

// Metadatos para mostrar el nivel de prioridad/impacto (etiqueta y color)
const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label: "High", color: "bg-rose-100 text-rose-700" },
};

// Estado inicial del formulario
const initialForm: FormData = {
  customerNumber: "",
  branch: "",
  storeName: "",
  category: "",
  subcategory: "",
  impact: "medium",
  openingDate: "",
  description: "",
  evidence: null,
  ine: null,
  proofOfAddress: null,
  csf: null,
  address: "",
  coordinates: "",
};

// Valida los datos del formulario antes de enviar
function validateForm(data: FormData): string | null {
  if (data.category !== "Alta de clientes" && !data.customerNumber.trim())
    return "El número de cliente es obligatorio.";
  if (!data.branch.trim()) return "La sucursal es obligatoria.";
  if (!data.storeName.trim())
    return "El nombre del punto de venta es obligatorio.";
  if (!data.category) return "Selecciona una categoría.";
  if (!data.subcategory) return "Selecciona una subcategoría.";
  if (!data.description.trim()) return "La descripción es obligatoria.";
  if (!data.openingDate.trim()) return "La fecha de apertura es obligatoria.";
  // Validaciones especiales para "Alta de clientes"
  if (data.category === "Alta de clientes") {
    if (!data.address.trim())
      return "La dirección es obligatoria para el alta.";
    if (!data.coordinates.trim())
      return "Las coordenadas son obligatorias para el alta.";
    if (!data.ine || !data.proofOfAddress || !data.csf)
      return "Debes adjuntar INE, comprobante de domicilio y CSF.";
  }
  // Validar que categorías específicas tengan evidencia
  if (
    data.category &&
    data.category !== "Alta de clientes" &&
    REQUIRES_EVIDENCE.includes(data.category as TicketCategory) &&
    !data.evidence
  )
    return "Esta categoría requiere evidencia.";
  return null;
}

// Valida que el archivo no exceda 5MB
function isFileValid(file?: File | null): boolean {
  if (!file) return true;
  return file.size <= 5 * 1024 * 1024;
}

// Componente para mostrar la línea de tiempo del ticket
function TicketTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="space-y-3">
      {timeline.map((item) => (
        <div key={item.id} className="flex gap-3 items-start">
          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500">{item.at}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClienteComponent() {
  // Estado para controlar qué pestaña está activa (búsqueda o crear)
  const [activeTab, setActiveTab] = useState<"create" | "search">("search");
  // Estado del formulario
  const [formData, setFormData] = useState<FormData>(initialForm);
  // Query de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  // Lista de tickets obtenidos de la búsqueda
  const [tickets, setTickets] = useState<TicketData[]>([]);
  // Ticket seleccionado para ver detalles
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  // Indica si se está realizando una operación
  const [loading, setLoading] = useState(false);
  // Mensaje de retroalimentación al usuario
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Calcula subcategorías disponibles basadas en la categoría seleccionada
  const availableSubcategories = useMemo(() => {
    if (!formData.category) return [];
    return CATEGORY_SUBCATEGORIES[formData.category as TicketCategory] ?? [];
  }, [formData.category]);

  // Maneja cambios en inputs de texto
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Maneja cambio de categoría y resetea campos relacionados
  const handleCategoryChange = (value: TicketCategory | "") => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      // Auto-selecciona subcategoría para "Alta de clientes"
      subcategory:
        value === "Alta de clientes" ? "Datos del local y Documentación" : "",
      // Mantiene dirección y coordenadas solo para "Alta de clientes"
      address: value === "Alta de clientes" ? prev.address : "",
      coordinates: value === "Alta de clientes" ? prev.coordinates : "",
      // Limpia número de cliente solo para "Alta de clientes"
      customerNumber: value === "Alta de clientes" ? "" : prev.customerNumber,
    }));
  };

  // Maneja carga de archivos y valida el tamaño
  const handleFileChange =
    (field: "evidence" | "ine" | "proofOfAddress" | "csf") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      const file = files?.[0];
      if (!isFileValid(file)) {
        setFeedback({
          type: "error",
          message: "El archivo debe ser menor a 5MB.",
        });
        e.target.value = "";
        return;
      }
      setFeedback(null);
      setFormData((prev) => ({ ...prev, [field]: file ?? null }));
    };

  // Envía el formulario para crear un ticket
  const handleSubmitTicket = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    // Valida el formulario
    const error = validateForm(formData);
    if (error) {
      setFeedback({ type: "error", message: error });
      return;
    }
    setLoading(true);

    // Prepara los datos para enviar (usando FormData para archivos)
    const payload = new FormData();
    payload.append("customerNumber", formData.customerNumber);
    payload.append("branch", formData.branch);
    payload.append("storeName", formData.storeName);
    payload.append("category", formData.category);
    payload.append("subcategory", formData.subcategory);
    payload.append("impact", formData.impact);
    payload.append("description", formData.description);
    payload.append("openingDate", formData.openingDate);
    payload.append("address", formData.address);
    payload.append("coordinates", formData.coordinates);
    // Adjunta archivos según la categoría
    if (formData.category === "Alta de clientes") {
      if (formData.ine) payload.append("ine", formData.ine);
      if (formData.proofOfAddress)
        payload.append("proofOfAddress", formData.proofOfAddress);
      if (formData.csf) payload.append("csf", formData.csf);
    } else if (formData.evidence) {
      payload.append("evidence", formData.evidence);
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        body: payload,
      });
      if (!response.ok) throw new Error("No se pudo crear el ticket");
      // Limpia el formulario tras éxito
      setFormData(initialForm);
      setFeedback({ type: "success", message: "Ticket creado exitosamente." });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Error al crear el ticket.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Busca tickets basado en la query
  const handleSearch = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/tickets?q=${encodeURIComponent(searchQuery)}`,
      );
      if (!response.ok) throw new Error("No se pudo obtener tickets");
      const data: TicketData[] = await response.json();
      setTickets(data);
      // Auto-selecciona el primer ticket si existe
      if (data.length) setSelectedTicket(data[0]);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Error al buscar tickets.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Seguimiento Clientes Modelo
              </h1>
              <p className="text-xs text-slate-500">
                Sistema de Gestión de Tickets
              </p>
            </div>
          </div>
          <button className="text-slate-600 hover:text-slate-900 transition">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        {/* Pestañas de navegación */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "search"
                ? "bg-white text-blue-600 shadow-lg"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            <span className="hidden sm:inline">Mis Tickets</span>
            <span className="sm:hidden">Tickets</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "create"
                ? "bg-white text-blue-600 shadow-lg"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            <span className="hidden sm:inline">Nuevo Ticket</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {/* Mensaje de retroalimentación */}
        {feedback && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Pestaña de búsqueda */}
        {activeTab === "search" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
                  Gestión de Tickets
                </h2>
                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
                  <div className="flex-1 relative min-w-0">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por ID, cliente..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 whitespace-nowrap text-sm"
                  >
                    {loading ? "Buscando..." : "Buscar"}
                  </button>
                  <button className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2.5 rounded-lg transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabla de tickets */}
                {tickets.length > 0 ? (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            ID
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden sm:table-cell">
                            Cliente
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden md:table-cell">
                            Categoría
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Estado
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 hidden lg:table-cell">
                            Impacto
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <code className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                                {ticket.id.slice(0, 8)}...
                              </code>
                            </td>
                            <td className="py-4 px-4 text-slate-700 hidden sm:table-cell text-sm">
                              {ticket.customerNumber || "N/A"}
                            </td>
                            <td className="py-4 px-4 hidden md:table-cell">
                              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium truncate max-w-xs">
                                {ticket.category}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${STATUS_META[ticket.status].color}`}
                              >
                                {STATUS_META[ticket.status].icon}
                                <span className="hidden sm:inline">
                                  {STATUS_META[ticket.status].label}
                                </span>
                              </span>
                            </td>
                            <td className="py-4 px-4 hidden lg:table-cell">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${PRIORITY_META[ticket.impact as Priority]?.color}`}
                              >
                                {ticket.impact}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-xs sm:text-sm"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm sm:text-base">
                      Realiza una búsqueda para ver tus tickets
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de detalle del ticket */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 h-fit sticky top-20 sm:top-24">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
                Detalle
              </h3>
              {selectedTicket ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Ticket</p>
                      <p className="text-sm sm:text-base font-semibold truncate">
                        {selectedTicket.id.slice(0, 12)}...
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_META[selectedTicket.status].color}`}
                    >
                      {STATUS_META[selectedTicket.status].icon}
                      <span className="hidden sm:inline">
                        {STATUS_META[selectedTicket.status].label}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.openingDate && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                        {selectedTicket.openingDate}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {selectedTicket.impact}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 space-y-1">
                    <p className="truncate">
                      <span className="font-semibold">PDV:</span>{" "}
                      {selectedTicket.storeName || "N/A"}
                    </p>
                    <p className="truncate">
                      <span className="font-semibold">Cat:</span>{" "}
                      {selectedTicket.category}
                    </p>
                    <p className="truncate">
                      <span className="font-semibold">Sub:</span>{" "}
                      {selectedTicket.subcategory}
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-slate-800 mb-2">
                      Timeline
                    </p>
                    <TicketTimeline timeline={selectedTicket.timeline} />
                  </div>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-slate-500">
                  Selecciona un ticket para ver detalles.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña de crear ticket */}
        {activeTab === "create" && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Crear Nuevo Ticket
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
              Completa el formulario para registrar un nuevo ticket
            </p>

            <form
              onSubmit={handleSubmitTicket}
              className="space-y-6 sm:space-y-8"
            >
              {/* Sección: Datos del Cliente */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 pb-4 border-b-2 border-blue-600">
                  Datos del Cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.category !== "" &&
                    formData.category !== "Alta de clientes" && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Número de Cliente *
                        </label>
                        <input
                          type="text"
                          name="customerNumber"
                          value={formData.customerNumber}
                          onChange={handleInputChange}
                          required={
                            formData.category &&
                            formData.category !== "Alta de clientes"
                          }
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                          placeholder="Ej: 123456"
                        />
                      </div>
                    )}
                  {formData.category === "Alta de clientes" && (
                    <div className="col-span-1 text-xs sm:text-sm text-slate-500 flex items-end">
                      No se requiere número de cliente.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Sucursal *
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                      placeholder="Sucursal"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nombre del punto de venta *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                      placeholder="Ej: Tienda Centro"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Clasificación */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 pb-4 border-b-2 border-blue-600">
                  Clasificación
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        handleCategoryChange(
                          e.target.value as TicketCategory | "",
                        )
                      }
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                    >
                      <option value="">Selecciona</option>
                      {Object.keys(CATEGORY_SUBCATEGORIES).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Subcategoría *
                    </label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.category}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100 disabled:bg-slate-100"
                    >
                      <option value="">Selecciona</option>
                      {availableSubcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Impacto *
                    </label>
                    <select
                      name="impact"
                      value={formData.impact}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                    >
                      <option value="low">Bajo</option>
                      <option value="medium">Medio</option>
                      <option value="high">Alto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fecha de apertura *
                    </label>
                    <input
                      type="date"
                      name="openingDate"
                      value={formData.openingDate}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                    />
                  </div>
                </div>

                {/* Campos adicionales para "Alta de clientes" */}
                {formData.category === "Alta de clientes" && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dirección del local *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                        placeholder="Calle, número, colonia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Coordenadas *
                      </label>
                      <input
                        type="text"
                        name="coordinates"
                        value={formData.coordinates}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                        placeholder="Lat, Long"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Detalle */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 pb-4 border-b-2 border-blue-600">
                  Detalle
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Descripción breve *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
  placeholder:text-slate-500 placeholder:font-medium placeholder:opacity-100"
                      rows={3}
                      placeholder="Describe brevemente el problema..."
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Evidencia */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 pb-4 border-b-2 border-blue-600">
                  Evidencia
                </h3>
                {formData.category === "Alta de clientes" ? (
                  // Muestra campos de archivo para "Alta de clientes"
                  <div className="space-y-3">
                    {["ine", "proofOfAddress", "csf"].map((fileType) => (
                      <div key={fileType}>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                          {fileType === "ine"
                            ? "INE"
                            : fileType === "proofOfAddress"
                              ? "Comprobante de domicilio"
                              : "CSF"}{" "}
                          (max 5MB)
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-700">
                            Adjuntar {fileType}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange(
                              fileType as "ine" | "proofOfAddress" | "csf",
                            )}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </label>
                        {formData[fileType as keyof FormData] instanceof
                          File && (
                          <span className="text-xs text-slate-600">
                            {(
                              formData[fileType as keyof FormData] as File
                            ).name.slice(0, 30)}
                            ... (
                            {(
                              (formData[fileType as keyof FormData] as File)
                                .size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Muestra campo de archivo para otras categorías
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Documentos (max 5MB)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm flex-1 justify-center">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700">Adjuntar archivo</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange("evidence")}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                      {formData.evidence && (
                        <span className="text-xs text-slate-600">
                          {formData.evidence.name.slice(0, 20)}... (
                          {(formData.evidence.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 shadow-lg text-sm sm:text-base"
                >
                  {loading ? "Creando ticket..." : "Crear Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className="flex-1 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
