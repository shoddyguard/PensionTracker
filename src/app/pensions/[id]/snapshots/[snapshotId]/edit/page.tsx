import { db } from "@/db";
import { contributions, funds, snapshotEntries, snapshots } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateSnapshot } from "@/actions/snapshots";
import { SnapshotForm } from "@/components/snapshots/snapshot-form";

export default async function EditSnapshotPage({
  params,
}: {
  params: Promise<{ id: string; snapshotId: string }>;
}) {
  const { id, snapshotId } = await params;
  const pensionId = parseInt(id);
  const snapId = parseInt(snapshotId);

  const [snapshot] = await db.select().from(snapshots).where(eq(snapshots.id, snapId));
  if (!snapshot) notFound();

  const [allFunds, entries, contribs] = await Promise.all([
    db
      .select({ id: funds.id, name: funds.name, isActive: funds.isActive })
      .from(funds)
      .where(eq(funds.pensionId, pensionId))
      .orderBy(asc(funds.name)),
    db.select().from(snapshotEntries).where(eq(snapshotEntries.snapshotId, snapId)),
    db.select().from(contributions).where(eq(contributions.snapshotId, snapId)),
  ]);

  // Show active funds and any retired fund that already has an entry in this snapshot,
  // so users can view or zero out the value on the transition snapshot.
  const entryFundIds = new Set(entries.map((e) => e.fundId));
  const fundList = allFunds.filter((f) => f.isActive || entryFundIds.has(f.id));

  const fundEntries = Object.fromEntries(
    entries.map((e) => [e.fundId, { sharesHeld: e.sharesHeld, value: e.value }])
  );

  const defaultValues = {
    date: snapshot.date.toISOString().split("T")[0],
    fundEntries,
    contributions: contribs.map((c) => ({ type: c.type, amount: String(c.amount) })),
  };

  const action = updateSnapshot.bind(null, pensionId, snapId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pensions/${pensionId}/snapshots`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Snapshots
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Snapshot</h1>
      </div>
      <SnapshotForm funds={fundList} action={action} defaultValues={defaultValues} cancelHref={`/pensions/${pensionId}/snapshots`} />
    </div>
  );
}
