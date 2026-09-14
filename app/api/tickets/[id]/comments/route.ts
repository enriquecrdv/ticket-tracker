import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";
import { ticketInclude, toClientTicket, toStaffTicket } from "@/lib/ticket-mappers";
import { hasAllowedOrigin } from "@/lib/security";

async function findAuthorizedTicket(id: string, role: string, userId: string, chainId?: string | null) {
  return prisma.ticket.findFirst({
    where: {
      id,
      ...(role === "CLIENTE" ? { chainId: chainId ?? "" } : {}),
      ...(role === "ANALISTA" ? { assignedToId: userId } : {}),
    },
    include: ticketInclude,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  const ticket = await findAuthorizedTicket(id, session.user.role, session.user.id, session.user.chainId);
  if (!ticket) return NextResponse.json({ error: "El folio no existe o no pertenece a tu cadena." }, { status: 404 });
  return NextResponse.json(
    session.user.role === "CLIENTE" ? toClientTicket(ticket) : toStaffTicket(ticket),
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasAllowedOrigin(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = z.object({ message: z.string().trim().min(1).max(5000) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });

  const existing = await prisma.ticket.findFirst({
    where: {
      id,
      ...(session.user.role === "CLIENTE" ? { chainId: session.user.chainId ?? "" } : {}),
    },
    select: { id: true, status: true, assignedToId: true },
  });
  if (!existing) return NextResponse.json({ error: "El folio no existe o no pertenece a tu cadena." }, { status: 404 });
  if (session.user.role === "ANALISTA" && existing.assignedToId !== session.user.id) return NextResponse.json({ error: "Solo puedes responder folios asignados a ti." }, { status: 403 });

  try {
    const ticket = await prisma.ticket.update({
      where: { id: existing.id },
      data: {
        ...(session.user.role === "ANALISTA" ? { assignedToId: session.user.id } : {}),
        ...(session.user.role === "CLIENTE" && existing.status === "ESPERA_CLIENTE" ? { status: "EN_PROGRESO" } : {}),
        comments: { create: { message: parsed.data.message, authorId: session.user.id } },
        history: { create: { action: "COMENTARIO", detail: "Se agregó una respuesta.", userId: session.user.id } },
      },
      include: ticketInclude,
    });
    return NextResponse.json(session.user.role === "CLIENTE" ? toClientTicket(ticket) : toStaffTicket(ticket));
  } catch {
    return NextResponse.json({ error: "No fue posible guardar el comentario. Intenta nuevamente." }, { status: 500 });
  }
}
