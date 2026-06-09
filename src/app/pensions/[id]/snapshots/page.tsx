import { db } from "@/db";
import { snapshotEntries, snapshots } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { DeleteSnapshotButton } from "@/components/snapshots/delete-snapshot-button";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default async function SnapshotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);

  const snapshotList = await db
    .select({
      id: snapshots.id,
      date: snapshots.date,
      totalValue: sql<number>`coalesce(sum(${snapshotEntries.value}), 0)`,
    })
    .from(snapshots)
    .leftJoin(snapshotEntries, eq(snapshotEntries.snapshotId, snapshots.id))
    .where(eq(snapshots.pensionId, pensionId))
    .groupBy(snapshots.id)
    .orderBy(desc(snapshots.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Snapshots</h1>
        <Link
          href={`/pensions/${pensionId}/snapshots/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Add Snapshot
        </Link>
      </div>

      {snapshotList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No snapshots yet.{" "}
          <Link
            href={`/pensions/${pensionId}/snapshots/new`}
            className="underline hover:text-gray-900 dark:hover:text-gray-50"
          >
            Add your first snapshot
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Total Value</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {snapshotList.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {s.date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {gbp.format(Number(s.totalValue))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/pensions/${pensionId}/snapshots/${s.id}/edit`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Edit
                      </Link>
                      <DeleteSnapshotButton pensionId={pensionId} id={s.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
