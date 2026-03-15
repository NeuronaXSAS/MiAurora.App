const textEncoder = new TextEncoder();
const DEFAULT_TTL_SECONDS = 60 * 10;

export interface ConvexAuthProof {
  version: 1;
  scope: "convex-user";
  userId: string;
  workosUserId: string;
  exp: number;
}

function getAuthSecret(): string {
  const secret =
    process.env.CONVEX_AUTH_PROOF_SECRET ||
    process.env.AUTH_PROOF_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.WORKOS_API_KEY;

  if (!secret) {
    throw new Error(
      "Missing auth proof secret configuration. Set CONVEX_AUTH_PROOF_SECRET, AUTH_PROOF_SECRET, AUTH_SESSION_SECRET, SESSION_SECRET, or WORKOS_API_KEY in both Next.js and Convex environments.",
    );
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createConvexAuthToken(input: {
  userId: string;
  workosUserId: string;
  ttlSeconds?: number;
}): Promise<string> {
  const payload: ConvexAuthProof = {
    version: 1,
    scope: "convex-user",
    userId: input.userId,
    workosUserId: input.workosUserId,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? DEFAULT_TTL_SECONDS),
  };

  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyConvexAuthToken(
  token: string | undefined,
): Promise<ConvexAuthProof | null> {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as ConvexAuthProof;
    if (
      payload.version !== 1 ||
      payload.scope !== "convex-user" ||
      !payload.userId ||
      !payload.workosUserId ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
