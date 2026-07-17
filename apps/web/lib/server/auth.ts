import crypto from "crypto";
import type { AuthRole } from "@helpdesk/shared";

export const SESSION_COOKIE_NAME = "helpdesk_session";

export const REMEMBER_ME_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days in seconds
export const STANDARD_MAX_AGE_SEC = 24 * 60 * 60; // 1 day in seconds

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days validation limit

export interface AuthSession {
  username: string;
  role: AuthRole;
  issuedAt: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

export function validateCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  return username === expectedUsername && password === expectedPassword;
}

export function createSessionCookie(session: { username: string; role: AuthRole }): string {
  const payload = Buffer.from(
    JSON.stringify({
      username: session.username,
      role: session.role,
      issuedAt: Date.now()
    }),
    "utf8"
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function getSessionFromCookie(cookieValue: string): AuthSession | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const legacyTimestamp = Number(payload);
  const issuedAt = Number.isNaN(legacyTimestamp) ? getIssuedAtFromPayload(payload) : legacyTimestamp;
  if (!issuedAt) return null;

  // Check expiration (up to 30 days)
  if (Date.now() - issuedAt > SESSION_MAX_AGE_MS) return null;

  // Verify signature
  const expected = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  if (!Number.isNaN(legacyTimestamp)) {
    return {
      username: process.env.AUTH_USERNAME ?? "admin",
      role: "admin",
      issuedAt
    };
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AuthSession>;
    if (!parsed.username || (parsed.role !== "admin" && parsed.role !== "child")) return null;
    return {
      username: parsed.username,
      role: parsed.role,
      issuedAt
    };
  } catch {
    return null;
  }
}

function getIssuedAtFromPayload(payload: string): number | null {
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { issuedAt?: unknown };
    return typeof parsed.issuedAt === "number" ? parsed.issuedAt : null;
  } catch {
    return null;
  }
}

export function validateSessionCookie(cookieValue: string): boolean {
  return getSessionFromCookie(cookieValue) !== null;
}

export function getRequestSession(request: Request): AuthSession | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((cookie) => {
        const [key, ...rest] = cookie.trim().split("=");
        return [key, rest.join("=")];
      })
  );

  const session = cookies[SESSION_COOKIE_NAME];
  if (!session) return null;

  try {
    return getSessionFromCookie(session);
  } catch {
    return null;
  }
}

export function isRequestAuthenticated(request: Request): boolean {
  return getRequestSession(request) !== null;
}

export function isRequestAdmin(request: Request): boolean {
  return getRequestSession(request)?.role === "admin";
}
