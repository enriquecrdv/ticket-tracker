import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { hasAllowedOrigin, strongPasswordSchema } from "@/lib/security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  const parsed = z.object({ active: z.boolean().optional(), password: strongPasswordSchema.optional(), chainIds: z.array(z.string().min(1)).max(100).optional() }).refine((value) => value.active !== undefined || value.password || value.chainIds !== undefined, "Sin cambios").safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos. Las contraseñas requieren 12 caracteres, mayúscula, minúscula, número y símbolo." }, { status: 400 });
  if (id === session.user.id && parsed.data.active === false) return NextResponse.json({ error: "No puedes desactivar tu propia cuenta." }, { status: 400 });
  const current = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!current) return NextResponse.json({ error: "El usuario no existe." }, { status: 404 });
  if (parsed.data.chainIds !== undefined && current.role !== "ANALISTA") return NextResponse.json({ error: "Las cadenas solo pueden asignarse a analistas." }, { status: 400 });
  if (parsed.data.chainIds?.length) {
    const count = await prisma.chain.count({ where: { id: { in: parsed.data.chainIds }, active: true } });
    if (count !== new Set(parsed.data.chainIds).size) return NextResponse.json({ error: "Una o más cadenas no existen o están inactivas." }, { status: 400 });
  }
  const user = await prisma.user.update({ where: { id }, data: { ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}), ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) } : {}), ...(parsed.data.chainIds !== undefined ? { assignedChains: { set: parsed.data.chainIds.map((chainId) => ({ id: chainId })) } } : {}) }, include: { assignedChains: { select: { id: true, name: true }, orderBy: { name: "asc" } } } });
  return NextResponse.json({ ok: true, assignedChains: user.assignedChains });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const { id } = await context.params;
  if (id === session.user.id) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
