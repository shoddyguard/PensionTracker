import { db } from "@/db";
import { funds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateFund } from "@/actions/funds";
import { FundForm } from "@/components/funds/fund-form";
import Link from "next/link";

export default async function EditFundPage({
  params,
}: {
  params: Promise<{ id: string; fundId: string }>;
}) {
  const { id, fundId } = await params;
  const pensionId = parseInt(id);
  const [fund] = await db.select().from(funds).where(eq(funds.id, parseInt(fundId)));

  if (!fund) notFound();

  const action = updateFund.bind(null, pensionId, fund.id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pensions/${pensionId}/funds`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Funds
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Fund</h1>
      </div>
      <FundForm
        action={action}
        cancelHref={`/pensions/${pensionId}/funds`}
        defaultValues={{
          name: fund.name,
          targetAllocation: fund.targetAllocation,
          tickerIsin: fund.tickerIsin,
          openingBalance: fund.openingBalance,
        }}
      />
    </div>
  );
}
