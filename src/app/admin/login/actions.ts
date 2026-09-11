"use server";

import { createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  try {
    const res = await pool.query('SELECT * FROM "AdminUser" WHERE email = $1', [email]);
    
    if (res.rows.length === 0) {
      return { error: "Invalid email or password." };
    }
    
    const user = res.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isPasswordValid) {
      await createSession(email);
      // Successful login redirects to dashboard
      redirect("/admin");
    }
    
    return { error: "Invalid email or password." };
  } catch (error) {
    console.error("Login error:", error);
    // If it's a redirect error from next/navigation, throw it so Next.js can handle it
    if (error && typeof error === 'object' && 'digest' in error && typeof (error as any).digest === 'string' && (error as any).digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return { error: "An error occurred during login. Please try again." };
  }
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}
