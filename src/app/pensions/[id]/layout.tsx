import { db } from "@/db";
import { pensions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PensionSubNav } from "@/components/pensions/pension-sub-nav";

export default async function PensionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pension] = await db
    .select()
    .from(pensions)
    .where(eq(pensions.id, parseInt(id)));

  if (!pension) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-50">{pension.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{pension.provider}</span>
            {pension.status === "closed" && (
              <span className="text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full">
                Closed
              </span>
            )}
          </div>
        </div>
        <PensionSubNav pensionId={pension.id} />
      </div>
      {children}
    </div>
  );
}
