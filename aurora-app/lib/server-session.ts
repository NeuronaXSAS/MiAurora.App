import type { RequestCookies, ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "aurora_session";
export const OAUTH_STATE_COOKIE_NAME = "aurora_oauth_state";
export const OAUTH_CODE_VERIFIER_COOKIE_NAME = "aurora_oauth_code_verifier";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_COOKIE_TTL_SECONDS = 60 * 10;
const textEncoder = new TextEncoder();

export interface AuroraSession {
  version: 1;
  convexUserId: string;
  workosUserId: string;
  email: string;
  exp: number;
}

function getSessionSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.WORKOS_API_KEY;

  if (!secret) {
    throw new Error("Missing session secret configuration");
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(textEncoder.encode(value));
}

function base64UrlToString(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sign(value: string): Promise<string> {
  const secret = getSessionSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function getSessionExpiry(secondsFromNow = SESSION_TTL_SECONDS): number {
  return Math.floor(Date.now() / 1000) + secondsFromNow;
}

export async function createSignedValue(value: string): Promise<string> {
  const payload = stringToBase64Url(value);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedValue(token: string | undefined): Promise<string | null> {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await sign(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return base64UrlToString(payload);
  } catch {
    return null;
  }
}

export async function createSessionToken(session: AuroraSession): Promise<string> {
  return createSignedValue(JSON.stringify(session));
}

export async function verifySessionToken(token: string | undefined): Promise<AuroraSession | null> {
  const raw = await verifySignedValue(token);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuroraSession;
    if (
      parsed.version !== 1 ||
      !parsed.convexUserId ||
      !parsed.workosUserId ||
      !parsed.email ||
      !parsed.exp
    ) {
      return null;
    }

    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function readSession(cookies: Pick<RequestCookies, "get">): Promise<AuroraSession | null> {
  return verifySessionToken(cookies.get(SESSION_COOKIE_NAME)?.value);
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setSessionCookie(
  cookies: Pick<ResponseCookies, "set">,
  session: Omit<AuroraSession, "version" | "exp">,
): Promise<void> {
  const token = await createSessionToken({
    version: 1,
    exp: getSessionExpiry(),
    ...session,
  });

  cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_TTL_SECONDS));
}

export async function setOauthCookies(
  cookies: Pick<ResponseCookies, "set">,
  state: string,
  codeVerifier: string,
): Promise<void> {
  cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    await createSignedValue(state),
    sessionCookieOptions(OAUTH_COOKIE_TTL_SECONDS),
  );
  cookies.set(
    OAUTH_CODE_VERIFIER_COOKIE_NAME,
    await createSignedValue(codeVerifier),
    sessionCookieOptions(OAUTH_COOKIE_TTL_SECONDS),
  );
}

export async function readOauthState(cookies: Pick<RequestCookies, "get">): Promise<string | null> {
  return verifySignedValue(cookies.get(OAUTH_STATE_COOKIE_NAME)?.value);
}

export async function readOauthCodeVerifier(
  cookies: Pick<RequestCookies, "get">,
): Promise<string | null> {
  return verifySignedValue(cookies.get(OAUTH_CODE_VERIFIER_COOKIE_NAME)?.value);
}

export function clearAuthCookies(cookies: Pick<ResponseCookies, "delete">): void {
  cookies.delete(SESSION_COOKIE_NAME);
  cookies.delete(OAUTH_STATE_COOKIE_NAME);
  cookies.delete(OAUTH_CODE_VERIFIER_COOKIE_NAME);
  cookies.delete("workos_access_token");
  cookies.delete("workos_refresh_token");
  cookies.delete("workos_user_id");
  cookies.delete("convex_user_id");
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}
