import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";
import { ticketInclude, toClientTicket, toStaffTicket } from "@/lib/ticket-mappers";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  const parsed = z.object({ message: z.string().trim().min(1).max(5000) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Respuesta inválida." }, { status: 400 });

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(session.user.role === "ANALISTA" ? { assignedToId: session.user.id } : {}),
      comments: { create: { message: parsed.data.message, authorId: session.user.id } },
      history: { create: { action: "COMENTARIO", detail: "Se agregó una respuesta.", userId: session.user.id } },
    },
    include: ticketInclude,
  });
  return NextResponse.json(session.user.role === "CLIENTE" ? toClientTicket(ticket) : toStaffTicket(ticket));
}
