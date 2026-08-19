import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

const clientSchema = z.object({ code: z.string().regex(/^\d{9}$/), name: z.string().trim().min(2).max(150) });
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const clients = await prisma.client.findMany({ where: { chainId: id }, select: { id: true, customerNumber: true, name: true, active: true }, orderBy: { name: "asc" } });
  return NextResponse.json(clients);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  if (!(await prisma.chain.findUnique({ where: { id }, select: { id: true } }))) return NextResponse.json({ error: "La cadena no existe." }, { status: 404 });
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const parsed = clientSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "El código debe tener 9 dígitos y un nombre válido." }, { status: 400 });
    const existing = await prisma.client.findUnique({ where: { customerNumber: parsed.data.code } });
    if (existing && existing.chainId !== id) return NextResponse.json({ error: "El código ya pertenece a otra cadena." }, { status: 409 });
    const client = existing ? await prisma.client.update({ where: { id: existing.id }, data: { name: parsed.data.name.toUpperCase(), active: true } }) : await prisma.client.create({ data: { chainId: id, customerNumber: parsed.data.code, name: parsed.data.name.toUpperCase() } });
    return NextResponse.json(client, { status: 201 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: "Selecciona un archivo Excel .xlsx con columnas CODIGO y NOMBRE." }, { status: 400 });
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = Buffer.from(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(excelBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return NextResponse.json({ error: "El archivo Excel no contiene hojas." }, { status: 400 });
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => headers.set(cell.text.trim().toUpperCase(), column));
  const codeColumn = headers.get("CODIGO") ?? headers.get("CÓDIGO");
  const nameColumn = headers.get("NOMBRE");
  if (!codeColumn || !nameColumn) return NextResponse.json({ error: "La primera fila debe contener las columnas CODIGO y NOMBRE." }, { status: 400 });
  const rows: Array<{ code: string; name: string; row: number }> = [];
  sheet.eachRow((row, rowNumber) => { if (rowNumber === 1) return; const rawCode = row.getCell(codeColumn).text.trim().replace(/\D/g, ""); const code = rawCode.padStart(9, "0"); const name = row.getCell(nameColumn).text.trim().toUpperCase(); if (rawCode || name) rows.push({ code, name, row: rowNumber }); });
  const invalid = rows.find((item) => !/^\d{9}$/.test(item.code) || item.name.length < 2);
  if (invalid) return NextResponse.json({ error: `Revisa la fila ${invalid.row}: código de 9 dígitos y nombre son obligatorios.` }, { status: 400 });
  const duplicates = await prisma.client.findMany({ where: { customerNumber: { in: rows.map((item) => item.code) }, chainId: { not: id } }, select: { customerNumber: true } });
  if (duplicates.length) return NextResponse.json({ error: `Hay códigos vinculados a otra cadena: ${duplicates.slice(0, 5).map((item) => item.customerNumber).join(", ")}.` }, { status: 409 });
  await prisma.$transaction(rows.map((item) => prisma.client.upsert({ where: { customerNumber: item.code }, update: { name: item.name, active: true }, create: { chainId: id, customerNumber: item.code, name: item.name } })));
  return NextResponse.json({ imported: rows.length });
}
