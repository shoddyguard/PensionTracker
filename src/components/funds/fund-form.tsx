"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

type FundFormProps = {
  action: (formData: FormData) => void;
  cancelHref: string;
  defaultValues?: {
    name: string;
    targetAllocation: number | null;
    tickerIsin: string | null;
    openingBalance: number | null;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Fund"}
    </button>
  );
}

export function FundForm({ action, cancelHref, defaultValues }: FundFormProps) {
  return (
    <form action={action} className="space-y-5 max-w-md">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="targetAllocation">
          Target Allocation (%)
        </label>
        <input
          id="targetAllocation"
          name="targetAllocation"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={defaultValues?.targetAllocation ?? ""}
          placeholder="e.g. 60"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-500">Optional. When set, enables the rebalancing indicator.</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="tickerIsin">
          Ticker / ISIN
        </label>
        <input
          id="tickerIsin"
          name="tickerIsin"
          defaultValue={defaultValues?.tickerIsin ?? ""}
          placeholder="e.g. GB00B3X7QG63"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-500">Optional. For future API integration.</p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700" htmlFor="openingBalance">
          Opening Balance
        </label>
        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-gray-900">
          <span className="text-gray-500 mr-1 select-none">£</span>
          <input
            id="openingBalance"
            name="openingBalance"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.openingBalance ?? ""}
            placeholder="0.00"
            className="flex-1 outline-none bg-transparent"
          />
        </div>
        <p className="text-xs text-gray-500">Optional. The value of this fund when you started tracking.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <Link
          href={cancelHref}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
