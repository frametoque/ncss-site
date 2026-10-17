import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "admin_session";

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not defined. Set a strong secret of at least 32 characters.");
    }
    // Fallback for development if not provided
    return "dev-secret-key-1234567890-must-be-long-enough-32-chars";
  }
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long in production.");
  }
  return secret;
}

export interface AdminSessionPayload {
  email: string;
  [key: string]: unknown;
}

export async function signToken(payload: { email: string }) {
  const secret = new TextEncoder().encode(getJwtSecretKey());
  const alg = "HS256";

  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h") // 2 hours expiration
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(email: string) {
  const token = await signToken({ email });
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  
  return await verifyToken(token);
}

/**
 * Enforces admin authentication for server actions and routes.
 * Throws an unauthorized error if the session is absent or invalid.
 */
export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getSession();
  if (!session || !session.email) {
    throw new Error("Unauthorized: Admin authentication required.");
  }
  return session;
}
