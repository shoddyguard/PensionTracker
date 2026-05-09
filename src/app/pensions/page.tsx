import { db } from "@/db";
import { contributions, funds, pensions, snapshotEntries, snapshots } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ValueChart } from "@/components/charts/value-chart";
import {
  buildAggregateChartData,
  netInvested,
  netInvestedIn,
  totalReturnPercent,
} from "@/lib/calculations";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function formatPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default async function PensionsPage() {
  const [pensionList, snapshotData, contribData, fundObData] = await Promise.all([
    db.select().from(pensions).orderBy(asc(pensions.name)),
    db
      .select({
        id: snapshots.id,
        pensionId: snapshots.pensionId,
        date: snapshots.date,
        totalValue: sql<number>`coalesce(sum(${snapshotEntries.value}), 0)`,
      })
      .from(snapshots)
      .leftJoin(snapshotEntries, eq(snapshotEntries.snapshotId, snapshots.id))
      .groupBy(snapshots.id)
      .orderBy(asc(snapshots.date)),
    db
      .select({
        amount: contributions.amount,
        type: contributions.type,
        pensionId: snapshots.pensionId,
      })
      .from(contributions)
      .innerJoin(snapshots, eq(snapshots.id, contributions.snapshotId)),
    db
      .select({
        pensionId: funds.pensionId,
        totalOpeningBalance: sql<number>`coalesce(sum(${funds.openingBalance}), 0)`,
      })
      .from(funds)
      .groupBy(funds.pensionId),
  ]);

  const obByPension: Record<number, number> = {};
  for (const row of fundObData) {
    obByPension[row.pensionId] = Number(row.totalOpeningBalance);
  }

  // Latest snapshot value per pension
  const latestByPension: Record<number, { date: Date; value: number }> = {};
  for (const s of snapshotData) {
    latestByPension[s.pensionId] = { date: s.date, value: Number(s.totalValue) };
  }

  // Only active pensions contribute to the live total. closed pensions have
  // transferred their money out, so including them would double-count it.
  const activePensionIds = new Set(pensionList.filter((p) => p.status === "active").map((p) => p.id));
  const currentTotalValue = pensionList
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (latestByPension[p.id]?.value ?? 0), 0);

  // Aggregate invested uses the full formula so inter-pension transfers cancel out.
  // Opening balances are added directly, they don't participate in transfer cancellation.
  const totalOpeningBalances = Object.values(obByPension).reduce((sum, v) => sum + v, 0);
  const invested = netInvested(contribData) + totalOpeningBalances;
  const returnPct = totalReturnPercent(currentTotalValue, invested);
  const returnGbp = invested === 0 ? null : currentTotalValue - invested;

  // Chart: last 5 years, active pensions only
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const chartSnapshots = snapshotData
    .filter((s) => s.date >= fiveYearsAgo && activePensionIds.has(s.pensionId))
    .map((s) => ({ pensionId: s.pensionId, date: s.date, value: Number(s.totalValue) }));
  const chartData = buildAggregateChartData(chartSnapshots, [...activePensionIds]);

  // Per-pension contributions
  const contribsByPension: Record<number, typeof contribData> = {};
  for (const c of contribData) {
    if (!contribsByPension[c.pensionId]) contribsByPension[c.pensionId] = [];
    contribsByPension[c.pensionId].push(c);
  }

  const hasAnyData = snapshotData.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/pensions/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          Add Pension
        </Link>
      </div>

      {hasAnyData && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Total Portfolio Value</p>
              <p className="text-2xl font-semibold text-gray-900">{gbp.format(currentTotalValue)}</p>
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
              <p className="text-xs text-gray-500 mb-1">Net Invested</p>
              <p className="text-2xl font-semibold text-gray-900">{gbp.format(invested)}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Portfolio Value (last 5 years)</h2>
            <ValueChart data={chartData} />
          </div>
        </>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Pensions</h2>
        {pensionList.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No pensions yet.{" "}
            <Link href="/pensions/new" className="underline hover:text-gray-900">
              Add your first pension
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Provider</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Current Value</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Return</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pensionList.map((pension) => {
                  const latest = latestByPension[pension.id];
                  const value = latest?.value ?? null;
                  const pContribs = contribsByPension[pension.id] ?? [];
                  const pInvested = netInvestedIn(pContribs) + (obByPension[pension.id] ?? 0);
                  const pReturn = value != null ? totalReturnPercent(value, pInvested) : null;
                  return (
                    <tr key={pension.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/pensions/${pension.id}`} className="hover:underline">
                          {pension.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{pension.provider}</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {value != null ? gbp.format(value) : <span className="text-gray-400">-</span>}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          pReturn == null ? "" : pReturn >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {pReturn != null ? (
                          formatPct(pReturn)
                        ) : (
                          <span className="text-gray-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pension.status === "active" ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/pensions/${pension.id}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
