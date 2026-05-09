import { db } from "@/db";
import { contributions, funds, pensions, snapshotEntries, snapshots } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ValueChart } from "@/components/charts/value-chart";
import { annualizedReturnPercent, netInvestedIn, totalReturnPercent } from "@/lib/calculations";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function formatPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default async function PensionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);
  const [pension] = await db.select().from(pensions).where(eq(pensions.id, pensionId));
  if (!pension) notFound();

  const [snapshotData, contribData, fundList] = await Promise.all([
    db
      .select({
        id: snapshots.id,
        date: snapshots.date,
        totalValue: sql<number>`coalesce(sum(${snapshotEntries.value}), 0)`,
      })
      .from(snapshots)
      .leftJoin(snapshotEntries, eq(snapshotEntries.snapshotId, snapshots.id))
      .where(eq(snapshots.pensionId, pensionId))
      .groupBy(snapshots.id)
      .orderBy(asc(snapshots.date)),
    db
      .select({
        snapshotId: contributions.snapshotId,
        amount: contributions.amount,
        type: contributions.type,
      })
      .from(contributions)
      .innerJoin(snapshots, eq(snapshots.id, contributions.snapshotId))
      .where(eq(snapshots.pensionId, pensionId)),
    db.select().from(funds).where(eq(funds.pensionId, pensionId)).orderBy(asc(funds.name)),
  ]);

  const hasData = snapshotData.length > 0;
  const latestSnapshot = hasData ? snapshotData[snapshotData.length - 1] : null;
  const firstSnapshot = hasData ? snapshotData[0] : null;
  const currentValue = latestSnapshot ? Number(latestSnapshot.totalValue) : 0;

  // Individual pension return uses inflows only, transfer_out is an exit event,
  // not a negative investment, and would make the denominator negative.
  // Opening balance is added to invested as it represents prior cost basis.
  const ob = fundList.reduce((sum, f) => sum + (f.openingBalance ?? 0), 0);
  const obDate = pension.openingBalanceDate ?? null;
  const invested = netInvestedIn(contribData) + ob;
  const returnPct = hasData ? totalReturnPercent(currentValue, invested) : null;
  const returnGbp = invested === 0 || !hasData ? null : currentValue - invested;

  // Use opening balance date as start if it predates the first snapshot
  const annReturnStart =
    obDate && firstSnapshot && obDate < firstSnapshot.date ? obDate : firstSnapshot?.date ?? null;
  const annReturn =
    hasData && annReturnStart && latestSnapshot && annReturnStart < latestSnapshot.date
      ? annualizedReturnPercent(currentValue, invested, annReturnStart, latestSnapshot.date)
      : null;

  // Prepend opening balance as first chart point if date is set
  const chartData = [
    ...(ob > 0 && obDate ? [{ date: obDate.toISOString().split("T")[0], value: ob }] : []),
    ...snapshotData.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      value: Number(s.totalValue),
    })),
  ];

  // Fund breakdown from latest snapshot
  let fundBreakdown: Array<{ id: number; name: string; value: number; targetAllocation: number | null }> =
    [];
  if (latestSnapshot) {
    const entries = await db
      .select({ fundId: snapshotEntries.fundId, value: snapshotEntries.value })
      .from(snapshotEntries)
      .where(eq(snapshotEntries.snapshotId, latestSnapshot.id));

    const entryMap = Object.fromEntries(entries.map((e) => [e.fundId, e.value]));
    fundBreakdown = fundList.map((f) => ({
      id: f.id,
      name: f.name,
      value: Number(entryMap[f.id] ?? 0),
      targetAllocation: f.targetAllocation,
    }));
  }

  // Group contributions by snapshot
  const contribsBySnap: Record<number, typeof contribData> = {};
  for (const c of contribData) {
    if (!contribsBySnap[c.snapshotId]) contribsBySnap[c.snapshotId] = [];
    contribsBySnap[c.snapshotId].push(c);
  }

  // Year summary - group snapshots by calendar year
  const snapsByYear: Record<number, typeof snapshotData> = {};
  for (const s of snapshotData) {
    const year = s.date.getFullYear();
    if (!snapsByYear[year]) snapsByYear[year] = [];
    snapsByYear[year].push(s);
  }

  const sortedYears = Object.keys(snapsByYear).map(Number).sort();

  const yearSummary = sortedYears
    .map((year, i) => {
      const yearSnaps = snapsByYear[year];
      const prevYearSnaps = i > 0 ? snapsByYear[sortedYears[i - 1]] : [];
      const prevLastSnap = prevYearSnaps.length > 0 ? prevYearSnaps[prevYearSnaps.length - 1] : null;
      // Fall back to opening balance when there's no prior-year snapshot
      const openingValue = prevLastSnap ? Number(prevLastSnap.totalValue) : ob;
      const closingValue = Number(yearSnaps[yearSnaps.length - 1].totalValue);

      const yearContribRows = yearSnaps.flatMap((s) => contribsBySnap[s.id] ?? []);
      const regularContribs = yearContribRows
        .filter((c) => c.type === "contribution")
        .reduce((sum, c) => sum + c.amount, 0);
      const hasTransferIn = yearContribRows.some((c) => c.type === "transfer_in");
      const hasTransferOut = yearContribRows.some((c) => c.type === "transfer_out");

      // Time-weighted return: compound per-period returns so mid-year cash flows
      // don't distort the percentage relative to the opening balance.
      let yearReturnFactor = 1;
      let hasYearReturn = false;
      for (let j = 0; j < yearSnaps.length; j++) {
        // For the very first period ever, use the opening balance as baseline if available
        const prevValue =
          j === 0
            ? (prevLastSnap ? Number(prevLastSnap.totalValue) : ob > 0 ? ob : null)
            : Number(yearSnaps[j - 1].totalValue);
        if (prevValue == null || prevValue <= 0) continue;
        const value = Number(yearSnaps[j].totalValue);
        const snapContribs = contribsBySnap[yearSnaps[j].id] ?? [];
        const capitalInflows = snapContribs
          .filter((c) => c.type !== "transfer_out")
          .reduce((sum, c) => sum + c.amount, 0);
        yearReturnFactor *= 1 + (value - prevValue - capitalInflows) / prevValue;
        hasYearReturn = true;
      }
      const yearReturn = hasYearReturn ? (yearReturnFactor - 1) * 100 : null;

      return { year, openingValue, closingValue, regularContribs, yearReturn, hasTransferIn, hasTransferOut };
    })
    .reverse();

  const hasTargets = fundBreakdown.some((f) => f.targetAllocation != null);

  return (
    <div className="space-y-8">
      {hasData ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Current Value</p>
              <p className="text-2xl font-semibold text-gray-900">{gbp.format(currentValue)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Net Invested</p>
              <p className="text-2xl font-semibold text-gray-900">{gbp.format(invested)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Total Return</p>
              <p
                className={`text-2xl font-semibold ${
                  returnPct == null ? "text-gray-900" : returnPct >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatPct(returnPct) ?? "N/A"}
              </p>
              {returnGbp != null && (
                <p className="text-xs text-gray-400 mt-0.5">{gbp.format(returnGbp)}</p>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Annualized Return</p>
              <p
                className={`text-2xl font-semibold ${
                  annReturn == null ? "text-gray-400" : annReturn >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatPct(annReturn) ?? "-"}
              </p>
              {annReturn == null && snapshotData.length === 1 && (
                <p className="text-xs text-gray-400 mt-0.5">Need more snapshots</p>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Value Over Time</h2>
            <ValueChart data={chartData} />
          </div>

          {/* Fund breakdown */}
          {fundBreakdown.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Fund Breakdown</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Fund</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Value</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Allocation</th>
                      {hasTargets && (
                        <>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Target</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Drift</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fundBreakdown.map((f) => {
                      const alloc = currentValue > 0 ? (f.value / currentValue) * 100 : 0;
                      const drift = f.targetAllocation != null ? alloc - f.targetAllocation : null;
                      return (
                        <tr key={f.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{gbp.format(f.value)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{alloc.toFixed(1)}%</td>
                          {hasTargets && (
                            <>
                              <td className="px-4 py-3 text-right text-gray-500">
                                {f.targetAllocation != null ? `${f.targetAllocation}%` : "-"}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-medium ${
                                  drift == null
                                    ? "text-gray-400"
                                    : Math.abs(drift) > 5
                                    ? drift > 0
                                      ? "text-orange-600"
                                      : "text-blue-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {drift == null ? "-" : `${drift > 0 ? "+" : ""}${drift.toFixed(1)}%`}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Year summary */}
          {yearSummary.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">History</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Year</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Opening</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Closing</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Contributions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Return</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {yearSummary.map((row) => (
                      <tr key={row.year} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.year}
                          {row.hasTransferIn && (
                            <span className="ml-2 text-xs font-medium text-green-600">↑ transfer in</span>
                          )}
                          {row.hasTransferOut && (
                            <span className="ml-2 text-xs font-medium text-amber-600">↓ transfer out</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {row.openingValue > 0 ? gbp.format(row.openingValue) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{gbp.format(row.closingValue)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {row.regularContribs > 0 ? (
                            gbp.format(row.regularContribs)
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${
                            row.yearReturn == null
                              ? "text-gray-300"
                              : row.yearReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {row.yearReturn == null ? "-" : formatPct(row.yearReturn)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/pensions/${pensionId}/history/${row.year}`}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Return excludes contributions and transfers - it reflects market performance only.
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No snapshots yet.{" "}
          <Link
            href={`/pensions/${pensionId}/snapshots/new`}
            className="underline hover:text-gray-900"
          >
            Add your first snapshot
          </Link>{" "}
          to see performance data.
        </p>
      )}

    </div>
  );
}
