import { createHash, createHmac, createPublicKey, randomBytes, verify } from "node:crypto";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/config";

const PANEL_AUDIENCE = "martendal-leads-panel";
const TOKEN_VERSION = "mk1";
const TOKEN_TTL_SECONDS = 300;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

const PANEL_ISSUER_PUBLIC_KEY = "MCowBQYDK2VwAyEAkMSjXg9FTqKHiYPv7mrcQ59JmtK9IgWcj3YlPUnOTWs";

export const PANEL_SESSION_COOKIE = "martendal_panel_session";

const publicKey = createPublicKey({
  key: Buffer.from(PANEL_ISSUER_PUBLIC_KEY, "base64url"),
  format: "der",
  type: "spki",
});

type VerifiedKey =
  | {
      ok: true;
      jtiHash: string;
      expiresAt: string;
    }
  | {
      ok: false;
      reason: "invalid" | "expired";
    };

type RateLimitResult = {
  allowed?: boolean;
  error?: string;
};

type ConsumeResult = {
  ok?: boolean;
  error?: string;
  expires_at?: string;
};

type SessionResult = {
  valid?: boolean;
};

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function brokerSecret(): string {
  const value = process.env["PANEL_BROKER_SECRET"]?.trim();

  if (!value || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error("panel broker unavailable");
  }

  return value;
}

async function rpc<T>(functionName: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`panel rpc failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function canonicalBase64Url(value: string): Buffer | null {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url");

    if (decoded.toString("base64url") !== value) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function verifyPanelOneTimeKey(token: string): VerifiedKey {
  if (typeof token !== "string" || token.length < 100 || token.length > 1024) {
    return { ok: false, reason: "invalid" };
  }

  const parts = token.split(".");

  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) {
    return { ok: false, reason: "invalid" };
  }

  const payloadSegment = parts[1];
  const signatureSegment = parts[2];

  if (!payloadSegment || !signatureSegment) {
    return { ok: false, reason: "invalid" };
  }

  const payloadBytes = canonicalBase64Url(payloadSegment);
  const signatureBytes = canonicalBase64Url(signatureSegment);

  if (!payloadBytes || !signatureBytes || signatureBytes.length !== 64) {
    return { ok: false, reason: "invalid" };
  }

  const signingInput = `${TOKEN_VERSION}.${payloadSegment}`;

  const validSignature = verify(
    null,
    Buffer.from(signingInput, "ascii"),
    publicKey,
    signatureBytes,
  );

  if (!validSignature) {
    return { ok: false, reason: "invalid" };
  }

  let payload: unknown;

  try {
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, reason: "invalid" };
  }

  const value = payload as Record<string, unknown>;

  const expectedKeys = ["aud", "exp", "iat", "jti", "v"];
  const receivedKeys = Object.keys(value).sort();

  if (
    receivedKeys.length !== expectedKeys.length ||
    !expectedKeys.every((key, index) => key === receivedKeys[index])
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (
    value["v"] !== 1 ||
    value["aud"] !== PANEL_AUDIENCE ||
    typeof value["jti"] !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(value["jti"]) ||
    !Number.isSafeInteger(value["iat"]) ||
    !Number.isSafeInteger(value["exp"])
  ) {
    return { ok: false, reason: "invalid" };
  }

  const iat = value["iat"] as number;
  const exp = value["exp"] as number;
  const now = Math.floor(Date.now() / 1000);

  if (exp - iat !== TOKEN_TTL_SECONDS) {
    return { ok: false, reason: "invalid" };
  }

  if (iat > now + 60 || exp > now + 360) {
    return { ok: false, reason: "invalid" };
  }

  if (exp <= now) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    jtiHash: sha256Hex(value["jti"]),
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function createPanelSession(): {
  token: string;
  hash: string;
} {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    hash: sha256Hex(token),
  };
}

export function sessionHash(token: string): string {
  return sha256Hex(token);
}

function remoteAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";

  return address.slice(0, 200);
}

export async function checkPanelRateLimit(
  request: Request,
): Promise<{ allowed: boolean; rateLimited: boolean }> {
  const secret = brokerSecret();

  const fingerprint = createHmac("sha256", secret)
    .update(remoteAddress(request), "utf8")
    .digest("hex");

  const result = await rpc<RateLimitResult>("panel_v2_rate_limit", {
    p_broker_secret: secret,
    p_fingerprint: fingerprint,
  });

  if (result.error === "unauthorized") {
    throw new Error("panel broker rejected");
  }

  return {
    allowed: result.allowed === true,
    rateLimited: result.error === "rate_limited",
  };
}

export async function consumePanelKey(
  jtiHash: string,
  sessionHashValue: string,
  expiresAt: string,
): Promise<ConsumeResult> {
  return rpc<ConsumeResult>("panel_v2_consume_key", {
    p_broker_secret: brokerSecret(),
    p_jti_hash: jtiHash,
    p_session_hash: sessionHashValue,
    p_key_expires_at: expiresAt,
  });
}

export async function panelSessionIsValid(sessionHashValue: string): Promise<boolean> {
  const result = await rpc<SessionResult>("panel_v2_session_valid", {
    p_broker_secret: brokerSecret(),
    p_session_hash: sessionHashValue,
  });

  return result.valid === true;
}

export async function getPanelTrackingEvents(sessionHashValue: string): Promise<unknown[]> {
  return rpc<unknown[]>("panel_v2_get_tracking_events", {
    p_broker_secret: brokerSecret(),
    p_session_hash: sessionHashValue,
  });
}

export async function destroyPanelSession(sessionHashValue: string): Promise<void> {
  await rpc("panel_v2_logout", {
    p_broker_secret: brokerSecret(),
    p_session_hash: sessionHashValue,
  });
}

export function readPanelSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie");

  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const index = part.indexOf("=");

    if (index === -1) {
      continue;
    }

    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (name === PANEL_SESSION_COOKIE) {
      if (/^[A-Za-z0-9_-]{43}$/.test(value)) {
        return value;
      }

      return null;
    }
  }

  return null;
}

function requestIsHttps(request: Request): boolean {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function panelSessionCookieHeader(request: Request, token: string): string {
  const secure = requestIsHttps(request) ? "; Secure" : "";

  return [
    `${PANEL_SESSION_COOKIE}=${token}`,
    "Path=/api/panel",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearPanelSessionCookieHeader(request: Request): string {
  const secure = requestIsHttps(request) ? "; Secure" : "";

  return [
    `${PANEL_SESSION_COOKIE}=`,
    "Path=/api/panel",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function sameOriginRequest(request: Request): boolean {
  const originHeader = request.headers.get("origin");

  if (!originHeader) {
    return false;
  }

  try {
    const origin = new URL(originHeader);
    const requestUrl = new URL(request.url);

    return origin.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function panelJson(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    pragma: "no-cache",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  });

  if (extraHeaders) {
    new Headers(extraHeaders).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}
