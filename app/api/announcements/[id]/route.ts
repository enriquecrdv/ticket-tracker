import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Solo administración puede modificar comunicados." }, { status: 403 });
  const parsed = z.object({ active: z.boolean() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const { id } = await context.params;
  try {
    await prisma.announcement.update({ where: { id }, data: { active: parsed.data.active } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "El comunicado no existe." }, { status: 404 });
  }
}
