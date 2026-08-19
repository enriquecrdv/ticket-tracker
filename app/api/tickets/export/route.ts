import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";

const requestSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(200), mode: z.enum(["altas", "all"]).default("altas") });

function fieldsFromDescription(description: string) {
  return Object.fromEntries(description.split("\n").map((line) => {
    const separator = line.indexOf(":");
    return separator === -1 ? ["", ""] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session || session.user.role === "CLIENTE") return NextResponse.json({ error: "No tienes permiso para exportar altas." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Selecciona al menos un folio válido para exportar." }, { status: 400 });

  const tickets = await prisma.ticket.findMany({
    where: { id: { in: parsed.data.ids }, ...(parsed.data.mode === "altas" ? { category: "Alta de clientes" } : {}) },
    include: { chain: true, client: true, assignedTo: true, attachments: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  if (!tickets.length) return NextResponse.json({ error: "Los filtros actuales no contienen folios exportables." }, { status: 404 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ticket Tracker";
  workbook.created = new Date();
  if (parsed.data.mode === "all") {
    const reportSheet = workbook.addWorksheet("REPORTE DE FOLIOS", { views: [{ state: "frozen", ySplit: 1 }] });
    reportSheet.columns = [
      { header: "FOLIO", key: "folio", width: 20 }, { header: "CADENA", key: "chain", width: 24 }, { header: "CLIENTE", key: "client", width: 28 },
      { header: "CATEGORIA", key: "category", width: 28 }, { header: "REPORTE", key: "subcategory", width: 32 }, { header: "ESTADO", key: "status", width: 18 },
      { header: "ANALISTA", key: "analyst", width: 24 }, { header: "PRIORIDAD", key: "priority", width: 15 }, { header: "FECHA CREACION", key: "createdAt", width: 20 },
      { header: "ULTIMA ACTUALIZACION", key: "updatedAt", width: 22 }, { header: "DIAS SIN ACTUALIZACION", key: "days", width: 23 }, { header: "DESCRIPCION", key: "description", width: 55 },
      { header: "ARCHIVOS", key: "documents", width: 40 },
    ];
    tickets.forEach((ticket) => reportSheet.addRow({ folio: ticket.folio, chain: ticket.chain.name, client: ticket.client.name, category: ticket.category, subcategory: ticket.subcategory, status: ticket.status, analyst: ticket.assignedTo?.name ?? "SIN ASIGNAR", priority: ticket.priority, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt, days: Math.floor((Date.now() - ticket.updatedAt.getTime()) / 86_400_000), description: ticket.description, documents: ticket.attachments.map((item) => item.originalName).join(" | ") }));
    reportSheet.autoFilter = { from: "A1", to: "M1" };
    reportSheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } }; cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; });
    reportSheet.getRow(1).height = 34;
    reportSheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm";
    reportSheet.getColumn("updatedAt").numFmt = "yyyy-mm-dd hh:mm";
    reportSheet.eachRow((row, rowNumber) => { if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true }; });
    const reportBuffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(reportBuffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="reporte-folios-${new Date().toISOString().slice(0, 10)}.xlsx"`, "Cache-Control": "no-store" } });
  }
  const sheet = workbook.addWorksheet("ALTAS DE CLIENTE", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "FOLIO", key: "folio", width: 20 }, { header: "CADENA", key: "chain", width: 24 },
    { header: "TRATAMIENTO", key: "treatment", width: 35 }, { header: "MORAL O FISICA", key: "person", width: 18 },
    { header: "RAZON SOCIAL", key: "legalName", width: 32 }, { header: "NOMBRE SUCURSAL", key: "branch", width: 28 },
    { header: "CALLE", key: "street", width: 32 }, { header: "NUMERO EXTERIOR", key: "exterior", width: 18 },
    { header: "NUMERO INTERIOR", key: "interior", width: 18 }, { header: "COLONIA", key: "neighborhood", width: 25 },
    { header: "CODIGO POSTAL", key: "postalCode", width: 15 }, { header: "MUNICIPIO", key: "municipality", width: 24 },
    { header: "ESTADO REPUBLICA", key: "state", width: 28 }, { header: "RFC", key: "rfc", width: 18 },
    { header: "LATITUD", key: "latitude", width: 15 }, { header: "LONGITUD", key: "longitude", width: 15 },
    { header: "FECHA TENTATIVA APERTURA", key: "openingDate", width: 24 }, { header: "SOLICITUD", key: "request", width: 42 },
    { header: "ESTADO FOLIO", key: "status", width: 18 }, { header: "FECHA FOLIO", key: "createdAt", width: 18 },
    { header: "DOCUMENTOS", key: "documents", width: 45 },
  ];
  for (const ticket of tickets) {
    const data = fieldsFromDescription(ticket.description);
    sheet.addRow({
      folio: ticket.folio, chain: ticket.chain.name, treatment: data.TRATAMIENTO, person: data.PERSONA,
      legalName: data["RAZON SOCIAL"], branch: data["NOMBRE SUCURSAL"], street: data.CALLE,
      exterior: data["NUMERO EXTERIOR"], interior: data["NUMERO INTERIOR"], neighborhood: data.COLONIA,
      postalCode: data["CODIGO POSTAL"], municipality: data.MUNICIPIO, state: data.ESTADO, rfc: data.RFC,
      latitude: data.LATITUD, longitude: data.LONGITUD, openingDate: data["FECHA TENTATIVA DE APERTURA"],
      request: data.SOLICITUD, status: ticket.status, createdAt: ticket.createdAt,
      documents: ticket.attachments.map((attachment) => attachment.originalName).join(" | "),
    });
  }
  sheet.autoFilter = { from: "A1", to: "U1" };
  sheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } }; cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; });
  sheet.getRow(1).height = 34;
  sheet.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm";
  sheet.eachRow((row, rowNumber) => { if (rowNumber > 1) { row.alignment = { vertical: "top", wrapText: true }; if (rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; } });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="altas-clientes-${new Date().toISOString().slice(0, 10)}.xlsx"`, "Cache-Control": "no-store" } });
}
