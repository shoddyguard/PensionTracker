"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { signIn, auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { loginLimiter } from "@/lib/rate-limit";

export type PasswordState = { ok: true } | { ok: false; error: string } | null;

export async function loginAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const username = formData.get("username") as string;
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const key = `${username}:${ip}`;

  // Check for an active lockout before even attempting the credential check.
  const limitState = await loginLimiter.get(key);
  if (limitState && limitState.remainingPoints <= 0) {
    const mins = Math.ceil(limitState.msBeforeNext / 60000);
    return `Too many failed attempts. Try again in ${mins} minute(s).`;
  }

  try {
    await signIn("credentials", {
      username,
      password: formData.get("password") as string,
      redirectTo: "/pensions",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Count this failed attempt against the rate limit key.
      await loginLimiter.consume(key).catch(() => {});
      return "Invalid username or password.";
    }
    // A non-AuthError throw is the NEXT_REDIRECT from a successful signIn.
    // Clear the counter so a legit user doesn't accumulate stale failures.
    await loginLimiter.delete(key).catch(() => {});
    throw error;
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
