import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";
import { ticketInclude, toClientTicket, toStaffTicket } from "@/lib/ticket-mappers";
import { DEFAULT_REPORT_CATALOG, type ReportCategory } from "@/lib/report-catalog";

const ticketSchema = z.object({
  customerNumber: z.union([z.string().trim().regex(/^\d{9}$/), z.literal("")]),
  branch: z.string().trim().min(1).max(150),
  storeName: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(150),
  subcategory: z.string().trim().min(1).max(150),
  impact: z.enum(["low", "medium", "high"]),
  description: z.string().trim().min(5).max(5000),
  openingDate: z.coerce.date(),
  confirmNewClient: z.enum(["true", "false"]).default("false"),
}).refine((data) => data.category === "Alta de clientes" || /^\d{9}$/.test(data.customerNumber), { message: "El código debe tener 9 dígitos.", path: ["customerNumber"] });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const session = await requireUser();

  if (!session) {
    return NextResponse.json({ error: "Inicia sesión para consultar tickets." }, { status: 401 });
  }

  const isClient = session.user.role === "CLIENTE";
  if (isClient && !session.user.chainId) return NextResponse.json({ error: "La cuenta no está vinculada a una cadena." }, { status: 403 });

  const tickets = await prisma.ticket.findMany({
    where: isClient
      ? {
          chainId: session.user.chainId!,
          ...(query ? { OR: [{ folio: query }, { client: { customerNumber: query } }] } : {}),
        }
      : undefined,
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
    take: isClient ? 50 : 200,
  });

  return NextResponse.json(
    isClient ? tickets.map(toClientTicket) : tickets.map(toStaffTicket),
  );
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (session?.user.role !== "CLIENTE" || !session.user.chainId) {
    return NextResponse.json({ error: "Inicia sesión como cliente." }, { status: 401 });
  }
  const formData = await request.formData();
  const parsed = ticketSchema.safeParse(Object.fromEntries(
    [...formData.entries()].filter(([, value]) => typeof value === "string"),
  ));

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos del ticket inválidos." }, { status: 400 });
  }

  const data = parsed.data;
  const files = [...formData.entries()].filter(([, value]) => value instanceof File) as [string, File][];
  const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".eml", ".msg", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
  const invalidFile = files.find(([, file]) => !file.size || !allowedExtensions.has(path.extname(file.name).toLowerCase()));
  if (invalidFile) return NextResponse.json({ error: `El archivo ${invalidFile[1].name} no es un documento, correo o imagen permitido.` }, { status: 400 });
  if (files.reduce((total, [, file]) => total + file.size, 0) > 200 * 1024 * 1024) return NextResponse.json({ error: "El total de archivos no puede superar 200 MB." }, { status: 400 });
  const isAccountRequest = data.category === "Alta de clientes";
  if (!isAccountRequest) {
    const setting = await prisma.appSetting.findUnique({ where: { key: "report-catalog" } });
    const catalog = (setting?.value ?? DEFAULT_REPORT_CATALOG) as unknown as ReportCategory[];
    const category = catalog.find((item) => item.active && item.name === data.category);
    const report = category?.reports.find((item) => item.active && item.name === data.subcategory);
    if (!report) return NextResponse.json({ error: "La categoria o tipo de reporte ya no esta disponible. Actualiza la pagina." }, { status: 400 });
    const values = Object.fromEntries(data.description.split("\n").map((line) => { const index = line.indexOf(":"); return index < 0 ? ["", ""] : [line.slice(0, index), line.slice(index + 1).trim()]; }));
    const invalidField = report.fields.find((field) => (field.required && !values[field.label]) || (field.digits && values[field.label]?.length !== field.digits));
    if (invalidField) return NextResponse.json({ error: `Revisa el campo ${invalidField.label}.` }, { status: 400 });
  }
  if (isAccountRequest && data.customerNumber) {
    return NextResponse.json({ error: "Una solicitud de alta no debe incluir un código de cliente existente." }, { status: 400 });
  }
  if (isAccountRequest) {
    if (!/^[A-Z0-9 ]+$/.test(data.branch) || !/^[A-Z0-9 :\.\-\n]+$/.test(data.description)) {
      return NextResponse.json({ error: "El formato de alta solo admite mayúsculas sin acentos ni caracteres especiales." }, { status: 400 });
    }
    const requiredDocuments = [
      ["ine", "INE o pasaporte"],
      ["comprobante-domicilio", "comprobante de domicilio"],
      ["constancia-fiscal", "constancia de situación fiscal"],
    ] as const;
    const missing = requiredDocuments.find(([key]) => !(formData.get(key) instanceof File));
    if (missing) return NextResponse.json({ error: `Falta adjuntar: ${missing[1]}.` }, { status: 400 });
  }
  const code = data.branch.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 40);
  const level = { low: "BAJO", medium: "MEDIO", high: "ALTO" } as const;

  const chain = await prisma.chain.findUnique({ where: { id: session.user.chainId } });
  if (!chain?.active) return NextResponse.json({ error: "Cadena inactiva." }, { status: 403 });
  const branch = await prisma.branch.upsert({
    where: { chainId_code: { chainId: chain.id, code } },
    update: { name: data.branch, active: true },
    create: { chainId: chain.id, code, name: data.branch },
  });
  const pendingHigh = isAccountRequest;
  const accountCode = pendingHigh ? `ALTA-${chain.id.slice(-12)}` : data.customerNumber;
  let client = await prisma.client.findFirst({ where: { chainId: chain.id, customerNumber: accountCode, active: true } });
  if (!client) {
    if (!pendingHigh && data.confirmNewClient !== "true") return NextResponse.json({ error: "Confirma el nombre del nuevo cliente antes de continuar." }, { status: 409 });
    client = await prisma.client.create({ data: { customerNumber: accountCode, name: data.branch, chainId: chain.id } });
  }

  const ticket = await prisma.ticket.create({
    data: {
      folio: `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
      title: `${data.category} - ${client.name}`,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      impact: level[data.impact],
      priority: level[data.impact],
      openingDate: data.openingDate,
      clientId: client.id,
      chainId: chain.id,
      branchId: branch.id,
      createdByUserId: session.user.id,
      history: { create: { action: "CREADO", detail: "Ticket creado por el cliente.", userId: session.user.id } },
    },
    include: ticketInclude,
  });

  const uploadDirectory = path.join(process.cwd(), "storage", "uploads");

  for (const [, file] of files) {
    await mkdir(uploadDirectory, { recursive: true });
    const storageKey = `${ticket.id}-${randomUUID()}${path.extname(file.name)}`;
    await writeFile(path.join(uploadDirectory, storageKey), Buffer.from(await file.arrayBuffer()));
    await prisma.attachment.create({
      data: { ticketId: ticket.id, originalName: file.name, storageKey, mimeType: file.type, sizeBytes: file.size },
    });
  }

  return NextResponse.json(toClientTicket(ticket), { status: 201 });
}
