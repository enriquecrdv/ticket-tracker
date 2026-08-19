import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const chain = await prisma.chain.findUnique({ where: { id }, include: { clients: { orderBy: { name: "asc" } }, commercialCondition: true } });
  if (!chain) return NextResponse.json({ error: "Cadena no encontrada." }, { status: 404 });
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("CLIENTES Y CONDICIONES", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [{ header: "CADENA", key: "chain", width: 25 }, { header: "CODIGO", key: "code", width: 15 }, { header: "NOMBRE", key: "name", width: 35 }, { header: "ACTIVO", key: "active", width: 12 }, { header: "CREDITO", key: "credit", width: 18 }, { header: "CONTRATO", key: "contract", width: 18 }, { header: "GARANTIA", key: "guarantee", width: 18 }, { header: "COBRANZA", key: "collection", width: 22 }, { header: "PORTAL COBRANZA", key: "portal", width: 20 }, { header: "SEGMENTO", key: "segment", width: 14 }, { header: "LISTA PRECIOS", key: "price", width: 18 }, { header: "DESCUENTO", key: "discount", width: 18 }, { header: "DIAS CREDITO", key: "days", width: 16 }, { header: "PINC", key: "pinc", width: 20 }, { header: "CASH & CREDIT", key: "cash", width: 20 }, { header: "COMENTARIOS", key: "comments", width: 45 }];
  chain.clients.forEach((client) => sheet.addRow({ chain: chain.name, code: client.customerNumber, name: client.name, active: client.active ? "SI" : "NO", credit: chain.commercialCondition?.credit ?? "", contract: chain.commercialCondition?.contract ?? "", guarantee: chain.commercialCondition?.guarantee ?? "", collection: chain.commercialCondition?.collection ?? "", portal: chain.commercialCondition?.collectionPortal ?? "", segment: chain.commercialCondition?.segment ?? "", price: chain.commercialCondition?.priceList ?? "", discount: chain.commercialCondition?.discount ?? "", days: chain.commercialCondition?.creditDays ?? "", pinc: chain.commercialCondition?.pinc ?? "", cash: chain.commercialCondition?.cashAndCredit ?? "", comments: chain.commercialCondition?.comments ?? "" }));
  sheet.autoFilter = { from: "A1", to: "P1" }; sheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532D" } }; cell.alignment = { wrapText: true, horizontal: "center" }; }); sheet.getRow(1).height = 32; sheet.eachRow((row, index) => { if (index > 1) row.alignment = { vertical: "top", wrapText: true }; });
  const buffer = await workbook.xlsx.writeBuffer(); return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${chain.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-clientes.xlsx"` } });
}
