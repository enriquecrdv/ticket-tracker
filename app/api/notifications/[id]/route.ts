import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.notification.updateMany({ where: { id, recipientId: session.user.id }, data: { read: true } });
  if (!result.count) return NextResponse.json({ error: "Notificación no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
