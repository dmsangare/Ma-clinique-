import crypto from "crypto";
import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32 && !secret.includes("INSERT_")) return secret;
  if (isProd) {
    // Refuse to boot with a missing/weak secret: a guessable secret lets anyone forge admin tokens.
    throw new Error("JWT_SECRET manquant ou trop court (32 caractères minimum). Démarrage refusé en production.");
  }
  console.warn("[SÉCURITÉ] JWT_SECRET absent : secret aléatoire temporaire (les sessions sautent à chaque redémarrage).");
  return crypto.randomBytes(48).toString("hex");
}

const JWT_SECRET = resolveJwtSecret();

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  clinicId: string;
  allowedModules?: string[];
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h", algorithm: "HS256" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
  } catch (err) {
    return null;
  }
}

// Short-lived, single-purpose ticket for EventSource (which cannot send an Authorization header).
export function generateStreamTicket(userId: string, clinicId: string): string {
  return jwt.sign({ sub: userId, clinicId, purpose: "sse" }, JWT_SECRET, { expiresIn: "60s", algorithm: "HS256" });
}

export function verifyStreamTicket(ticket: string): { sub: string; clinicId: string } | null {
  try {
    const p = jwt.verify(ticket, JWT_SECRET, { algorithms: ["HS256"] }) as any;
    return p.purpose === "sse" ? { sub: p.sub, clinicId: p.clinicId } : null;
  } catch {
    return null;
  }
}
