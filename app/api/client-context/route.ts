import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const session = await requireUser();
  if (session?.user.role !== "CLIENTE" || !session.user.chainId) return NextResponse.json({ error: "Cuenta sin cadena asignada." }, { status: 403 });
  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (code && !/^\d{9}$/.test(code)) return NextResponse.json({ error: "El código debe tener exactamente 9 dígitos." }, { status: 400 });
  const chain = await prisma.chain.findUnique({ where: { id: session.user.chainId }, include: { commercialCondition: true } });
  if (!chain?.active) return NextResponse.json({ error: "Cadena inactiva." }, { status: 403 });
  const client = code ? await prisma.client.findFirst({ where: { chainId: chain.id, customerNumber: code, active: true }, select: { id: true, customerNumber: true, name: true } }) : null;
  const condition = chain.commercialCondition;
  return NextResponse.json({
    chain: { id: chain.id, name: chain.name },
    client,
    commercial: condition ? { credit: condition.credit, contract: condition.contract, creditDays: condition.creditDays, discount: condition.discount, pinc: condition.pinc } : null,
  });
}
