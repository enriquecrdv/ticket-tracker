import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_FORMAT", error: "Escribe un correo válido y tu contraseña." }, { status: 400 });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, include: { chain: true } });

    if (!user) {
      return NextResponse.json({ code: "USER_NOT_FOUND", error: "No encontramos un usuario registrado con ese correo." }, { status: 404 });
    }
    if (!user.active) {
      return NextResponse.json({ code: "USER_BLOCKED", error: "La cuenta está bloqueada. Contacta al administrador." }, { status: 403 });
    }
    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ code: "WRONG_PASSWORD", error: "La contraseña es incorrecta." }, { status: 401 });
    }
    if (user.role === "CLIENTE" && !user.chainId) {
      return NextResponse.json({ code: "NO_CHAIN", error: "El usuario existe, pero no tiene una cadena asignada." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, role: user.role, chain: user.chain?.name ?? null });
  } catch (error) {
    console.error("Error validando credenciales:", error instanceof Error ? error.message : error);
    return NextResponse.json({ code: "DATABASE_ERROR", error: "No fue posible consultar los usuarios. Verifica que MySQL de XAMPP esté iniciado." }, { status: 503 });
  }
}
