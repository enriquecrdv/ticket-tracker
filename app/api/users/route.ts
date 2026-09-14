import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";
import { hasAllowedOrigin, strongPasswordSchema } from "@/lib/security";

const toUiUser = (user: { id: string; name: string; email: string; role: string; active: boolean; createdAt: Date; chain?: { name: string } | null; client?: { customerNumber: string } | null; assignedChains?: Array<{ id: string; name: string }> }) => ({
  id: user.id,
  nombre: user.name,
  email: user.email,
  role: user.role === "ADMIN" ? "admin" : user.role === "CLIENTE" ? "cliente" : "analista",
  activo: user.active,
  createdAt: user.createdAt.toISOString(),
  chain: user.chain?.name,
  customerNumber: user.client?.customerNumber,
  assignedChains: user.assignedChains ?? [],
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const users = await prisma.user.findMany({ include: { chain: { select: { name: true } }, client: { select: { customerNumber: true } }, assignedChains: { select: { id: true, name: true }, orderBy: { name: "asc" } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(users.map(toUiUser));
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({
    nombre: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(191),
    password: strongPasswordSchema,
    role: z.enum(["admin", "analista"]),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos. La contraseña debe tener 12 caracteres, mayúscula, minúscula, número y símbolo." }, { status: 400 });

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
