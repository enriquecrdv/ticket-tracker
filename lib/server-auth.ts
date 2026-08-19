import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await requireUser();
  return session?.user.role === "ADMIN" ? session : null;
}
