"use server";

import { db } from "@/db";
import { pensions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

function parseOpeningBalanceDate(formData: FormData) {
  const dateRaw = (formData.get("opening_balance_date") as string).trim();
  return dateRaw !== "" ? new Date(dateRaw) : null;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function createPension(formData: FormData) {
  await requireAuth();
  const provider = (formData.get("provider") as string).trim();
  const name = (formData.get("name") as string).trim();
  const openingBalanceDate = parseOpeningBalanceDate(formData);

  await db.insert(pensions).values({ provider, name, status: "active", openingBalanceDate });

  revalidatePath("/pensions");
  redirect("/pensions");
}

export async function updatePension(id: number, formData: FormData) {
  await requireAuth();
  const provider = (formData.get("provider") as string).trim();
  const name = (formData.get("name") as string).trim();
  const openingBalanceDate = parseOpeningBalanceDate(formData);

  await db.update(pensions).set({ provider, name, openingBalanceDate }).where(eq(pensions.id, id));

  revalidatePath("/pensions");
  redirect(`/pensions/${id}/settings`);
}

export async function closePension(id: number) {
  await requireAuth();
  await db.update(pensions).set({ status: "closed" }).where(eq(pensions.id, id));
  revalidatePath(`/pensions/${id}`);
  revalidatePath("/pensions");
}

export async function reopenPension(id: number) {
  await requireAuth();
  await db.update(pensions).set({ status: "active" }).where(eq(pensions.id, id));
  revalidatePath(`/pensions/${id}`);
  revalidatePath("/pensions");
}
