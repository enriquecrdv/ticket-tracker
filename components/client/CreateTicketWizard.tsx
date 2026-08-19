"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileUp, Loader2, Search } from "lucide-react";
import { ClientTicket } from "./types";
import { DEFAULT_REPORT_CATALOG, type ReportCategory } from "@/lib/report-catalog";

const LEGAL_TREATMENTS = [
  "A.C. - ASOCIACIÓN CIVIL",
  "A. EN P. - ASOCIACIÓN EN PARTICIPACIÓN",
  "I.A.P. - INSTITUCIÓN DE ASISTENCIA PRIVADA",
  "I.B.P. - INSTITUCIÓN DE BENEFICENCIA PRIVADA",
  "S.A. - SOCIEDAD ANÓNIMA",
  "S.A. DE C.V. - SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE",
  "S. DE R.L. - SOCIEDAD DE RESPONSABILIDAD LIMITADA",
  "S. DE R.L. DE C.V. - SOCIEDAD DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE",
  "S.A.S. - SOCIEDAD POR ACCIONES SIMPLIFICADA",
  "S.A.S. DE C.V. - SOCIEDAD POR ACCIONES SIMPLIFICADA DE CAPITAL VARIABLE",
  "S. EN N.C. - SOCIEDAD EN NOMBRE COLECTIVO",
  "S. EN N.C. DE C.V. - SOCIEDAD EN NOMBRE COLECTIVO DE CAPITAL VARIABLE",
  "S. EN C.S. - SOCIEDAD EN COMANDITA SIMPLE",
  "S. EN C.S. DE C.V. - SOCIEDAD EN COMANDITA SIMPLE DE CAPITAL VARIABLE",
  "S. EN C. POR A. - SOCIEDAD EN COMANDITA POR ACCIONES",
  "S. EN C. POR A. DE C.V. - SOCIEDAD EN COMANDITA POR ACCIONES DE CAPITAL VARIABLE",
  "S.A.P.I. - SOCIEDAD ANÓNIMA PROMOTORA DE INVERSIÓN",
  "S.A.P.I. DE C.V. - SOCIEDAD ANÓNIMA PROMOTORA DE INVERSIÓN DE CAPITAL VARIABLE",
  "S.A.P.I.B. - SOCIEDAD ANÓNIMA PROMOTORA DE INVERSIÓN BURSÁTIL",
  "S.A.P.I.B. DE C.V. - SOCIEDAD ANÓNIMA PROMOTORA DE INVERSIÓN BURSÁTIL DE CAPITAL VARIABLE",
  "S.A.B. - SOCIEDAD ANÓNIMA BURSÁTIL",
  "S.A.B. DE C.V. - SOCIEDAD ANÓNIMA BURSÁTIL DE CAPITAL VARIABLE",
  "S.C. - SOCIEDAD CIVIL",
  "S.C. DE C.V. - SOCIEDAD CIVIL DE CAPITAL VARIABLE",
  "S.C.L. - SOCIEDAD COOPERATIVA LIMITADA",
  "S.C.S. - SOCIEDAD COOPERATIVA DE RESPONSABILIDAD SUPLEMENTADA",
  "S.C. DE R.L. - SOCIEDAD COOPERATIVA DE RESPONSABILIDAD LIMITADA",
  "S.C. DE R.L. DE C.V. - SOCIEDAD COOPERATIVA DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE",
  "S.P.R. DE R.L. - SOCIEDAD DE PRODUCCIÓN RURAL DE RESPONSABILIDAD LIMITADA",
  "S.P.R. DE R.L. DE C.V. - SOCIEDAD DE PRODUCCIÓN RURAL DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE",
  "S.P.R. DE R.I. - SOCIEDAD DE PRODUCCIÓN RURAL DE RESPONSABILIDAD ILIMITADA",
  "S.P.R. DE R.S. - SOCIEDAD DE PRODUCCIÓN RURAL DE RESPONSABILIDAD SUPLEMENTADA",
  "S.S.S. - SOCIEDAD DE SOLIDARIDAD SOCIAL",
] as const;
const DEFAULT_LEGAL_TREATMENT = "S.A. DE C.V. - SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE";

const MEXICAN_STATES = [
  "AGS - AGUASCALIENTES", "BC - BAJA CALIFORNIA", "BCS - BAJA CALIFORNIA SUR",
  "CAMP - CAMPECHE", "COAH - COAHUILA", "COL - COLIMA", "CHIS - CHIAPAS",
  "CHIH - CHIHUAHUA", "CDMX - CIUDAD DE MÉXICO", "DGO - DURANGO",
  "GTO - GUANAJUATO", "GRO - GUERRERO", "HGO - HIDALGO", "JAL - JALISCO",
  "MEX - ESTADO DE MÉXICO", "MICH - MICHOACÁN", "MOR - MORELOS", "NAY - NAYARIT",
  "NL - NUEVO LEÓN", "OAX - OAXACA", "PUE - PUEBLA", "QRO - QUERÉTARO",
  "QROO - QUINTANA ROO", "SLP - SAN LUIS POTOSÍ", "SIN - SINALOA",
  "SON - SONORA", "TAB - TABASCO", "TAMPS - TAMAULIPAS", "TLAX - TLAXCALA",
  "VER - VERACRUZ", "YUC - YUCATÁN", "ZAC - ZACATECAS",
] as const;

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
  treatment: string;
  personType: "MORAL" | "FISICA";
  legalName: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  postalCode: string;
  municipality: string;
  state: string;
  rfc: string;
  latitude: string;
  longitude: string;
  specificRequest: string;
  ineFile: File | null;
  addressFile: File | null;
  taxFile: File | null;
  reportData: Record<string, string>;
};

const upper = (value: string) => value.toLocaleUpperCase("es-MX");
const cleanAltaText = (value: string) => upper(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/Ñ/g, "N")
  .replace(/[^A-Z0-9 ]/g, " ")
  .replace(/\s+/g, " ")
  .trimStart();

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
    treatment: DEFAULT_LEGAL_TREATMENT,
    personType: "MORAL",
    legalName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    neighborhood: "",
    postalCode: "",
    municipality: "",
    state: "",
    rfc: "",
    latitude: "",
    longitude: "",
    specificRequest: "SOLICITO EL ALTA DE UNA NUEVA SUCURSAL Y LA ASIGNACIÓN DE UN NÚMERO DE CLIENTE.",
    ineFile: null,
    addressFile: null,
    taxFile: null,
    reportData: {},
  });
  const [catalog, setCatalog] = useState<ReportCategory[]>(DEFAULT_REPORT_CATALOG);

  useEffect(() => { fetch("/api/report-catalog").then((response) => response.json()).then((data: ReportCategory[]) => { if (Array.isArray(data)) setCatalog(data); }); }, []);
  const activeCategories = catalog.filter((category) => category.active);
  const selectedCategory = activeCategories.find((category) => category.name === draft.category);
  const selectedReport = selectedCategory?.reports.find((report) => report.name === draft.subcategory && report.active);

  const canContinue =
    step === 1
      ? draft.storeName.trim() &&
        (draft.isNewAccount ||
          (draft.branch.trim() &&
          (/^\d{9}$/.test(draft.customerNumber) &&
            (draft.knownClient || draft.confirmNewClient))))
      : step === 2
        ? draft.isNewAccount
          ? Boolean((draft.personType === "FISICA" ? draft.treatment === "PERSONA FÍSICA" : LEGAL_TREATMENTS.includes(draft.treatment as (typeof LEGAL_TREATMENTS)[number])) && draft.legalName && draft.branch && draft.street && draft.exteriorNumber && draft.neighborhood && /^\d{5}$/.test(draft.postalCode) && draft.municipality && MEXICAN_STATES.includes(draft.state as (typeof MEXICAN_STATES)[number]) && draft.rfc && draft.openingDate)
          : Boolean(draft.category && draft.subcategory && draft.openingDate)
        : draft.isNewAccount
          ? Boolean(draft.specificRequest.trim() && draft.ineFile && draft.addressFile && draft.taxFile)
          : Boolean(selectedReport && selectedReport.fields.every((field) => {
              const value = (draft.reportData[field.key] ?? "").trim();
              return (!field.required || value) && (!field.digits || value.length === field.digits);
            }));

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
    if (files.reduce((total, file) => total + file.size, 0) > 200 * 1024 * 1024)
      return setError("El total de archivos no puede superar 200 MB.");
    setError("");
    setDraft((current) => ({ ...current, files }));
  }

  function chooseRequiredFile(field: "ineFile" | "addressFile" | "taxFile", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) return setError("Cada documento debe pesar máximo 5 MB.");
    setError("");
    setDraft((current) => ({ ...current, [field]: file }));
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
    const altaDescription = [
      `SOLICITUD: ${cleanAltaText(draft.specificRequest)}`,
      `FECHA TENTATIVA DE APERTURA: ${draft.openingDate}`,
      `TRATAMIENTO: ${cleanAltaText(draft.treatment)}`,
      `PERSONA: ${draft.personType}`,
      `RAZON SOCIAL: ${cleanAltaText(draft.legalName)}`,
      `NOMBRE SUCURSAL: ${cleanAltaText(draft.branch)}`,
      `CALLE: ${cleanAltaText(draft.street)}`,
      `NUMERO EXTERIOR: ${cleanAltaText(draft.exteriorNumber)}`,
      `NUMERO INTERIOR: ${cleanAltaText(draft.interiorNumber) || "SIN DATO"}`,
      `COLONIA: ${cleanAltaText(draft.neighborhood)}`,
      `CODIGO POSTAL: ${draft.postalCode}`,
      `MUNICIPIO: ${cleanAltaText(draft.municipality)}`,
      `ESTADO: ${cleanAltaText(draft.state)}`,
      `RFC: ${cleanAltaText(draft.rfc)}`,
      `LATITUD: ${draft.latitude.replace(/[^0-9.-]/g, "") || "SIN DATO"}`,
      `LONGITUD: ${draft.longitude.replace(/[^0-9.-]/g, "") || "SIN DATO"}`,
    ].join("\n");
    const reportDescription = selectedReport?.fields.map((field) => `${field.label}: ${draft.reportData[field.key] ?? ""}`).join("\n") ?? draft.description;
    body.append("description", draft.isNewAccount ? altaDescription : reportDescription);
    body.append("confirmNewClient", String(draft.confirmNewClient));
    draft.files.forEach((file, index) =>
      body.append(`evidence-${index}`, file),
    );
    if (draft.isNewAccount) {
      if (draft.ineFile) body.append("ine", draft.ineFile);
      if (draft.addressFile) body.append("comprobante-domicilio", draft.addressFile);
      if (draft.taxFile) body.append("constancia-fiscal", draft.taxFile);
    }
    const response = await fetch("/api/tickets", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "No se pudo crear el ticket.");
      setSending(false);
      return;
    }
    onCreated(result);
  }

  const labels = draft.isNewAccount
    ? ["Solicitud", "Datos de alta", "Documentos", "Confirmar"]
    : ["Ubicación", "Clasificación", "Detalles", "Confirmar"];
  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onCancel}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Cancelar
      </button>
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
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
              {draft.isNewAccount && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Alta de cliente nuevo</strong><p>Al continuar te pediremos los datos fiscales, dirección completa, fecha tentativa de apertura y los tres documentos obligatorios.</p><p className="mt-2 font-semibold">Tiempo estimado total: hasta 7 días hábiles.</p></div>}
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
              {!draft.isNewAccount && <Field label="Nombre de la sucursal o centro de venta">
                <input
                  value={draft.branch}
                  onChange={(e) =>
                    setDraft({ ...draft, branch: e.target.value, confirmNewClient: false })
                  }
                  disabled={draft.knownClient && !draft.isNewAccount}
                  placeholder={draft.isNewAccount ? "Escribe el nombre propuesto" : "Se completará al validar el código"}
                  className="input disabled:bg-emerald-50 disabled:text-emerald-800"
                />
              </Field>}
            </div>
          )}
          {step === 2 && !draft.isNewAccount && (
            <div className="space-y-5">
              <Field label="Tipo de problema">
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value,
                      subcategory: "",
                      reportData: {},
                    })
                  }
                  className="input"
                >
                  <option value="">Selecciona una categoría</option>
                  {activeCategories.map((item) => (
                    <option key={item.id}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Detalle">
                <select
                  value={draft.subcategory}
                  onChange={(e) =>
                    setDraft({ ...draft, subcategory: e.target.value, reportData: {} })
                  }
                  className="input"
                  disabled={!draft.category}
                >
                  <option value="">Selecciona una opción</option>
                  {(selectedCategory?.reports ?? []).filter((report) => report.active).map((item) => (
                    <option key={item.id}>{item.name}</option>
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
          {step === 2 && draft.isNewAccount && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Escribe los datos completos.</strong> Los campos de texto se guardarán automáticamente en MAYÚSCULAS. Ejemplo de sucursal: <strong>MOKA GALERÍAS ORIENTE</strong>.</div>
              <div className="grid gap-5 sm:grid-cols-2">
                <SearchableField id="treatment" label="Tratamiento / régimen societario" value={draft.treatment} options={LEGAL_TREATMENTS} disabled={draft.personType === "FISICA"} onChange={(value) => setDraft({ ...draft, treatment: upper(value) })} />
                <Field label="Persona moral o física"><select value={draft.personType} onChange={(e) => { const personType = e.target.value as Draft["personType"]; setDraft({ ...draft, personType, treatment: personType === "FISICA" ? "PERSONA FÍSICA" : draft.treatment === "PERSONA FÍSICA" ? DEFAULT_LEGAL_TREATMENT : draft.treatment }); }} className="input"><option value="MORAL">MORAL</option><option value="FISICA">FÍSICA</option></select></Field>
              </div>
              <Field label="Razón social"><input value={draft.legalName} onChange={(e) => setDraft({ ...draft, legalName: cleanAltaText(e.target.value) })} className="input uppercase" placeholder="ANSOMORI SA DE CV" /></Field>
              <Field label="Nombre del establecimiento / sucursal"><input value={draft.branch} onChange={(e) => setDraft({ ...draft, branch: cleanAltaText(e.target.value) })} className="input uppercase" placeholder="MOKA GALERIAS ORIENTE" /></Field>
              <Field label="Calle"><input value={draft.street} onChange={(e) => setDraft({ ...draft, street: cleanAltaText(e.target.value) })} className="input uppercase" placeholder="CIRCUITO INTERIOR AV JOSE VASCONCELOS" /></Field>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Número exterior"><input value={draft.exteriorNumber} onChange={(e) => setDraft({ ...draft, exteriorNumber: cleanAltaText(e.target.value) })} className="input uppercase" placeholder="127" /></Field><Field label="Número interior / local / lote (opcional)"><input value={draft.interiorNumber} onChange={(e) => setDraft({ ...draft, interiorNumber: cleanAltaText(e.target.value) })} className="input uppercase" /></Field></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Colonia"><input value={draft.neighborhood} onChange={(e) => setDraft({ ...draft, neighborhood: cleanAltaText(e.target.value) })} className="input uppercase" /></Field><Field label="Código postal (5 dígitos)"><input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })} inputMode="numeric" maxLength={5} className="input" /></Field></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Municipio / alcaldía"><input value={draft.municipality} onChange={(e) => setDraft({ ...draft, municipality: cleanAltaText(e.target.value) })} className="input uppercase" /></Field><SearchableField id="state" label="Estado de la República" value={draft.state} options={MEXICAN_STATES} onChange={(value) => setDraft({ ...draft, state: upper(value) })} placeholder="Busca por abreviatura o nombre" /></div>
              <Field label="RFC"><input value={draft.rfc} onChange={(e) => setDraft({ ...draft, rfc: upper(e.target.value.replace(/\s/g, "")).slice(0, 13) })} className="input uppercase" maxLength={13} placeholder="ANS190207LC1" /></Field>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Latitud (opcional)"><input value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} className="input" placeholder="19.41456458" /></Field><Field label="Longitud (opcional)"><input value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} className="input" placeholder="-99.17641609" /></Field></div>
              <Field label="Fecha tentativa de apertura"><input type="date" value={draft.openingDate} onChange={(e) => setDraft({ ...draft, openingDate: e.target.value })} className="input" /></Field>
            </div>
          )}
          {step === 3 && !draft.isNewAccount && (
            <div className="space-y-5">
              {selectedReport?.fields.map((field) => <Field key={field.key} label={`${field.label}${field.required ? " *" : ""}`}>
                {field.type === "text" && field.key === "description" ? <textarea value={draft.reportData[field.key] ?? ""} onChange={(e) => setDraft({ ...draft, reportData: { ...draft.reportData, [field.key]: e.target.value } })} rows={6} className="input resize-none" placeholder="Describe el problema con todos los detalles" /> : <input type={field.type === "number" ? "number" : field.type} value={draft.reportData[field.key] ?? ""} maxLength={field.digits} inputMode={field.digits ? "numeric" : undefined} onChange={(e) => { const value = field.digits ? e.target.value.replace(/\D/g, "").slice(0, field.digits) : e.target.value; setDraft({ ...draft, reportData: { ...draft.reportData, [field.key]: value } }); }} className="input" />}
                {field.digits && <span className="mt-1 block text-xs text-slate-500">Debe contener exactamente {field.digits} digitos.</span>}
              </Field>)}
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50/50">
                <FileUp className="h-5 w-5 text-blue-600" />
                {draft.files.length
                  ? `${draft.files.length} archivo(s) seleccionado(s)`
                  : "Adjuntar evidencia (opcional)"}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.eml,.msg,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                  onChange={chooseFiles}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {step === 3 && draft.isNewAccount && (
            <div className="space-y-6">
              <Field label="Solicitud específica para el alta"><textarea value={draft.specificRequest} onChange={(e) => setDraft({ ...draft, specificRequest: cleanAltaText(e.target.value) })} rows={4} className="input resize-none uppercase" /></Field>
              <div className="rounded-2xl border border-slate-200 p-5"><h2 className="font-bold text-slate-900">Documentos obligatorios</h2><p className="mt-1 text-sm text-slate-500">PDF, JPG o PNG; máximo 5 MB cada uno. La constancia fiscal debe tener una vigencia no mayor a 3 meses.</p><div className="mt-4 grid gap-4">
                <RequiredUpload label="INE o pasaporte" file={draft.ineFile} onChange={(e) => chooseRequiredFile("ineFile", e)} />
                <RequiredUpload label="Comprobante de domicilio del local" file={draft.addressFile} onChange={(e) => chooseRequiredFile("addressFile", e)} />
                <RequiredUpload label="Constancia de situación fiscal" file={draft.taxFile} onChange={(e) => chooseRequiredFile("taxFile", e)} />
              </div></div>
              <div className="rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-950"><h2 className="font-bold">Proceso y tiempos estimados</h2><ol className="mt-2 list-decimal space-y-2 pl-5"><li><strong>Recepción y canalización:</strong> asignación de oficina de ventas, ruta y centro de suministro; hasta 3 días hábiles.</li><li><strong>Alta y número de cliente:</strong> aproximadamente 5 días hábiles una vez recibida la información completa.</li><li><strong>Finalización:</strong> solicitud de crédito, punteo y planificación de visitas; 24 horas adicionales.</li></ol><p className="mt-3 font-bold">Estimado total: 7 días hábiles, sujeto a la fecha tentativa de apertura.</p></div>
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
              {draft.isNewAccount ? <><Review label="Razón social / RFC" value={`${draft.legalName} / ${draft.rfc}`} /><Review label="Dirección" value={`${draft.street} ${draft.exteriorNumber}${draft.interiorNumber ? ` INT. ${draft.interiorNumber}` : ""}, ${draft.neighborhood}, C.P. ${draft.postalCode}, ${draft.municipality}, ${draft.state}`} /><Review label="Fecha tentativa de apertura" value={draft.openingDate} /><Review label="Solicitud" value={draft.specificRequest} /></> : selectedReport?.fields.map((field) => <Review key={field.key} label={field.label} value={draft.reportData[field.key] ?? ""} />)}
              <Review
                label="Adjuntos"
                value={
                  draft.isNewAccount
                    ? "INE/PASAPORTE, COMPROBANTE DE DOMICILIO Y CONSTANCIA FISCAL"
                    : draft.files.length
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

function SearchableField({ id, label, value, options, onChange, placeholder, disabled = false }: { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const filteredOptions = options.filter((option) => option.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes(normalizedQuery));

  function openList() {
    if (disabled) return;
    setQuery("");
    setOpen(true);
  }

  return <div className="relative">
    <label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
    <div className={`relative rounded-xl ${open ? "ring-2 ring-blue-500" : ""}`}>
      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
      <input id={id} type="search" value={open ? query : value} onFocus={openList} onClick={openList} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onBlur={() => window.setTimeout(() => setOpen(false), 120)} placeholder={placeholder ?? "Escribe para buscar"} disabled={disabled} autoComplete="off" className="input pl-10 pr-10 uppercase disabled:bg-slate-100 disabled:text-slate-700" aria-expanded={open} aria-controls={`${id}-options`} role="combobox" />
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => open ? setOpen(false) : openList()} disabled={disabled} aria-label={`Abrir opciones de ${label}`} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:hidden"><ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} /></button>
    </div>
    {open && <div id={`${id}-options`} role="listbox" className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <p className="sticky top-0 bg-white px-3 py-2 text-xs font-semibold text-slate-400">{filteredOptions.length} resultado(s)</p>
      {filteredOptions.map((option) => <button type="button" role="option" aria-selected={option === value} key={option} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option); setQuery(""); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50 ${option === value ? "bg-blue-50 font-bold text-blue-800" : "text-slate-700"}`}>{option}</button>)}
      {!filteredOptions.length && <p className="px-3 py-5 text-center text-sm text-slate-500">No encontramos coincidencias.</p>}
    </div>}
    <span className="mt-1 block text-xs text-slate-500">Haz clic y escribe para filtrar la lista completa.</span>
  </div>;
}

function RequiredUpload({ label, file, onChange }: { label: string; file: File | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition ${file ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-dashed border-slate-300 bg-white text-slate-700 hover:border-blue-400"}`}><span className={`grid h-8 w-8 place-items-center rounded-full ${file ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700"}`}>{file ? <Check className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block">{label}</span><span className="block truncate text-xs font-normal opacity-70">{file?.name ?? "Seleccionar documento"}</span></span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="sr-only" /></label>;
}
