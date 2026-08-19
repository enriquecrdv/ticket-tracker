"use client";

import { useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, FileUp, Loader2 } from "lucide-react";
import { ClientTicket } from "./types";

const CATEGORIES: Record<string, string[]> = {
  "Alta de clientes": ["Solicitud de alta"],
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
  "Sistemas y aplicaciones": [
    "No puedo iniciar sesión",
    "Error en pedido",
    "No procesa pago",
  ],
  "Crédito, saldos y facturación": [
    "Nota de crédito",
    "Saldo no aplica",
    "Factura duplicada",
  ],
  "Equipos y activos": ["No enfría", "Fuga", "Mantenimiento preventivo"],
  "Abasto y catálogo": [
    "Producto no disponible",
    "Precio incorrecto",
    "Catálogo desactualizado",
  ],
};

type Draft = {
  customerNumber: string;
  branch: string;
  storeName: string;
  category: string;
  subcategory: string;
  impact: "low" | "medium" | "high";
  openingDate: string;
  description: string;
  files: File[];
  knownClient: boolean;
  confirmNewClient: boolean;
  isNewAccount: boolean;
};

export function CreateTicketWizard({
  chainName,
  customerNumber,
  onCancel,
  onCreated,
}: {
  chainName: string;
  customerNumber: string;
  onCancel: () => void;
  onCreated: (ticket: ClientTicket) => void;
}) {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>({
    customerNumber,
    branch: "",
    storeName: chainName,
    category: "",
    subcategory: "",
    impact: "medium",
    openingDate: new Date().toISOString().slice(0, 10),
    description: "",
    files: [],
    knownClient: Boolean(customerNumber),
    confirmNewClient: false,
    isNewAccount: false,
  });

  const canContinue =
    step === 1
      ? draft.branch.trim() &&
        draft.storeName.trim() &&
        (draft.isNewAccount ||
          (/^\d{9}$/.test(draft.customerNumber) &&
            (draft.knownClient || draft.confirmNewClient)))
      : step === 2
        ? draft.category && draft.subcategory && draft.openingDate
        : draft.description.trim().length >= 5;

  async function lookupClient(code: string) {
    setDraft((current) => ({
      ...current,
      customerNumber: code.replace(/\D/g, "").slice(0, 9),
      knownClient: false,
      confirmNewClient: false,
    }));
    if (!/^\d{9}$/.test(code)) return;
    const response = await fetch(`/api/client-context?code=${code}`);
    const result = await response.json();
    if (response.ok && result.client)
      setDraft((current) => ({
        ...current,
        storeName: result.chain.name,
        branch: result.client.name,
        knownClient: true,
      }));
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    if (files.some((file) => file.size > 5 * 1024 * 1024))
      return setError("Cada archivo debe pesar menos de 5 MB.");
    setError("");
    setDraft((current) => ({ ...current, files }));
  }

  async function submit() {
    setSending(true);
    setError("");
    const body = new FormData();
    body.append("customerNumber", draft.customerNumber);
    body.append("branch", draft.branch);
    body.append("storeName", draft.storeName);
    body.append("category", draft.category);
    body.append("subcategory", draft.subcategory);
    body.append("impact", draft.impact);
    body.append("openingDate", draft.openingDate);
    body.append("description", draft.description);
    body.append("confirmNewClient", String(draft.confirmNewClient));
    draft.files.forEach((file, index) =>
      body.append(`evidence-${index}`, file),
    );
    const response = await fetch("/api/tickets", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No se pudo crear el ticket.");
      setSending(false);
      return;
    }
    onCreated(result);
  }

  const labels = ["Ubicación", "Clasificación", "Detalles", "Confirmar"];
  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onCancel}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Cancelar
      </button>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold text-blue-600">Nueva solicitud</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Cuéntanos cómo podemos ayudarte
          </h1>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {labels.map((label, index) => (
              <div key={label}>
                <div
                  className={`h-1.5 rounded-full ${index + 1 <= step ? "bg-blue-600" : "bg-slate-200"}`}
                />
                <p
                  className={`mt-2 hidden text-xs sm:block ${index + 1 === step ? "font-bold text-blue-700" : "text-slate-400"}`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-80 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                <input
                  type="checkbox"
                  checked={draft.isNewAccount}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      isNewAccount: e.target.checked,
                      customerNumber: "",
                      category: e.target.checked ? "Alta de clientes" : "",
                      subcategory: e.target.checked ? "Solicitud de alta" : "",
                    })
                  }
                />
                Estoy solicitando un número de cliente nuevo
              </label>
              {!draft.isNewAccount && (
                <Field label="Código de cliente (9 dígitos)">
                  <input
                    value={draft.customerNumber}
                    onChange={(e) => lookupClient(e.target.value)}
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="Ej. 101051274"
                    className="input"
                    autoFocus
                  />
                  {draft.customerNumber.length > 0 &&
                    draft.customerNumber.length !== 9 && (
                      <span className="mt-1 block text-xs font-medium text-amber-700">
                        Debe contener exactamente 9 dígitos.
                      </span>
                    )}
                </Field>
              )}
              <Field label="Nombre de cadena / compañía">
                <input
                  value={draft.storeName || chainName}
                  disabled
                  className="input bg-slate-50 font-semibold text-slate-700"
                />
              </Field>
              {!draft.isNewAccount &&
                (draft.knownClient ? (
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    Código encontrado. Cadena y sucursal verificadas en la base de datos.
                  </p>
                ) : (
                  /^\d{9}$/.test(draft.customerNumber) &&
                  draft.branch && (
                    <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <input
                        type="checkbox"
                        checked={draft.confirmNewClient}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            confirmNewClient: e.target.checked,
                          })
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong>Confirmo que el nombre de la sucursal es correcto.</strong>
                        <br />
                        Así se guardará en el sistema para futuros tickets.
                      </span>
                    </label>
                  )
                ))}
              <Field label="Nombre de la sucursal o centro de venta">
                <input
                  value={draft.branch}
                  onChange={(e) =>
                    setDraft({ ...draft, branch: e.target.value, confirmNewClient: false })
                  }
                  disabled={draft.knownClient && !draft.isNewAccount}
                  placeholder={draft.isNewAccount ? "Escribe el nombre propuesto" : "Se completará al validar el código"}
                  className="input disabled:bg-emerald-50 disabled:text-emerald-800"
                />
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <Field label="Tipo de problema">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value,
                      subcategory: "",
                    })
                  }
                  className="input"
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(CATEGORIES).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Detalle">
                <select
                  value={draft.subcategory}
                  onChange={(e) =>
                    setDraft({ ...draft, subcategory: e.target.value })
                  }
                  className="input"
                  disabled={!draft.category}
                >
                  <option value="">Selecciona una opción</option>
                  {(CATEGORIES[draft.category] ?? []).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Impacto">
                  <select
                    value={draft.impact}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        impact: e.target.value as Draft["impact"],
                      })
                    }
                    className="input"
                  >
                    <option value="low">Bajo</option>
                    <option value="medium">Medio</option>
                    <option value="high">Alto</option>
                  </select>
                </Field>
                <Field label="Fecha">
                  <input
                    type="date"
                    value={draft.openingDate}
                    onChange={(e) =>
                      setDraft({ ...draft, openingDate: e.target.value })
                    }
                    className="input"
                  />
                </Field>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-5">
              <Field label="Describe lo ocurrido">
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  rows={6}
                  placeholder="Incluye qué ocurrió, cuándo comenzó y cómo afecta tu operación..."
                  className="input resize-none"
                  autoFocus
                />
              </Field>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50/50">
                <FileUp className="h-5 w-5 text-blue-600" />
                {draft.files.length
                  ? `${draft.files.length} archivo(s) seleccionado(s)`
                  : "Adjuntar evidencia (opcional)"}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={chooseFiles}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <Review
                label="Cadena / compañía"
                value={draft.storeName || chainName}
              />
              <Review label="Código de cliente" value={draft.customerNumber || "Pendiente por alta"} />
              <Review label="Sucursal o centro de venta" value={draft.branch} />
              <Review
                label="Clasificación"
                value={`${draft.category} / ${draft.subcategory}`}
              />
              <Review label="Descripción" value={draft.description} />
              <Review
                label="Adjuntos"
                value={
                  draft.files.length
                    ? `${draft.files.length} archivo(s)`
                    : "Sin adjuntos"
                }
              />
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-8">
          <button
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white disabled:invisible"
          >
            Atrás
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((current) => current + 1)}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Crear ticket
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}
