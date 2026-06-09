"use client";

import { deleteFund } from "@/actions/funds";

export function DeleteFundButton({ pensionId, id }: { pensionId: number; id: number }) {
  const action = deleteFund.bind(null, pensionId, id);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this fund? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
        Delete
      </button>
    </form>
  );
}
