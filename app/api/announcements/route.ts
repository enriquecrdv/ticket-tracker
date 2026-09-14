import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/server-auth";

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(4000),
  audience: z.enum(["TODOS", "CLIENTES", "ANALISTAS"]),
  chainId: z.string().min(1).nullable().optional(),
  analystId: z.string().min(1).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
}).refine((value) => !value.endsAt || value.endsAt > value.startsAt, { message: "La fecha final debe ser posterior al inicio.", path: ["endsAt"] });

const include = {
  createdBy: { select: { name: true } },
  chain: { select: { name: true } },
  analyst: { select: { name: true } },
} as const;

export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Inicia sesión para consultar comunicados." }, { status: 401 });
  const now = new Date();
  const isAdmin = session.user.role === "ADMIN";
  const audience = session.user.role === "CLIENTE" ? ["TODOS", "CLIENTES"] : ["TODOS", "ANALISTAS"];
  const targeting = session.user.role === "CLIENTE"
    ? { AND: [{ OR: [{ chainId: null }, { chainId: session.user.chainId ?? "__none__" }] }, { analystId: null }] }
    : { AND: [{ chainId: null }, { OR: [{ analystId: null }, { analystId: session.user.id }] }] };
  const items = await prisma.announcement.findMany({
    where: isAdmin ? {} : { active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }], audience: { in: audience }, ...targeting },
    include,
    orderBy: [{ active: "desc" }, { startsAt: "desc" }],
    take: isAdmin ? 100 : 20,
  });
  return NextResponse.json(items.map((item) => ({ id: item.id, title: item.title, message: item.message, audience: item.audience, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt?.toISOString() ?? null, active: item.active, createdAt: item.createdAt.toISOString(), sender: item.createdBy.name, chain: item.chain?.name ?? null, analyst: item.analyst?.name ?? null })));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Solo administración puede publicar comunicados." }, { status: 403 });
  const parsed = announcementSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa los datos del comunicado." }, { status: 400 });
  const data = parsed.data;
  if (data.audience === "CLIENTES" && data.analystId) return NextResponse.json({ error: "Un comunicado para clientes no puede dirigirse a un analista." }, { status: 400 });
  if (data.audience === "ANALISTAS" && data.chainId) return NextResponse.json({ error: "Un comunicado para analistas no puede dirigirse a una cadena." }, { status: 400 });
  if (data.chainId && !(await prisma.chain.findUnique({ where: { id: data.chainId }, select: { id: true } }))) return NextResponse.json({ error: "La cadena seleccionada no existe." }, { status: 404 });
  if (data.analystId && !(await prisma.user.findFirst({ where: { id: data.analystId, role: "ANALISTA", active: true }, select: { id: true } }))) return NextResponse.json({ error: "El analista seleccionado no existe o está bloqueado." }, { status: 404 });
  const item = await prisma.announcement.create({ data: { title: data.title, message: data.message, audience: data.audience, chainId: data.audience === "CLIENTES" ? data.chainId ?? null : null, analystId: data.audience === "ANALISTAS" ? data.analystId ?? null : null, startsAt: data.startsAt, endsAt: data.endsAt ?? null, createdById: session.user.id }, include });
  return NextResponse.json({ id: item.id }, { status: 201 });
}
