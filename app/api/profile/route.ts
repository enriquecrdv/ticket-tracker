import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";

export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { chain: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  return NextResponse.json({ name: user.name, email: user.email, role: user.role, chain: user.chain?.name ?? null });
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Tu sesión expiró. Inicia sesión nuevamente." }, { status: 401 });
  const parsed = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(100) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." });
}
