import { createFund } from "@/actions/funds";
import { FundForm } from "@/components/funds/fund-form";
import Link from "next/link";

export default async function NewFundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);
  const action = createFund.bind(null, pensionId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pensions/${pensionId}/funds`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Funds
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Fund</h1>
      </div>
      <FundForm action={action} cancelHref={`/pensions/${pensionId}/funds`} />
    </div>
  );
}
