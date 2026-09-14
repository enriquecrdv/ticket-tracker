import { z } from "zod";

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();

export const strongPasswordSchema = z.string().min(12).max(100)
  .regex(/[a-z]/, "Incluye una minúscula.")
  .regex(/[A-Z]/, "Incluye una mayúscula.")
  .regex(/\d/, "Incluye un número.")
  .regex(/[^A-Za-z0-9]/, "Incluye un carácter especial.");

export function clientAddress(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headers.get("x-real-ip")
    ?? "local";
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (attempts.size > 10_000) {
    for (const [storedKey, value] of attempts) if (value.resetAt <= now) attempts.delete(storedKey);
  }
  return { allowed: current.count <= limit, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (originUrl.host === requestUrl.host) return true;
    const loopback = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
    return process.env.NODE_ENV === "development"
      && originUrl.port === requestUrl.port
      && loopback.has(originUrl.hostname)
      && loopback.has(requestUrl.hostname);
  } catch {
    return false;
  }
}

export function safeUploadName(name: string) {
  return name.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[\\/]/g, "_").slice(0, 180) || "archivo";
}

const uploadExtensions = new Set([".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".eml", ".msg", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

export async function isAllowedUpload(file: File, extension: string) {
  if (!file.size || !uploadExtensions.has(extension) || file.size > 200 * 1024 * 1024) return false;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (extension === ".pdf") return starts(0x25, 0x50, 0x44, 0x46);
  if ([".png"].includes(extension)) return starts(0x89, 0x50, 0x4e, 0x47);
  if ([".jpg", ".jpeg"].includes(extension)) return starts(0xff, 0xd8, 0xff);
  if (extension === ".webp") return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if ([".docx", ".odt"].includes(extension)) return starts(0x50, 0x4b);
  if ([".doc", ".msg"].includes(extension)) return starts(0xd0, 0xcf, 0x11, 0xe0);
  if (extension === ".rtf") return starts(0x7b, 0x5c, 0x72, 0x74, 0x66);
  return [".txt", ".eml"].includes(extension) && !bytes.includes(0);
}

export function neutralizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
