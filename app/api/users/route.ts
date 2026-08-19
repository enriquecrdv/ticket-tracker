import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

const toUiUser = (user: { id: string; name: string; email: string; role: string; active: boolean; createdAt: Date }) => ({
  id: user.id,
  nombre: user.name,
  email: user.email,
  role: user.role === "ADMIN" ? "admin" : "analista",
  activo: user.active,
  createdAt: user.createdAt.toISOString(),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const users = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "ANALISTA"] } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(users.map(toUiUser));
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = z.object({
    nombre: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(191),
    password: z.string().min(8).max(100),
    role: z.enum(["admin", "analista"]),
  }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos de usuario inválidos." }, { status: 400 });

  try {
    const user = await prisma.user.create({ data: {
      name: parsed.data.nombre,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role === "admin" ? "ADMIN" : "ANALISTA",
    } });
    return NextResponse.json(toUiUser(user), { status: 201 });
  } catch {
    return NextResponse.json({ error: "El correo ya está registrado." }, { status: 409 });
  }
}
