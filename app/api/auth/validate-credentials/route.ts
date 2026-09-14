import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientAddress, consumeRateLimit, hasAllowedOrigin } from "@/lib/security";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const rate = consumeRateLimit(`credential-check:${clientAddress(request.headers)}`, 10, 15 * 60_000);
  if (!rate.allowed) return NextResponse.json(
    { code: "TOO_MANY_ATTEMPTS", error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." },
    { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
  );
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_FORMAT", error: "Escribe un correo válido y tu contraseña." }, { status: 400 });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, include: { chain: true } });

    const fallbackHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5dA7zqv3YjrK66nKQKmYC8h6WJ0V5eS";
    const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? fallbackHash);
    if (!user || !user.active || !valid) return NextResponse.json(
      { code: "INVALID_CREDENTIALS", error: "El correo o la contraseña no son correctos." },
      { status: 401 },
    );
    if (user.role === "CLIENTE" && !user.chainId) {
      return NextResponse.json({ code: "NO_CHAIN", error: "El usuario existe, pero no tiene una cadena asignada." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, role: user.role, chain: user.chain?.name ?? null });
  } catch {
    return NextResponse.json({ code: "SERVICE_UNAVAILABLE", error: "El servicio de acceso no está disponible temporalmente." }, { status: 503 });
  }
}
