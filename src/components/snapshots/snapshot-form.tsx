"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Fund = { id: number; name: string };
type ContributionEntry = {
  key: number;
  type: "contribution" | "transfer_in" | "transfer_out";
  amount: string;
};
type SnapshotDefaults = {
  date: string;
  fundEntries: Record<number, { sharesHeld: number; value: number }>;
  contributions: Array<{ type: "contribution" | "transfer_in" | "transfer_out"; amount: string }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Snapshot"}
    </button>
  );
}

export function SnapshotForm({
  funds,
  action,
  defaultValues,
  cancelHref,
}: {
  funds: Fund[];
  action: (formData: FormData) => void;
  defaultValues?: SnapshotDefaults;
  cancelHref: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const initialContribs: ContributionEntry[] = (defaultValues?.contributions ?? []).map(
    (c, i) => ({ key: i, type: c.type, amount: c.amount })
  );
  const [contribs, setContribs] = useState<ContributionEntry[]>(initialContribs);
  const [nextKey, setNextKey] = useState(initialContribs.length);
  const contributionsRef = useRef<HTMLInputElement>(null);

  const addContrib = (type: "contribution" | "transfer_in" | "transfer_out") => {
    setContribs((prev) => [...prev, { key: nextKey, type, amount: "" }]);
    setNextKey((k) => k + 1);
  };

  const removeContrib = (key: number) =>
    setContribs((prev) => prev.filter((c) => c.key !== key));

  const updateAmount = (key: number, amount: string) =>
    setContribs((prev) => prev.map((c) => (c.key === key ? { ...c, amount } : c)));

  const handleSubmit = () => {
    if (contributionsRef.current) {
      contributionsRef.current.value = JSON.stringify(
        contribs.map(({ type, amount }) => ({ type, amount }))
      );
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-8">
      {/* Date */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="date">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date ?? today}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>

      {/* Fund values */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Fund Values</h2>
        <input type="hidden" name="fundIds" value={funds.map((f) => f.id).join(",")} />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fund</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Shares / Units Held
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Value (£)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {funds.map((fund) => (
                <tr key={fund.id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{fund.name}</td>
                  <td className="px-4 py-3">
                    <input
                      name={`fund_${fund.id}_shares`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.000000"
                      defaultValue={defaultValues?.fundEntries[fund.id]?.sharesHeld ?? ""}
                      className="w-36 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                        £
                      </span>
                      <input
                        name={`fund_${fund.id}_value`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        defaultValue={defaultValues?.fundEntries[fund.id]?.value ?? ""}
                        className="w-full pl-6 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Leave blank for any fund not held in this snapshot.</p>
      </div>

      {/* Contributions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Contributions This Period</h2>
        <input type="hidden" name="contributions" ref={contributionsRef} />

        {contribs.length > 0 && (
          <div className="space-y-2 mb-4">
            {contribs.map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                    c.type === "contribution"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : c.type === "transfer_in"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {c.type === "contribution" ? "Contribution" : c.type === "transfer_in" ? "Transfer In" : "Transfer Out"}
                </span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                    £
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={c.amount}
                    onChange={(e) => updateAmount(c.key, e.target.value)}
                    className="w-full pl-6 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeContrib(c.key)}
                  className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addContrib("contribution")}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            + Add Contribution
          </button>
          <button
            type="button"
            onClick={() => addContrib("transfer_in")}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            + Add Transfer In
          </button>
          <button
            type="button"
            onClick={() => addContrib("transfer_out")}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            + Add Transfer Out
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <Link href={cancelHref} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          Cancel
        </Link>
      </div>
    </form>
  );
}
