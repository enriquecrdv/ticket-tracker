import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

const commercialSchema = z.object({
  credit: z.string().max(100), contract: z.string().max(100), guarantee: z.string().max(100),
  collection: z.string().max(100), collectionPortal: z.string().max(100), segment: z.string().max(50),
  priceList: z.string().max(50), discount: z.string().max(100), promoList: z.string().max(100),
  continent: z.string().max(50), scheme: z.string().max(50), creditDays: z.string().max(50),
  pinc: z.string().max(100), cashAndCredit: z.string().max(100), comments: z.string().max(5000),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const parsed = z.object({ nombre: z.string().trim().min(1).max(120).optional(), descripcion: z.string().trim().max(5000).optional(), active: z.boolean().optional(), commercial: commercialSchema.optional() }).refine((value) => Object.keys(value).length > 0, "Sin cambios").safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  await prisma.chain.update({ where: { id }, data: {
    ...(parsed.data.nombre ? { name: parsed.data.nombre } : {}),
    ...(parsed.data.descripcion !== undefined ? { description: parsed.data.descripcion || null } : {}),
    ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    ...(parsed.data.commercial ? { commercialCondition: { upsert: { create: parsed.data.commercial, update: parsed.data.commercial } } } : {}),
  } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const parsed = z.object({ confirmation: z.string(), phrase: z.literal("ELIMINAR") }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Escribe ELIMINAR y el nombre exacto de la cadena." }, { status: 400 });
  const chain = await prisma.chain.findUnique({ where: { id }, select: { name: true, _count: { select: { clients: true, tickets: true } } } });
  if (!chain) return NextResponse.json({ error: "La cadena no existe." }, { status: 404 });
  if (parsed.data.confirmation !== chain.name) return NextResponse.json({ error: "El nombre de confirmación no coincide." }, { status: 400 });
  const attachments = await prisma.attachment.findMany({ where: { ticket: { chainId: id } }, select: { storageKey: true } });
  await prisma.$transaction(async (transaction) => {
    await transaction.user.updateMany({ where: { chainId: id }, data: { chainId: null } });
    await transaction.ticket.deleteMany({ where: { chainId: id } });
    await transaction.client.deleteMany({ where: { chainId: id } });
    await transaction.branch.deleteMany({ where: { chainId: id } });
    await transaction.chain.delete({ where: { id } });
  });
  await Promise.allSettled(attachments.map((attachment) => unlink(path.join(process.cwd(), "storage", "uploads", attachment.storageKey))));
  return NextResponse.json({ ok: true, removedClients: chain._count.clients, removedTickets: chain._count.tickets });
}
