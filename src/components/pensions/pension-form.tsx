"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

type PensionFormProps = {
  action: (formData: FormData) => void;
  defaultValues?: {
    provider: string;
    name: string;
    openingBalanceDate?: Date | null;
  };
  cancelHref: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function PensionForm({ action, defaultValues, cancelHref }: PensionFormProps) {
  const defaultDateStr = defaultValues?.openingBalanceDate
    ? defaultValues.openingBalanceDate.toISOString().split("T")[0]
    : "";

  return (
    <form action={action} className="space-y-5 max-w-md">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="provider">
          Provider <span className="text-red-500">*</span>
        </label>
        <input
          id="provider"
          name="provider"
          required
          defaultValue={defaultValues?.provider ?? ""}
          placeholder="e.g. Aviva, Fidelity"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="e.g. Workplace Pension, Personal SIPP"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="opening_balance_date">
          Opening Balance Date
        </label>
        <input
          id="opening_balance_date"
          name="opening_balance_date"
          type="date"
          defaultValue={defaultDateStr}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The date your opening fund balances were recorded. Set per-fund values under Funds.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <Link href={cancelHref} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          Cancel
        </Link>
      </div>
    </form>
  );
}
