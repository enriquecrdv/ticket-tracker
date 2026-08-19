import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";
import { ticketInclude, toClientTicket, toStaffTicket } from "@/lib/ticket-mappers";

const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".eml", ".msg", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Inicia sesión para adjuntar archivos." }, { status: 401 });

  const { id } = await context.params;
  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { chainId: true, _count: { select: { attachments: true } }, attachments: { select: { sizeBytes: true } } } });
  if (!ticket) return NextResponse.json({ error: "El ticket no existe." }, { status: 404 });
  if (session.user.role === "CLIENTE" && ticket.chainId !== session.user.chainId) {
    return NextResponse.json({ error: "No tienes permiso para modificar este ticket." }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (!files.length) return NextResponse.json({ error: "Selecciona al menos un archivo." }, { status: 400 });
  const invalid = files.find((file) => !file.size || !allowedExtensions.has(path.extname(file.name).toLowerCase()));
  if (invalid) return NextResponse.json({ error: `El archivo ${invalid.name} no es un documento, correo o imagen permitido.` }, { status: 400 });
  const currentTotal = ticket.attachments.reduce((total, attachment) => total + attachment.sizeBytes, 0);
  const newTotal = files.reduce((total, file) => total + file.size, 0);
  if (currentTotal + newTotal > 200 * 1024 * 1024) return NextResponse.json({ error: "El total acumulado de archivos del ticket no puede superar 200 MB." }, { status: 400 });

  const uploadDirectory = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  for (const file of files) {
    const storageKey = `${id}-${randomUUID()}${path.extname(file.name)}`;
    await writeFile(path.join(uploadDirectory, storageKey), Buffer.from(await file.arrayBuffer()));
    await prisma.attachment.create({ data: { ticketId: id, uploadedById: session.user.id, originalName: file.name, storageKey, mimeType: file.type, sizeBytes: file.size } });
  }

  const updated = await prisma.ticket.findUniqueOrThrow({ where: { id }, include: ticketInclude });
  return NextResponse.json(session.user.role === "CLIENTE" ? toClientTicket(updated) : toStaffTicket(updated));
}
