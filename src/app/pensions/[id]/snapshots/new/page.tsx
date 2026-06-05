import { db } from "@/db";
import { funds } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { createSnapshot } from "@/actions/snapshots";
import { SnapshotForm } from "@/components/snapshots/snapshot-form";

export default async function NewSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);

  const fundList = await db
    .select({ id: funds.id, name: funds.name })
    .from(funds)
    .where(and(eq(funds.pensionId, pensionId), eq(funds.isActive, true)))
    .orderBy(asc(funds.name));

  const action = createSnapshot.bind(null, pensionId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pensions/${pensionId}/snapshots`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Snapshots
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Snapshot</h1>
      </div>

      {fundList.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You need to{" "}
          <Link
            href={`/pensions/${pensionId}/funds/new`}
            className="underline hover:text-gray-900"
          >
            add at least one fund
          </Link>{" "}
          before recording a snapshot.
        </p>
      ) : (
        <SnapshotForm funds={fundList} action={action} cancelHref={`/pensions/${pensionId}/snapshots`} />
      )}
    </div>
  );
}
