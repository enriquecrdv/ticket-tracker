import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    clientId?: string | null;
    chainId?: string | null;
    customerNumber?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      clientId?: string | null;
      chainId?: string | null;
      customerNumber?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    clientId?: string | null;
    chainId?: string | null;
    customerNumber?: string | null;
  }
}
