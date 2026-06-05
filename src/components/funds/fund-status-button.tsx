"use client";

import { reactivateFund, retireFund } from "@/actions/funds";

export function FundStatusButton({
  pensionId,
  id,
  isActive,
}: {
  pensionId: number;
  id: number;
  isActive: boolean;
}) {
  if (isActive) {
    const action = retireFund.bind(null, pensionId, id);
    return (
      <form
        action={action}
        onSubmit={(e) => {
          if (
            !confirm(
              "Retire this fund? It will be hidden from new snapshots but historical data will be preserved."
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" className="text-sm text-amber-600 hover:text-amber-800">
          Retire
        </button>
      </form>
    );
  }

  const action = reactivateFund.bind(null, pensionId, id);
  return (
    <form action={action}>
      <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
        Reactivate
      </button>
    </form>
  );
}
