"use server";

import { createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { authRateLimiter, getClientIp } from "@/lib/rate-limit";

// Pre-computed bcrypt hash for constant-time comparison on invalid emails (prevents account enumeration timing attacks)
const DUMMY_BCRYPT_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

export async function login(prevState: any, formData: FormData) {
  // 1. Rate limiting check (5 attempts per 15 minutes per IP)
  const ip = await getClientIp();
  const rateLimit = authRateLimiter.check(ip);
  if (!rateLimit.success) {
    return {
      error: "Too many login attempts. Please wait 15 minutes before trying again."
    };
  }

  const rawEmail = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const email = rawEmail.trim().toLowerCase();

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  if (email.length > 254 || password.length > 1000) {
    return { error: "Invalid email or password." };
  }

  let shouldRedirect = false;

  try {
    const res = await pool.query('SELECT * FROM "AdminUser" WHERE LOWER(email) = $1', [email]);
    
    if (res.rows.length === 0) {
      // Execute dummy bcrypt comparison to match execution timing
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      return { error: "Invalid email or password." };
    }
    
    const user = res.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isPasswordValid) {
      await createSession(user.email);
      shouldRedirect = true;
    } else {
      return { error: "Invalid email or password." };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred during login. Please try again." };
  }

  if (shouldRedirect) {
    redirect("/admin");
  }
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
