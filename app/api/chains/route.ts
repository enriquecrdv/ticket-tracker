import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/server-auth";

const toUiChain = (chain: { id: string; name: string; description: string | null; active: boolean; createdAt: Date; _count?: { clients: number; tickets: number }; clients?: Array<{ customerNumber: string; name: string }>; commercialCondition?: Record<string, string | Date | null> | null }) => ({
  id: chain.id,
  nombre: chain.name,
  descripcion: chain.description ?? "",
  activa: chain.active,
  createdAt: chain.createdAt.toISOString(),
  clientCount: chain._count?.clients ?? 0,
  ticketCount: chain._count?.tickets ?? 0,
  clients: chain.clients ?? [],
  commercial: chain.commercialCondition ? Object.fromEntries(Object.entries(chain.commercialCondition).filter(([key]) => !["id", "chainId", "createdAt", "updatedAt"].includes(key)).map(([key, value]) => [key, value ?? ""])) : undefined,
});

export async function GET() {
  const session = await requireUser();
  if (!session || session.user.role === "CLIENTE") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const chains = await prisma.chain.findMany({
    include: {
      _count: { select: { clients: true, tickets: true } },
      clients: { select: { customerNumber: true, name: true }, orderBy: { name: "asc" }, take: 5 },
      commercialCondition: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(chains.map(toUiChain));
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = z.object({ nombre: z.string().trim().min(1).max(120), descripcion: z.string().trim().max(5000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos de cadena inválidos." }, { status: 400 });
  try {
    const chain = await prisma.chain.create({ data: { name: parsed.data.nombre, description: parsed.data.descripcion || null } });
    return NextResponse.json(toUiChain(chain), { status: 201 });
  } catch {
    return NextResponse.json({ error: "La cadena ya existe." }, { status: 409 });
  }
}
