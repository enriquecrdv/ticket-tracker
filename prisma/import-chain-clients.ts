import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../lib/generated/prisma/client";

const [, , chainName, sourceFile] = process.argv;
if (!chainName || !sourceFile) throw new Error("Uso: tsx prisma/import-chain-clients.ts CADENA archivo.txt");
const url = new URL(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1) }) });

async function main() {
  const text = await readFile(sourceFile, "utf8");
  const rows = text.split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => /^\d{9}$/.test(parts[1] ?? "") && parts[2]);
  const chain = await prisma.chain.upsert({ where: { name: chainName }, update: { active: true }, create: { name: chainName } });
  for (const [, customerNumber, name] of rows) {
    await prisma.client.upsert({ where: { customerNumber }, update: { name, chainId: chain.id, active: true }, create: { customerNumber, name, chainId: chain.id } });
  }
  console.log(`${rows.length} números de cliente importados para ${chainName}.`);
}

main().finally(() => prisma.$disconnect());
