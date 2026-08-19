import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const parsed = z.object({ active: z.boolean() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  if (id === session.user.id && !parsed.data.active) return NextResponse.json({ error: "No puedes desactivar tu propia cuenta." }, { status: 400 });
  await prisma.user.update({ where: { id }, data: { active: parsed.data.active } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  if (id === session.user.id) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
