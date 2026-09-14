import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { clientAddress, consumeRateLimit } from "@/lib/security";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        const rate = consumeRateLimit(`signin:${clientAddress(new Headers(request.headers as HeadersInit))}:${email}`, 8, 15 * 60_000);
        if (!rate.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email }, include: { client: true } });
        const fallbackHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5dA7zqv3YjrK66nKQKmYC8h6WJ0V5eS";
        const validPassword = await bcrypt.compare(password, user?.passwordHash ?? fallbackHash);
        if (!user?.active) return null;
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
          chainId: user.chainId,
          customerNumber: user.client?.customerNumber,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId;
        token.chainId = user.chainId;
        token.customerNumber = user.customerNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.clientId = token.clientId;
        session.user.chainId = token.chainId;
        session.user.customerNumber = token.customerNumber;
      }
      return session;
    },
  },
};
