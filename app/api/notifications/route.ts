import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/server-auth";

export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const notifications = await prisma.notification.findMany({ where: { recipientId: session.user.id }, include: { sender: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json(notifications.map((item) => ({ id: item.id, message: item.message, read: item.read, sender: item.sender?.name ?? "Sistema", createdAt: item.createdAt.toISOString() })));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Solo administración puede enviar notificaciones." }, { status: 403 });
  const parsed = z.object({ recipientId: z.string().min(1), message: z.string().trim().min(3).max(2000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Escribe un mensaje válido." }, { status: 400 });
  const recipient = await prisma.user.findFirst({ where: { id: parsed.data.recipientId, role: "ANALISTA", active: true }, select: { id: true } });
  if (!recipient) return NextResponse.json({ error: "El analista no existe o está bloqueado." }, { status: 404 });
  const notification = await prisma.notification.create({ data: { recipientId: recipient.id, senderId: session.user.id, message: parsed.data.message } });
  return NextResponse.json({ id: notification.id }, { status: 201 });
}
