import { db } from "@/db";
import { funds } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { DeleteFundButton } from "@/components/funds/delete-fund-button";
import { FundStatusButton } from "@/components/funds/fund-status-button";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default async function FundsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);

  const fundList = await db
    .select()
    .from(funds)
    .where(eq(funds.pensionId, pensionId))
    .orderBy(asc(funds.name));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Funds</h1>
        <Link
          href={`/pensions/${pensionId}/funds/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Add Fund
        </Link>
      </div>

      {fundList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No funds yet.{" "}
          <Link href={`/pensions/${pensionId}/funds/new`} className="underline hover:text-gray-900 dark:hover:text-gray-50">
            Add your first fund
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Target Allocation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Ticker / ISIN</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Opening Balance</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {fundList.map((fund) => (
                <tr key={fund.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${!fund.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {fund.name}
                    {!fund.isActive && (
                      <span className="ml-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        Retired
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {fund.targetAllocation != null ? `${fund.targetAllocation}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {fund.tickerIsin ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {fund.openingBalance != null ? gbp.format(fund.openingBalance) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/pensions/${pensionId}/funds/${fund.id}/edit`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Edit
                      </Link>
                      <FundStatusButton pensionId={pensionId} id={fund.id} isActive={fund.isActive} />
                      <DeleteFundButton pensionId={pensionId} id={fund.id} />
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
