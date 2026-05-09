"use client";

import { closePension, reopenPension } from "@/actions/pensions";

export function PensionStatusButton({
  id,
  status,
}: {
  id: number;
  status: "active" | "closed";
}) {
  if (status === "active") {
    const action = closePension.bind(null, id);
    return (
      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm("Close this pension? It will remain visible for historical reference.")) {
            e.preventDefault();
          }
        }}
      >
        <button type="submit" className="text-sm text-red-600 hover:text-red-800">
          Close Pension
        </button>
      </form>
    );
  }

  const action = reopenPension.bind(null, id);
  return (
    <form action={action}>
      <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
        Reopen Pension
      </button>
    </form>
  );
}
