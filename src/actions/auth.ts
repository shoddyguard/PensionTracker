"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn, auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";

export type PasswordState = { ok: true } | { ok: false; error: string } | null;

export async function loginAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      redirectTo: "/pensions",
    });
  } catch (error) {
    if (error instanceof AuthError) return "Invalid username or password.";
    throw error; // re-throw Next.js redirect and other errors
  }
  return null;
}

export async function changePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth();
  if (!session?.user?.name) return { ok: false, error: "Not authenticated." };

  const current = formData.get("current") as string;
  const newPass = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (newPass !== confirm) return { ok: false, error: "Passwords do not match." };
  if (newPass.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const [user] = await db.select().from(users).where(eq(users.username, session.user.name));
  if (!user) return { ok: false, error: "User not found." };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPass, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { ok: true };
}

export async function createUser(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const username = (formData.get("username") as string).trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!username || !password) return "Username and password are required.";
  if (password !== confirm) return "Passwords do not match.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) redirect("/login");

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ username, passwordHash, createdAt: new Date() });

  redirect("/login");
}
