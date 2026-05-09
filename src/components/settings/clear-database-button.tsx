"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { clearDatabase } from "@/actions/settings";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Clearing..." : "Yes, delete everything"}
    </button>
  );
}

export function ClearDatabaseButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50"
      >
        Clear all data
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-sm text-red-800 font-medium">
        This will permanently delete all pensions, funds, snapshots, and contributions. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <form action={clearDatabase}>
          <ConfirmButton />
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
