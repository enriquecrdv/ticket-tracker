import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/server-auth";
import { DEFAULT_REPORT_CATALOG, mergeReportCatalog, type ReportCategory } from "@/lib/report-catalog";

const field = z.object({ key: z.string().min(1).max(80), label: z.string().min(1).max(150), type: z.enum(["text", "date", "email", "number"]), required: z.boolean(), digits: z.number().int().positive().max(30).optional() });
const report = z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(150), active: z.boolean(), fields: z.array(field).min(1).max(20) });
const catalogSchema = z.array(z.object({ id: z.string().min(1).max(80), name: z.string().min(1).max(150), active: z.boolean(), reports: z.array(report).min(1).max(50) })).min(1).max(30);

export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: "Inicia sesion para consultar el catalogo." }, { status: 401 });
  const setting = await prisma.appSetting.findUnique({ where: { key: "report-catalog" } });
  return NextResponse.json(setting?.value ? mergeReportCatalog(setting.value as unknown as ReportCategory[]) : DEFAULT_REPORT_CATALOG);
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Solo un administrador puede editar el catalogo." }, { status: 403 });
  const parsed = catalogSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "El catalogo contiene categorias, reportes o campos invalidos." }, { status: 400 });
  await prisma.appSetting.upsert({ where: { key: "report-catalog" }, update: { value: parsed.data }, create: { key: "report-catalog", value: parsed.data } });
  return NextResponse.json(parsed.data);
}
