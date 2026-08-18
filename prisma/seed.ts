import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  HistoryAction,
  PrismaClient,
  TicketLevel,
  TicketStatus,
  UserRole,
} from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL no está configurada.");
}

const connection = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: connection.hostname,
  port: Number(connection.port || 3306),
  user: decodeURIComponent(connection.username),
  password: decodeURIComponent(connection.password),
  database: connection.pathname.replace(/^\//, ""),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const [adminPasswordHash, analystPasswordHash] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Analista123!", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {
      name: "Administrador General",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    create: {
      id: "seed-user-admin",
      name: "Administrador General",
      email: "admin@empresa.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analista@empresa.com" },
    update: {
      name: "Ana Analista",
      passwordHash: analystPasswordHash,
      role: UserRole.ANALISTA,
      active: true,
    },
    create: {
      id: "seed-user-analyst",
      name: "Ana Analista",
      email: "analista@empresa.com",
      passwordHash: analystPasswordHash,
      role: UserRole.ANALISTA,
    },
  });

  const oxxo = await prisma.chain.upsert({
    where: { name: "OXXO" },
    update: { description: "Cadena principal", active: true },
    create: {
      id: "seed-chain-oxxo",
      name: "OXXO",
      description: "Cadena principal",
    },
  });

  const waldos = await prisma.chain.upsert({
    where: { name: "Waldo's" },
    update: { description: "Cadena secundaria", active: true },
    create: {
      id: "seed-chain-waldos",
      name: "Waldo's",
      description: "Cadena secundaria",
    },
  });

  const branchCentro = await prisma.branch.upsert({
    where: { id: "seed-branch-centro" },
    update: { chainId: oxxo.id, active: true },
    create: {
      id: "seed-branch-centro",
      code: "OXXO-CENTRO-01",
      name: "OXXO Centro",
      address: "Av. Principal 100, Centro",
      chainId: oxxo.id,
    },
  });

  const branchNorte = await prisma.branch.upsert({
    where: { id: "seed-branch-norte" },
    update: { chainId: waldos.id, active: true },
    create: {
      id: "seed-branch-norte",
      code: "WALDOS-NORTE-01",
      name: "Waldo's Norte",
      address: "Blvd. Norte 250",
      chainId: waldos.id,
    },
  });

  const clientOne = await prisma.client.upsert({
    where: { customerNumber: "1001" },
    update: { name: "Abarrotes La Esperanza", active: true },
    create: {
      id: "seed-client-1001",
      customerNumber: "1001",
      name: "Abarrotes La Esperanza",
      email: "cliente1001@empresa.com",
      phone: "5551001001",
    },
  });

  const clientTwo = await prisma.client.upsert({
    where: { customerNumber: "1002" },
    update: { name: "Mini Súper del Norte", active: true },
    create: {
      id: "seed-client-1002",
      customerNumber: "1002",
      name: "Mini Súper del Norte",
      email: "cliente1002@empresa.com",
      phone: "5551001002",
    },
  });

  const ticketOne = await prisma.ticket.upsert({
    where: { folio: "TKT-2026-0001" },
    update: {
      assignedToId: analyst.id,
      status: TicketStatus.EN_PROGRESO,
    },
    create: {
      id: "seed-ticket-0001",
      folio: "TKT-2026-0001",
      title: "No aparece pedido en el sistema",
      description: "El cliente reporta que su pedido no aparece reflejado.",
      category: "Entregas y pedidos",
      subcategory: "Pedido retrasado",
      impact: TicketLevel.MEDIO,
      priority: TicketLevel.ALTO,
      status: TicketStatus.EN_PROGRESO,
      clientId: clientOne.id,
      chainId: oxxo.id,
      branchId: branchCentro.id,
      assignedToId: analyst.id,
      createdByUserId: admin.id,
    },
  });

  await prisma.ticket.upsert({
    where: { folio: "TKT-2026-0002" },
    update: {},
    create: {
      id: "seed-ticket-0002",
      folio: "TKT-2026-0002",
      title: "Producto recibido en mal estado",
      description: "Se recibieron envases dañados en la última entrega.",
      category: "Reposición de producto en mal estado",
      subcategory: "Envase dañado",
      impact: TicketLevel.ALTO,
      priority: TicketLevel.ALTO,
      status: TicketStatus.PENDIENTE,
      clientId: clientTwo.id,
      chainId: waldos.id,
      branchId: branchNorte.id,
    },
  });

  await prisma.ticketComment.upsert({
    where: { id: "seed-comment-0001" },
    update: { message: "Estamos revisando el pedido con el área de reparto." },
    create: {
      id: "seed-comment-0001",
      message: "Estamos revisando el pedido con el área de reparto.",
      ticketId: ticketOne.id,
      authorId: analyst.id,
    },
  });

  await prisma.ticketHistory.upsert({
    where: { id: "seed-history-0001" },
    update: {},
    create: {
      id: "seed-history-0001",
      action: HistoryAction.CREADO,
      detail: "Ticket de ejemplo creado por el seed.",
      ticketId: ticketOne.id,
      userId: admin.id,
    },
  });

  const totals = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.chain.count(),
    prisma.branch.count(),
    prisma.ticket.count(),
  ]);

  console.log(
    `Seed completado: ${totals[0]} usuarios, ${totals[1]} clientes, ${totals[2]} cadenas, ${totals[3]} sucursales y ${totals[4]} tickets.`,
  );
}

main()
  .catch((error) => {
    console.error("No se pudieron cargar los datos iniciales:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
