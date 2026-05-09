"use client";

import { deleteSnapshot } from "@/actions/snapshots";

export function DeleteSnapshotButton({ pensionId, id }: { pensionId: number; id: number }) {
  const action = deleteSnapshot.bind(null, pensionId, id);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this snapshot? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:text-red-800">
        Delete
      </button>
    </form>
  );
}
