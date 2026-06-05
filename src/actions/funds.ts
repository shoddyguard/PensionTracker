"use server";

import { db } from "@/db";
import { funds } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

async function requireFundOwnership(pensionId: number, fundId: number) {
  const [fund] = await db
    .select({ id: funds.id })
    .from(funds)
    .where(and(eq(funds.id, fundId), eq(funds.pensionId, pensionId)));
  if (!fund) throw new Error("Not found");
}

export async function createFund(pensionId: number, formData: FormData) {
  await requireAuth();
  const name = (formData.get("name") as string).trim();
  const targetAllocationRaw = formData.get("targetAllocation") as string;
  const tickerIsin = ((formData.get("tickerIsin") as string) ?? "").trim() || null;
  const openingBalanceRaw = (formData.get("openingBalance") as string).trim();

  await db.insert(funds).values({
    pensionId,
    name,
    targetAllocation: targetAllocationRaw ? parseFloat(targetAllocationRaw) : null,
    tickerIsin,
    openingBalance: openingBalanceRaw !== "" ? parseFloat(openingBalanceRaw) : null,
  });

  revalidatePath(`/pensions/${pensionId}/funds`);
  redirect(`/pensions/${pensionId}/funds`);
}

export async function updateFund(pensionId: number, id: number, formData: FormData) {
  await requireAuth();
  await requireFundOwnership(pensionId, id);
  const name = (formData.get("name") as string).trim();
  const targetAllocationRaw = formData.get("targetAllocation") as string;
  const tickerIsin = ((formData.get("tickerIsin") as string) ?? "").trim() || null;
  const openingBalanceRaw = (formData.get("openingBalance") as string).trim();

  await db
    .update(funds)
    .set({
      name,
      targetAllocation: targetAllocationRaw ? parseFloat(targetAllocationRaw) : null,
      tickerIsin,
      openingBalance: openingBalanceRaw !== "" ? parseFloat(openingBalanceRaw) : null,
    })
    .where(eq(funds.id, id));

  revalidatePath(`/pensions/${pensionId}/funds`);
  redirect(`/pensions/${pensionId}/funds`);
}

export async function retireFund(pensionId: number, id: number) {
  await requireAuth();
  await requireFundOwnership(pensionId, id);
  await db.update(funds).set({ isActive: false }).where(eq(funds.id, id));
  revalidatePath(`/pensions/${pensionId}/funds`);
}

export async function reactivateFund(pensionId: number, id: number) {
  await requireAuth();
  await requireFundOwnership(pensionId, id);
  await db.update(funds).set({ isActive: true }).where(eq(funds.id, id));
  revalidatePath(`/pensions/${pensionId}/funds`);
}

export async function deleteFund(pensionId: number, id: number) {
  await requireAuth();
  await requireFundOwnership(pensionId, id);
  await db.delete(funds).where(eq(funds.id, id));
  revalidatePath(`/pensions/${pensionId}/funds`);
}
