import { db } from "@/db";
import { contributions, funds, pensions, snapshotEntries, snapshots } from "@/db/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpChange = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", signDisplay: "exceptZero" });

function formatPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default async function PensionYearHistoryPage({
  params,
}: {
  params: Promise<{ id: string; year: string }>;
}) {
  const { id, year: yearParam } = await params;
  const pensionId = parseInt(id);
  const year = parseInt(yearParam);

  if (isNaN(pensionId) || isNaN(year)) notFound();

  const [pension] = await db.select().from(pensions).where(eq(pensions.id, pensionId));
  if (!pension) notFound();

  // All snapshots for this pension, ascending
  const allSnapshots = await db
    .select({
      id: snapshots.id,
      date: snapshots.date,
      totalValue: sql<number>`coalesce(sum(${snapshotEntries.value}), 0)`,
    })
    .from(snapshots)
    .leftJoin(snapshotEntries, eq(snapshotEntries.snapshotId, snapshots.id))
    .where(eq(snapshots.pensionId, pensionId))
    .groupBy(snapshots.id)
    .orderBy(asc(snapshots.date));

  const yearSnaps = allSnapshots.filter((s) => s.date.getFullYear() === year);
  if (yearSnaps.length === 0) notFound();

  // The snapshot immediately before this year (baseline for the first period return)
  const prevSnap = allSnapshots.findLast((s) => s.date.getFullYear() < year) ?? null;

  // Sum opening balances across all funds for this pension
  const fundList = await db.select().from(funds).where(eq(funds.pensionId, pensionId));
  const ob = fundList.reduce((sum, f) => sum + (f.openingBalance ?? 0), 0);

  // Opening/closing values for summary cards
  const openingValue = prevSnap ? Number(prevSnap.totalValue) : ob;
  const closingValue = Number(yearSnaps[yearSnaps.length - 1].totalValue);

  // Fetch contributions for all relevant snapshot IDs
  const relevantIds = [...(prevSnap ? [prevSnap.id] : []), ...yearSnaps.map((s) => s.id)];
  const contribRows = await db
    .select({
      snapshotId: contributions.snapshotId,
      amount: contributions.amount,
      type: contributions.type,
    })
    .from(contributions)
    .where(inArray(contributions.snapshotId, relevantIds));

  const contribsBySnap: Record<number, typeof contribRows> = {};
  for (const c of contribRows) {
    if (!contribsBySnap[c.snapshotId]) contribsBySnap[c.snapshotId] = [];
    contribsBySnap[c.snapshotId].push(c);
  }

  // Year-level totals for summary cards
  const yearContribRows = yearSnaps.flatMap((s) => contribsBySnap[s.id] ?? []);
  const totalContribs = yearContribRows
    .filter((c) => c.type === "contribution")
    .reduce((sum, c) => sum + c.amount, 0);

  // Per-period rows for this year
  const periodRows = yearSnaps.map((snap, i) => {
    const prev = i === 0 ? prevSnap : yearSnaps[i - 1];
    const value = Number(snap.totalValue);
    const prevValue = prev ? Number(prev.totalValue) : ob > 0 ? ob : null;
    const snapContribs = contribsBySnap[snap.id] ?? [];

    const regularContrib = snapContribs
      .filter((c) => c.type === "contribution")
      .reduce((sum, c) => sum + c.amount, 0);

    const capitalInflows = snapContribs
      .filter((c) => c.type !== "transfer_out")
      .reduce((sum, c) => sum + c.amount, 0);

    const change = prevValue != null ? value - prevValue : null;
    const periodReturn =
      prevValue != null && prevValue > 0
        ? ((value - prevValue - capitalInflows) / prevValue) * 100
        : null;

    const hasTransferIn = snapContribs.some((c) => c.type === "transfer_in");
    const hasTransferOut = snapContribs.some((c) => c.type === "transfer_out");

    return { date: snap.date, value, regularContrib, change, periodReturn, hasTransferIn, hasTransferOut };
  });

  // Time-weighted year return: compound the per-period returns
  let yearReturnFactor = 1;
  let hasYearReturn = false;
  for (const row of periodRows) {
    if (row.periodReturn != null) {
      yearReturnFactor *= 1 + row.periodReturn / 100;
      hasYearReturn = true;
    }
  }
  const yearReturn = hasYearReturn ? (yearReturnFactor - 1) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href={`/pensions/${pensionId}`} className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to {pension.name}
      </Link>

      <h1 className="text-xl font-bold text-gray-900">{year}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Opening Value</p>
          <p className="text-xl font-semibold text-gray-900">
            {openingValue > 0 ? gbp.format(openingValue) : <span className="text-gray-400">-</span>}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Closing Value</p>
          <p className="text-xl font-semibold text-gray-900">{gbp.format(closingValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Contributions</p>
          <p className="text-xl font-semibold text-gray-900">
            {totalContribs > 0 ? gbp.format(totalContribs) : <span className="text-gray-400">-</span>}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Year Return</p>
          <p
            className={`text-xl font-semibold ${
              yearReturn == null ? "text-gray-400" : yearReturn >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {yearReturn == null ? "-" : formatPct(yearReturn)}
          </p>
        </div>
      </div>

      {/* Period detail table */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Snapshots</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Contributions</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Change</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Period Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periodRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {row.date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {row.hasTransferIn && (
                      <span className="ml-2 text-xs font-medium text-green-600">↑ transfer in</span>
                    )}
                    {row.hasTransferOut && (
                      <span className="ml-2 text-xs font-medium text-amber-600">↓ transfer out</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{gbp.format(row.value)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {row.regularContrib > 0 ? (
                      gbp.format(row.regularContrib)
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.change == null ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      gbpChange.format(row.change)
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      row.periodReturn == null
                        ? "text-gray-300"
                        : row.periodReturn >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {row.periodReturn == null ? "-" : formatPct(row.periodReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Period Return excludes contributions and transfers - it reflects market performance only.
        </p>
      </div>
    </div>
  );
}
