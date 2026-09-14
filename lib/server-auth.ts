import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true, role: true, chainId: true, clientId: true },
  });
  if (!user?.active || user.role !== session.user.role) return null;
  session.user.chainId = user.chainId;
  session.user.clientId = user.clientId;
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  return session?.user.role === "ADMIN" ? session : null;
}
