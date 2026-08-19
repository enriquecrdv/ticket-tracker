import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";
import { ticketInclude, toStaffTicket } from "@/lib/ticket-mappers";

const statusMap = {
  pendiente: "PENDIENTE",
  seguimiento: "EN_PROGRESO",
  espera_cliente: "ESPERA_CLIENTE",
  cerrado: "CERRADO",
} as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const parsed = z.object({ status: z.enum(["pendiente", "seguimiento", "espera_cliente", "cerrado"]).optional(), assignedToId: z.string().min(1).nullable().optional(), customerNumber: z.string().regex(/^\d{9}$/).optional(), customerName: z.string().trim().min(2).max(150).optional() }).refine((data) => data.status || data.customerNumber || data.assignedToId !== undefined, "Sin cambios").safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos. El código debe tener 9 dígitos." }, { status: 400 });

  const current = await prisma.ticket.findUniqueOrThrow({ where: { id } });
  if (parsed.data.assignedToId !== undefined && session.user.role !== "ADMIN") return NextResponse.json({ error: "Solo administración puede reasignar folios." }, { status: 403 });
  if (parsed.data.assignedToId) {
    const analyst = await prisma.user.findFirst({ where: { id: parsed.data.assignedToId, role: "ANALISTA", active: true }, select: { id: true } });
    if (!analyst) return NextResponse.json({ error: "El analista seleccionado no está disponible." }, { status: 400 });
  }
  let clientId: string | undefined;
  if (parsed.data.customerNumber) {
    let client = await prisma.client.findUnique({ where: { customerNumber: parsed.data.customerNumber } });
    if (!client) {
      if (!parsed.data.customerName) return NextResponse.json({ error: "Indica el nombre para guardar el nuevo código." }, { status: 400 });
      client = await prisma.client.create({ data: { customerNumber: parsed.data.customerNumber, name: parsed.data.customerName, chainId: current.chainId } });
    }
    clientId = client.id;
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: statusMap[parsed.data.status] } : {}),
      ...(clientId ? { clientId } : {}),
      ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId } : session.user.role === "ANALISTA" ? { assignedToId: session.user.id } : {}),
      ...(parsed.data.status ? { closedAt: parsed.data.status === "cerrado" ? new Date() : null } : {}),
      history: {
        create: {
          action: parsed.data.customerNumber ? "ACTUALIZADO" : "CAMBIO_ESTADO",
          detail: parsed.data.customerNumber ? `Número de cliente asignado: ${parsed.data.customerNumber}.` : parsed.data.assignedToId !== undefined ? "Folio reasignado por administración." : `Estado actualizado a ${parsed.data.status}.`,
          userId: session.user.id,
        },
      },
    },
    include: ticketInclude,
  });

  return NextResponse.json(toStaffTicket(ticket));
}
