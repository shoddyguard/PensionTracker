import { db } from "@/db";
import { pensions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updatePension } from "@/actions/pensions";
import { PensionForm } from "@/components/pensions/pension-form";
import { PensionStatusButton } from "@/components/pensions/pension-status-button";

export default async function PensionSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pensionId = parseInt(id);
  const [pension] = await db.select().from(pensions).where(eq(pensions.id, pensionId));
  if (!pension) notFound();

  const action = updatePension.bind(null, pensionId);

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">Details</h2>
        <PensionForm
          action={action}
          cancelHref={`/pensions/${pensionId}`}
          defaultValues={{
            provider: pension.provider,
            name: pension.name,
            openingBalanceDate: pension.openingBalanceDate,
          }}
        />
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Status</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {pension.status === "active"
            ? "This pension is active. Closing it will hide it from active tracking but preserve all historical data."
            : "This pension is closed. You can reopen it at any time."}
        </p>
        <PensionStatusButton id={pension.id} status={pension.status} />
      </div>
    </div>
  );
}
