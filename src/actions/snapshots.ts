"use server";

import { db } from "@/db";
import { contributions, funds, snapshotEntries, snapshots } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

async function requireSnapshotOwnership(pensionId: number, snapshotId: number) {
  const [snap] = await db
    .select({ id: snapshots.id })
    .from(snapshots)
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.pensionId, pensionId)));
  if (!snap) throw new Error("Not found");
}

async function requireFundsBelongToPension(pensionId: number, fundIds: number[]) {
  if (fundIds.length === 0) return;
  const rows = await db
    .select({ id: funds.id })
    .from(funds)
    .where(and(eq(funds.pensionId, pensionId), inArray(funds.id, fundIds)));
  if (rows.length !== fundIds.length) throw new Error("Invalid fund IDs");
}

type ContributionInput = {
  type: "contribution" | "transfer_in" | "transfer_out";
  amount: string;
};

function parseFormData(formData: FormData) {
  const date = new Date(formData.get("date") as string);
  const fundIds = (formData.get("fundIds") as string)
    .split(",")
    .map(Number)
    .filter(Boolean);

  const entries = fundIds
    .map((fundId) => ({
      fundId,
      sharesHeld: parseFloat((formData.get(`fund_${fundId}_shares`) as string) ?? ""),
      value: parseFloat((formData.get(`fund_${fundId}_value`) as string) ?? ""),
    }))
    .filter((e) => !isNaN(e.sharesHeld) && !isNaN(e.value));

  const contributionInputs: ContributionInput[] = JSON.parse(
    (formData.get("contributions") as string) || "[]"
  );
  const contributionValues = contributionInputs
    .map((c) => ({ type: c.type, amount: parseFloat(c.amount) }))
    .filter((c) => !isNaN(c.amount) && c.amount > 0);

  return { date, entries, contributionValues };
}

export async function createSnapshot(pensionId: number, formData: FormData) {
  await requireAuth();
  const { date, entries, contributionValues } = parseFormData(formData);
  await requireFundsBelongToPension(pensionId, entries.map((e) => e.fundId));

  db.transaction((tx) => {
    const { lastInsertRowid } = tx
      .insert(snapshots)
      .values({ pensionId, date, createdAt: new Date() })
      .run();

    const snapshotId = Number(lastInsertRowid);

    if (entries.length > 0) {
      tx.insert(snapshotEntries)
        .values(entries.map((e) => ({ ...e, snapshotId })))
        .run();
    }
    if (contributionValues.length > 0) {
      tx.insert(contributions)
        .values(contributionValues.map((c) => ({ ...c, snapshotId })))
        .run();
    }
  });

  revalidatePath(`/pensions/${pensionId}/snapshots`);
  redirect(`/pensions/${pensionId}/snapshots`);
}

export async function updateSnapshot(pensionId: number, id: number, formData: FormData) {
  await requireAuth();
  await requireSnapshotOwnership(pensionId, id);
  const { date, entries, contributionValues } = parseFormData(formData);
  await requireFundsBelongToPension(pensionId, entries.map((e) => e.fundId));

  db.transaction((tx) => {
    tx.update(snapshots).set({ date }).where(eq(snapshots.id, id)).run();
    tx.delete(snapshotEntries).where(eq(snapshotEntries.snapshotId, id)).run();
    tx.delete(contributions).where(eq(contributions.snapshotId, id)).run();

    if (entries.length > 0) {
      tx.insert(snapshotEntries)
        .values(entries.map((e) => ({ ...e, snapshotId: id })))
        .run();
    }
    if (contributionValues.length > 0) {
      tx.insert(contributions)
        .values(contributionValues.map((c) => ({ ...c, snapshotId: id })))
        .run();
    }
  });

  revalidatePath(`/pensions/${pensionId}/snapshots`);
  redirect(`/pensions/${pensionId}/snapshots`);
}

export async function deleteSnapshot(pensionId: number, id: number) {
  await requireAuth();
  await requireSnapshotOwnership(pensionId, id);
  await db.delete(snapshots).where(eq(snapshots.id, id));
  revalidatePath(`/pensions/${pensionId}/snapshots`);
}
