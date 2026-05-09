"use server";

import { db } from "@/db";
import { contributions, funds, pensions, snapshotEntries, snapshots } from "@/db/schema";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function clearDatabase() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Delete child-first since SQLite foreign_keys pragma is off by default
  await db.delete(contributions);
  await db.delete(snapshotEntries);
  await db.delete(snapshots);
  await db.delete(funds);
  await db.delete(pensions);
  redirect("/pensions");
}
