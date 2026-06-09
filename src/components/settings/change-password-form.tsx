"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type PasswordState } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
    >
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<PasswordState, FormData>(changePassword, null);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div className="space-y-1">
        <label htmlFor="current" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Current Password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm New Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
      </div>

      {state?.ok === false && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok === true && <p className="text-sm text-green-600">Password updated successfully.</p>}

      <SubmitButton />
    </form>
  );
}
