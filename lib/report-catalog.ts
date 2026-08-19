export type ReportFieldType = "text" | "date" | "email" | "number";
export type ReportField = { key: string; label: string; type: ReportFieldType; required: boolean; digits?: number };
export type ReportDefinition = { id: string; name: string; active: boolean; fields: ReportField[] };
export type ReportCategory = { id: string; name: string; active: boolean; reports: ReportDefinition[] };

const description = (): ReportField[] => [{ key: "description", label: "DESCRIPCION", type: "text", required: true }];
const order = (): ReportField => ({ key: "orderNumber", label: "NUMERO DE PEDIDO 9 DIGITOS", type: "text", required: true, digits: 9 });
const orderDate = (): ReportField => ({ key: "orderDate", label: "FECHA DEL PEDIDO", type: "date", required: true });
const report = (id: string, name: string, fields: ReportField[] = description()): ReportDefinition => ({ id, name, active: true, fields });

export const DEFAULT_REPORT_CATALOG: ReportCategory[] = [
  { id: "deliveries", name: "ENTREGAS Y PEDIDOS", active: true, reports: [
    report("incomplete-order", "PEDIDO INCOMPLETO", [order(), orderDate(), ...description()]),
    report("late-order", "PEDIDO RETRASADO", [order(), orderDate(), { key: "appDeliveryDate", label: "FECHA DE ENTREGA INDICADA EN LA APP", type: "date", required: true }, ...description()]),
    report("wrong-order", "PEDIDO INCORRECTO", [order(), orderDate(), ...description()]),
    report("price-difference", "DIFERENCIA DE PRECIOS", [order(), orderDate(), ...description()]),
    report("no-stock-app", "SIN STOCK EN APP"), report("missing-products-app", "NO APARECEN PRODUCTOS EN APP"), report("deliveries-other", "OTRO"),
  ]},
  { id: "damaged-product", name: "REPOSICION DE PRODUCTO EN MAL ESTADO", active: true, reports: [report("expired", "PRODUCTO CADUCADO"), report("replacement-incomplete", "PEDIDO INCOMPLETO"), report("damaged-container", "ENVASE DANADO"), report("replacement-other", "OTRO")] },
  { id: "systems", name: "SISTEMAS Y APLICACIONES", active: true, reports: [report("bees-login", "NO PUEDO INICIAR SESION BEES"), report("bees-order-error", "ERROR EN PEDIDO BEES"), report("delete-bees-users", "BORRAR USUARIOS BEES"), report("support-portal", "PROBLEMAS PORTAL SOPORTE"), report("support-suggestion", "SUGERENCIA PORTAL SOPORTE"), report("systems-other", "OTRO")] },
  { id: "credit", name: "CREDITO SALDOS FACTURACION", active: true, reports: [
    report("new-credit", "SOLICITUD DE CREDITO CLIENTE NUEVO", [{ key: "requestedAmount", label: "CANTIDAD SOLICITADA", type: "number", required: true }, ...description()]),
    report("credit-increase", "AUMENTO DE CREDITO", [{ key: "currentAmount", label: "CANTIDAD ACTUAL", type: "number", required: true }, { key: "requestedAmount", label: "CANTIDAD SOLICITADA", type: "number", required: true }, ...description()]),
    report("missing-invoices", "NO LLEGAN FACTURAS", [{ key: "invoiceEmail", label: "CORREO ELECTRONICO PARA RECIBIR FACTURAS", type: "email", required: true }, ...description()]),
    report("invoice-differences", "DIFERENCIAS EN FACTURAS"), report("credit-other", "OTRO"),
  ]},
  { id: "equipment", name: "EQUIPOS Y ACTIVOS", active: true, reports: [report("cooling-followup", "SEGUIMIENTO DE FOLIOS EQUIPOS DE ENFRIAMIENTO BEES", [{ key: "beesFolio", label: "FOLIO LEVANTADO EN LA APP DE BEES", type: "text", required: true }, ...description()]), report("equipment-other", "OTRO")] },
  { id: "stock", name: "STOCK Y CATALOGO", active: true, reports: [report("unavailable-product", "PRODUCTO NO DISPONIBLE"), report("wrong-price", "PRECIO INCORRECTO"), report("stock-three-days", "PRODUCTO SIN STOCK MAS DE 3 DIAS"), report("stock-other", "OTRO")] },
];
